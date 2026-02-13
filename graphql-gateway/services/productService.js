const axios = require('axios');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002/api/v1';

const productService = {
    getProductById: async (id) => {
        try {
            const response = await axios.get(`${PRODUCT_SERVICE_URL}/products/${id}`);
            console.log(response.data, "response.data")
            // Check if response is wrapped in a data property (common pattern)
            return response.data.data || response.data;
        } catch (error) {
            console.error("Error fetching product:", error.message);
            return null;
        }
    },
    getAllProducts: async (params) => {
        try {
            const response = await axios.get(`${PRODUCT_SERVICE_URL}/products`, { params });
            console.log("Products response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error fetching products:", error);
            console.error("Error fetching products:", error.message);
            return [];
        }
    },
    getPopularProducts: async ({ page, limit }) => {
        try {
            const response = await axios.get(`${PRODUCT_SERVICE_URL}/products/popular`, {
                params: { pageNum: page, pageSize: limit }
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching popular products:", error.message);
            return [];
        }
    },
    getRecommendedProducts: async () => {
        try {
            const response = await axios.get(`${PRODUCT_SERVICE_URL}/products/recommended`);
            return response.data;
        } catch (error) {
            console.error("Error fetching recommended products:", error.message);
            return [];
        }
    },
    getAllCategories: async () => {
        try {
            const response = await axios.get(`${PRODUCT_SERVICE_URL}/categories`);
            // The product service wrapper usually returns { success: true, count: N, data: [...] }
            // We need to return the array.
            return response.data.data;
        } catch (error) {
            console.error("Error fetching categories:", error.message);
            return [];
        }
    },
    getAllBrands: async () => {
        try {
            const response = await axios.get(`${PRODUCT_SERVICE_URL}/brands`);
            return response.data.data;
        } catch (error) {
            console.error("Error fetching brands:", error.message);
            return [];
        }
    }
};

module.exports = productService;
