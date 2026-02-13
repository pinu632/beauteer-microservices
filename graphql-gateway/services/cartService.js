const axios = require('axios');

const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://localhost:3005/api/v1';

const cartService = {
    getCart: async (token) => {
        try {
            console.log(token);
            const response = await axios.get(`${CART_SERVICE_URL}/cart`, {
                headers: { Authorization: token }
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching cart:", error.message);
            return null;
        }
    },
    addToCart: async (productId, quantity, token) => {
        try {
            const response = await axios.post(`${CART_SERVICE_URL}/cart/add`, { productId, quantity }, {
                headers: { Authorization: token }
            });
            return response.data.data;
        } catch (error) {
            console.error("Error adding to cart:", error.message);
            return null;
        }
    },
    removeFromCart: async (productId, token) => {
        try {
            const response = await axios.post(`${CART_SERVICE_URL}/cart/remove`, { productId }, {
                headers: { Authorization: token }
            });
            return response.data.data;
        } catch (error) {
            console.error("Error removing from cart:", error.message);
            return null;
        }
    }
};

module.exports = cartService;
