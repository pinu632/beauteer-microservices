const axios = require('axios');

const SUPPORT_SERVICE_URL = process.env.SUPPORT_SERVICE_URL || 'http://localhost:3009/api/v1/support';

const supportService = {
    getAllTickets: async (token, { status, priority, assignedAgentId } = {}) => {
        try {
            const params = new URLSearchParams();
            if (status) params.append('status', status);
            if (priority) params.append('priority', priority);
            if (assignedAgentId) params.append('assignedAgentId', assignedAgentId);

            const query = params.toString();
            const url = query
                ? `${SUPPORT_SERVICE_URL}/support/tickets/list/all?${query}`
                : `${SUPPORT_SERVICE_URL}/support/tickets/list/all`;

            const response = await axios.get(url, {
                headers: { Authorization: token }
            });

            return response.data.data || response.data;
        } catch (error) {
            console.error("Error fetching all tickets:", error.message);
            return [];
        }
    },
    getTickets: async (token) => {
        try {
            const response = await axios.get(`${SUPPORT_SERVICE_URL}/tickets`, {
                headers: { Authorization: token }
            });
            return response.data.data || response.data;
        } catch (error) {
            console.error("Error fetching tickets:", error.message);
            return [];
        }
    },
    getTicketById: async (id, token) => {
        try {
            const response = await axios.get(`${SUPPORT_SERVICE_URL}/tickets/${id}`, {
                headers: { Authorization: token }
            });
            return response.data.data || response.data;
        } catch (error) {
            console.error("Error fetching ticket:", error.message);
            return null;
        }
    },
    getTicketMessages: async (ticketId, token) => {
        try {
            const response = await axios.get(`${SUPPORT_SERVICE_URL}/support/tickets/by-id/${ticketId}/messages`, {
                headers: { Authorization: token }
            });
            return response.data.data || response.data;
        } catch (error) {
            console.error("Error fetching ticket messages:", error.message);
            return [];
        }
    },
    createTicket: async (subject, message, token) => {
        try {
            const response = await axios.post(`${SUPPORT_SERVICE_URL}/tickets`, { subject, message }, {
                headers: { Authorization: token }
            });
            return response.data.data || response.data;
        } catch (error) {
            console.error("Error creating ticket:", error.message);
            return null;
        }
    }
};

module.exports = supportService;
