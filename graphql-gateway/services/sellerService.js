const axios = require('axios');

const SELLER_SERVICE_URL = process.env.SELLER_SERVICE_URL || 'http://localhost:3007/api/v1';

const sellerService = {
    getSellerById: async (id, token) => {
        try {
            const response = await axios.get(`${SELLER_SERVICE_URL}/sellers/${id}`, {
                headers: { Authorization: token }
            });
            return response.data.data;
        } catch (error) {
            console.error("Error fetching seller:", error.message);
            return null;
        }
    },
    getAllSellerOrders: async (token, { status, pageSize, PageNum }) => {
        try {
            const params = new URLSearchParams();
            if (status) params.append('status', status);
            if (pageSize) params.append('pageSize', pageSize);
            if (PageNum) params.append('PageNum', PageNum);

            const response = await axios.get(`${SELLER_SERVICE_URL}/sellers/orders/all?${params.toString()}`, {
                headers: { Authorization: token }
            });
            return response.data; // Return the whole response object for metadata (results, total, pagination)
        } catch (error) {
            console.error("Error fetching all seller orders:", error.message);
            return null;
        }
    }
};

module.exports = sellerService;
