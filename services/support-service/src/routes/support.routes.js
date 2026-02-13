import express from 'express';
import { createTicket, getTickets, getTicketById, updateTicketStatus } from '../controllers/ticket.controller.js';
import { sendMessage, getMessages } from '../controllers/message.controller.js';
import { createAgent, getAgents, updateAgentStatus } from '../controllers/agent.controller.js';

const router = express.Router();

// Ticket Routes
router.post('/tickets', createTicket);
router.get('/tickets', getTickets);
router.get('/tickets/:id', getTicketById);
router.patch('/tickets/:id/status', updateTicketStatus);

// Message Routes
router.post('/messages', sendMessage);
router.get('/tickets/:ticketId/messages', getMessages);

// Agent Routes
router.post('/agents', createAgent);
router.get('/agents', getAgents);
router.patch('/agents/:id/status', updateAgentStatus);

export default router;
