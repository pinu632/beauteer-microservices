const axios = require('axios');

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006/api/v1';

const notificationService = {
    getNotifications: async (token) => {
        try {
            const response = await axios.get(`${NOTIFICATION_SERVICE_URL}/notifications`, {
                headers: { Authorization: token }
            });
            console.log("Fetched notifications:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error fetching notifications:", error.message);
            return [];
        }
    },
    markRead: async (id, token) => {
        try {
            const response = await axios.put(`${NOTIFICATION_SERVICE_URL}/notifications/${id}/read`, {}, {
                headers: { Authorization: token }
            });
            return response.data.data;
        } catch (error) {
            console.error("Error marking notification read:", error.message);
            return null;
        }
    }
};

module.exports = notificationService;
