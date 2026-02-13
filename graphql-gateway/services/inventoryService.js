const axios = require('axios');

const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3008/api/v1';

const inventoryService = {
    getInventoryByProductId: async (productId) => {
        try {
            const response = await axios.get(`${INVENTORY_SERVICE_URL}/inventory`, {
                params: { productId }
            });
            // Result is an array, we might want the first item or all items. 
            // Product.inventory in typeDefs is single object, but inventory might be multiple (sellers). 
            // typeDefs says "Inventory" (singular). 
            // Let's return the first one for now or update typeDefs to [Inventory].
            // Actually, typeDefs has `inventory: Inventory`. 
            // If there are multiple sellers for a product, we should probably return a list.
            // For now, let's return the first one found.
            return response.data && response.data.length > 0 ? response.data[0] : null;
        } catch (error) {
            console.error("Error fetching inventory:", error.message);
            return null;
        }
    },

    getAllInventory: async () => {
        try {
            const response = await axios.get(`${INVENTORY_SERVICE_URL}/inventory`);
            return response.data;
        } catch (error) {
            console.error("Error fetching all inventory:", error.message);
            return [];
        }
    }
};

module.exports = inventoryService;
