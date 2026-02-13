const axios = require('axios');

const SUPPORT_SERVICE_URL = process.env.SUPPORT_SERVICE_URL || 'http://localhost:3009/api/v1';

const supportService = {
    getTickets: async (token) => {
        try {
            const response = await axios.get(`${SUPPORT_SERVICE_URL}/tickets`, {
                headers: { Authorization: token }
            });
            return response.data.data;
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
            return response.data.data;
        } catch (error) {
            console.error("Error fetching ticket:", error.message);
            return null;
        }
    },
    createTicket: async (subject, message, token) => {
        try {
            const response = await axios.post(`${SUPPORT_SERVICE_URL}/tickets`, { subject, message }, {
                headers: { Authorization: token }
            });
            return response.data.data;
        } catch (error) {
            console.error("Error creating ticket:", error.message);
            return null;
        }
    }
};

module.exports = supportService;
