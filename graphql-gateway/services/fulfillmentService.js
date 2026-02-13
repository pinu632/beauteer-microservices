const axios = require('axios');

const FULFILLMENT_SERVICE_URL = process.env.FULFILLMENT_SERVICE_URL || 'http://localhost:3008/api/v1';

const fulfillmentService = {
    getShipmentByOrderId: async (orderId, token) => {
        try {
            // Assuming endpoint /shipments/order/:orderId exists or similar
            const response = await axios.get(`${FULFILLMENT_SERVICE_URL}/shipments/order/${orderId}`, {
                headers: { Authorization: token }
            });
            return response.data.data;
        } catch (error) {
            console.error("Error fetching shipment:", error.message);
            return null;
        }
    },
    trackShipment: async (id, token) => {
        try {
            const response = await axios.get(`${FULFILLMENT_SERVICE_URL}/shipments/${id}`, {
                headers: { Authorization: token }
            });
            return response.data.data;
        } catch (error) {
            console.error("Error tracking shipment:", error.message);
            return null;
        }
    },
    getShipmentTrackingDetails: async (orderId, orderItemId, token) => {
        try {
            const response = await axios.get(`${FULFILLMENT_SERVICE_URL}/shipments/track/${orderId}/${orderItemId}`, {
                headers: { Authorization: token }
            });
            return response.data.data;
        } catch (error) {
            console.error("Error fetching shipment tracking details:", error.message);
            return null;
        }
    }
};

module.exports = fulfillmentService;
