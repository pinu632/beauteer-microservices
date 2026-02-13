import { SellerCache } from "../models/sellerCache.model.js";
import { InventoryCache } from "../models/inventoryCache.model.js";

// Seller Handlers
export const handleSellerCreated = async (data) => {
    try {
        await SellerCache.create(data);
        console.log(`✅ SellerCache created for sellerId: ${data.sellerId}`);
    } catch (error) {
        console.error("❌ Error creating SellerCache:", error);
    }
};

export const handleSellerUpdated = async (data) => {
    try {
        await SellerCache.findOneAndUpdate({ sellerId: data.sellerId }, data, { new: true });
        console.log(`✅ SellerCache updated for sellerId: ${data.sellerId}`);
    } catch (error) {
        console.error("❌ Error updating SellerCache:", error);
    }
};

export const handleSellerDeleted = async (data) => {
    try {
        await SellerCache.findOneAndDelete({ sellerId: data.sellerId });
        console.log(`✅ SellerCache deleted for sellerId: ${data.sellerId}`);
    } catch (error) {
        console.error("❌ Error deleting SellerCache:", error);
    }
};

// Inventory Handlers
export const handleInventoryCreated = async (data) => {
    try {
        await InventoryCache.create(data);
        console.log(`✅ InventoryCache created for productId: ${data.productId}`);
    } catch (error) {
        console.error("❌ Error creating InventoryCache:", error);
    }
};

export const handleInventoryUpdated = async (data) => {
    try {
        // Inventory updates might come with inventoryId or productId+variantId
        // Assuming data contains enough info to identify the record.
        // If data has _id (inventoryId), use it. otherwise try unique combo.

        let query = {};
        if (data.inventoryId) {
            query = { inventoryId: data.inventoryId };
        } else if (data._id) {
            query = { inventoryId: data._id };
        } else {
            query = { productId: data.productId, variantId: data.variantId };
        }

        await InventoryCache.findOneAndUpdate(query, data, { new: true, upsert: true });
        console.log(`✅ InventoryCache updated.`);
    } catch (error) {
        console.error("❌ Error updating InventoryCache:", error);
    }
};

export const handleInventoryDeleted = async (data) => {
    try {
        let query = {};
        if (data.inventoryId) {
            query = { inventoryId: data.inventoryId };
        } else if (data._id) {
            query = { inventoryId: data._id };
        } else {
            query = { productId: data.productId, variantId: data.variantId };
        }

        await InventoryCache.findOneAndDelete(query);
        console.log(`✅ InventoryCache deleted.`);
    } catch (error) {
        console.error("❌ Error deleting InventoryCache:", error);
    }
};
