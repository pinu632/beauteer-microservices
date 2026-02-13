import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';

export const getOrderDetails = async (orderId) => {
    try {
        console.log(orderId)
        const response = await axios.get(`http://product-service:3002/api/v1/products/${orderId}`);
        console.log(response.data)
        if (!response.ok) {
            throw new Error(`Order service responded with status: ${response.status}`);
        }
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error(`Error fetching order ${orderId}:`, error.message);
        throw error;
    }
};


