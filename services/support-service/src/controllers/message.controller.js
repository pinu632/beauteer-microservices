import TicketMessage from '../models/TicketMessage.js';
import Ticket from '../models/Ticket.js';

export const sendMessage = async (req, res) => {
    try {
        const { ticketId, senderType, senderId, message, attachments, isInternal } = req.body;

        const newMessage = new TicketMessage({
            ticketId,
            senderType,
            senderId,
            message,
            attachments,
            isInternal
        });

        await newMessage.save();

        // Update Ticket timestamps or status if needed
        // await Ticket.findByIdAndUpdate(ticketId, { lastResponseAt: new Date() });

        // Emit socket event
        const io = req.app.get('io');
        io.to(ticketId).emit('new_message', newMessage);

        // 🔹 Publish Notification if Agent Reply
        if (senderType === 'AGENT') {
            const ticket = await Ticket.findById(ticketId);
            if (ticket) {
                const { publishToQueue } = await import('../utils/rabbitmq.js');
                const eventData = {
                    ticketId: ticket.ticketId,
                    userId: ticket.userId,
                    message: message,
                    agentId: senderId,
                    sellerId: ticket.sellerId,
                    timestamp: new Date()
                };

                // 1. To Notification Service (for User)
                await publishToQueue('notification_queue', {
                    event: 'SUPPORT_AGENT_REPLIED',
                    data: eventData
                });

                // 2. To Seller Service (if ticket related to seller)
                if (ticket.sellerId) {
                    await publishToQueue('seller_queue', {
                        event: 'SUPPORT_AGENT_REPLIED',
                        data: eventData
                    });
                }
            }
        }

        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const messages = await TicketMessage.find({ ticketId }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
