import Ticket from '../models/Ticket.js';
import TicketActivityLog from '../models/TicketActivityLog.js';
import { getChannel } from '../utils/rabbitmq.js';

export const createTicket = async (req, res) => {
    try {
        // userId from auth middleware (to be implemented/mocked for now or passed in body)
        const { userId, sellerOrderId, orderItemId,sellerId, subject, description, type, category, subCategory, priority, source, images } = req.body;

        console.log('Creating ticket with data:', req.body);
        const ticketId = `TKT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
       

        const newTicket = new Ticket({
            ticketId,
            userId,
            sellerOrderId,
            orderItemId, // Optional, if ticket is related to specific order item
            sellerId,
            subject,
            description,
            type,
            category,
            subCategory,
            priority,
            source,
            images // Assuming schema update or just ignore if not in schema yet
        });

        await newTicket.save();

        // Log Activity
        await TicketActivityLog.create({
            ticketId: newTicket._id,
            action: 'CREATED',
            performedBy: userId,
            meta: { source }
        });

        // Publish Event (Notification)
        const { publishToQueue } = await import('../utils/rabbitmq.js');
        const eventData = {
            ticketId: newTicket.ticketId,
            userId,
            subject,
            description,
            category,
            sellerId, // Important for seller service
            timestamp: new Date()
        };

        // 1. To Notification Service (for User)
        await publishToQueue('notification_queue', {
            event: 'SUPPORT_TICKET_CREATED',
            data: eventData
        });

        // 2. To Seller Service (if ticket related to seller)
        if (sellerId) {
            await publishToQueue('seller_queue', {
                event: 'SUPPORT_TICKET_CREATED',
                data: eventData
            });
        }

        res.status(201).json(newTicket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTickets = async (req, res) => {
    try {
        const { userId, status, assignedAgentId } = req.query;
        const query = {};
        if (userId) query.userId = userId;
        if (status) query.status = status;
        if (assignedAgentId) query.assignedAgentId = assignedAgentId;

        const tickets = await Ticket.find(query).sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateTicketStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const ticket = await Ticket.findByIdAndUpdate(req.params.id, { status }, { new: true });

        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        // Log Activity
        await TicketActivityLog.create({
            ticketId: ticket._id,
            action: 'STATUS_UPDATED',
            performedBy: req.body.userId, // Valid user ID required
            meta: { oldStatus: 'UNKNOWN', newStatus: status }
        });

        // Emit socket event

        const channel = getChannel();
        if (channel) {
            const event = {
                event: 'TICKET_STATUS_UPDATED',
                payload: { ticketId: ticket.ticketId, status, userId: req.body.userId }
            };
            channel.sendToQueue('notification_queue', Buffer.from(JSON.stringify(event)));
        }



        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
