const axios = require('axios');

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003/api/v1';

const orderService = {
    getOrderById: async (id, token) => {
        try {
            const response = await axios.get(`${ORDER_SERVICE_URL}/orders/${id}`, {
                headers: { Authorization: token }
            });
            return response.data; // Helper often returns direct object or wrapped in data
        } catch (error) {
            console.error("Error fetching order:", error.message);
            return null;
        }
    },
    getMyOrders: async (token, userId) => {
        try {
            // We need userId. If not passed, maybe extract from token? 
            // But Gateway resolver should pass it.
            // Actually the endpoint is /user/:userId.
            if (!userId) return [];

            const response = await axios.get(`${ORDER_SERVICE_URL}/orders/user/${userId}`, {
                headers: { Authorization: token }
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching my orders:", error.message);
            return [];
        }
    },
    getOrdersByUser: async (token) => {
        try {
            const response = await axios.get(`${ORDER_SERVICE_URL}/orders`, {

                headers: { Authorization: token }
            });
            return response.data.data;
        } catch (error) {
            console.error("Error fetching user orders:", error.message);
            return [];
        }
    },
    getOrderItemDetails: async (orderItemId, parentOrderId, token) => {
        try {
            const response = await axios.get(`${ORDER_SERVICE_URL}/orders/items/${orderItemId}/${parentOrderId}`, {
                headers: { Authorization: token }
            });
            return response.data.data;
        } catch (error) {
            console.error("Error fetching order item details:", error.message);
            return null;
        }
    },
    getOrderItemById: async (orderItemId, token) => {
        try {
            const response = await axios.get(`${ORDER_SERVICE_URL}/orders/items/${orderItemId}`, {
                headers: { Authorization: token }
            });
            return response.data.data;
        } catch (error) {
            console.error("Error fetching order item:", error.message);
            return null;
        }
    },
    getAllOrders: async (token, status) => {
        try {
            const url = status
                ? `${ORDER_SERVICE_URL}/orders/all/list?status=${status}`
                : `${ORDER_SERVICE_URL}/orders/all/list`;

            const response = await axios.get(url, {
                headers: { Authorization: token }
            });
            return response.data.data;
        } catch (error) {
            console.error("Error fetching all orders:", error.message);
            return [];
        }
    }
};

module.exports = orderService;
