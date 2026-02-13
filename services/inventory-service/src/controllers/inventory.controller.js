import Inventory from '../models/Inventory.js';
import { InventoryLog } from '../models/InventoryLog.js';
import { publishToQueue } from '../workers/publisher.js';
import { QUEUE, INVENTORY_CREATED } from '../constants.js';

// Get all inventory items
export const getInventory = async (req, res) => {
    try {
        const { productId, sellerId } = req.query;
        let query = {};

        if (productId) query.productId = productId;
        if (sellerId) query.sellerId = sellerId;

        const inventory = await Inventory.find(query).populate('productId');
        res.status(200).json(inventory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getInventoryByProductId = async (req, res) => {
    try {
        const inventory = await Inventory.findOne({ productId: req.params.productId });
        if (!inventory) {
            return res.status(404).json({ message: 'Inventory not found' });
        }
        res.status(200).json({ status: 'success', data: inventory });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new inventory item
export const createInventory = async (req, res) => {
    try {
        const { productId, sellerId, currentStock, warehouseLocation } = req.body;
        const newInventory = new Inventory({
            productId,
            sellerId,
            currentStock,
            warehouseLocation
        });
        await newInventory.save();

        // Log the creation
        const log = new InventoryLog({
            productId,
            inventoryId: newInventory._id,
            change: currentStock,
            type: 'INITIAL_STOCK',
            // orderId can be null for initial stock
        });
        await log.save();

        publishToQueue({
            queue_name: QUEUE.PRODUCT_QUEUE,
            event_name: INVENTORY_CREATED,
            data: {
                inventoryId: newInventory._id,
                ...newInventory
            }
        });

        res.status(201).json(newInventory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update stock
export const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { change, type, orderId } = req.body;

        const inventory = await Inventory.findById(id);
        if (!inventory) {
            return res.status(404).json({ message: "Inventory item not found" });
        }

        inventory.currentStock += change;
        await inventory.save();

        const log = new InventoryLog({
            productId: inventory.productId,
            inventoryId: inventory._id,
            change,
            type,
            orderId
        });
        await log.save();

        res.status(200).json(inventory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Bulk Upload Inventory
export const bulkUploadInventory = async (req, res) => {
    try {
        const items = req.body;
        if (!Array.isArray(items)) {
            return res.status(400).json({ message: "Items must be an array" });
        }

        const results = [];
        const errors = [];

        for (const item of items) {
            try {
                const { productId, sellerId, currentStock, warehouseLocation, variantId } = item;

                const newInventory = new Inventory({
                    productId,
                    sellerId,
                    variantId,
                    currentStock,
                    warehouseLocation
                });
                await newInventory.save();

                const log = new InventoryLog({
                    productId,
                    inventoryId: newInventory._id,
                    change: currentStock,
                    type: 'INITIAL_STOCK',
                });
                await log.save();

                await publishToQueue({
                    queue_name: QUEUE.PRODUCT_QUEUE,
                    event_name: INVENTORY_CREATED,
                    data: {
                        inventoryId: newInventory._id,
                        ...newInventory.toObject()
                    }
                });
                results.push(newInventory);
            } catch (err) {
                console.error("Error processing item:", item, err);
                errors.push({ item, error: err.message });
            }
        }

        res.status(201).json({
            message: "Bulk upload processed",
            successCount: results.length,
            errorCount: errors.length,
            results,
            errors
        });

    } catch (error) {
        console.error("Bulk upload error:", error);
        res.status(500).json({ message: error.message });
    }
};
