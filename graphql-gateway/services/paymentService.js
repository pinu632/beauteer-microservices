const axios = require('axios');

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004/api/v1';

const paymentService = {
    getPaymentById: async (id, token) => {
        try {
            const response = await axios.get(`${PAYMENT_SERVICE_URL}/payments/${id}`, {
                headers: { Authorization: token }
            });
            return response.data.data;
        } catch (error) {
            console.error("Error fetching payment:", error.message);
            return null;
        }
    },

    getPaymentByOrderId: async (orderId, token) => {
        try {
            const response = await axios.get(`${PAYMENT_SERVICE_URL}/payments/order/${orderId}`, {
                headers: { Authorization: token }
            });
            return response.data.data;
        } catch (error) {
            // console.error("Error fetching payment by order:", error.message); 
            // It is normal not to find payment for new orders
            return null;
        }
    },
    getAllPaymentLogs: async (token, params = {}) => {
        try {
            const response = await axios.get(`${PAYMENT_SERVICE_URL}/payments/logs`, {
                headers: { Authorization: token },
                params
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching payment logs:", error.message);
            return null;
        }
    }

};

module.exports = paymentService;
