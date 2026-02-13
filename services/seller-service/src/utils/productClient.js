import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';

export const getProductDetails = async (productId) => {
    try {
        const response = await axios.get(`http://product-service:3002/api/v1/products/${productId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching product ${productId}:`, error.message);
        throw error;
    }
};
