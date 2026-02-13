import Inventory from "../models/Inventory.js";
import { publishToQueue } from "./publisher.js";
import { ORDER_FAILED, STOCK_RESERVED } from "../constants/eventConstant.js";

export const handleOrderCreated = async (data) => {
    const { orderId, items, userId, paymentMode, finalAmount } = data;
    console.log(`Checking stock for Order: ${orderId}`);

    try {
        // 1. Check if sufficient stock exists for ALL items
        for (const item of items) {
            const inventory = await Inventory.findOne({ productId: item.productId });

            if (!inventory) {
                console.error(`Inventory not found for Product: ${item.productId}`);
                await publishToQueue({
                    queue_name: "order_queue",
                    event_name: ORDER_FAILED,
                    data: {
                        orderId,
                        reason: `Product ${item.productId} not found`
                    }
                });
                return;
            }

            if (inventory.currentStock < item.quantity) {
                console.warn(`Insufficient stock for Product: ${item.productId}`);
                await publishToQueue({
                    queue_name: "order_queue",
                    event_name: ORDER_FAILED,
                    data: {
                        orderId,
                        reason: `Insufficient stock for Product ${item.productId}`
                    }
                });
                return;
            }
        }

        // 2. Reserve Stock (All checks passed)
        for (const item of items) {
            await Inventory.findOneAndUpdate(
                { productId: item.productId },
                {
                    $inc: {
                        currentStock: -item.quantity,
                        reservedStock: item.quantity
                    }
                }
            );
        }

        console.log(`✅ Stock reserved for Order: ${orderId}`);

        // 3. Publish Success Event
        // Optimized: Send to seller_queue and include items to reduce API calls downstream
        await publishToQueue({
            queue_name: "seller_queue",
            event_name: STOCK_RESERVED,
            data: {
                orderId,
                items,
                userId,
                paymentMode,
                finalAmount
            }
        });

    } catch (error) {
        console.error("Error handling order creation:", error);
        // Ensure we communicate failure even on system error if possible
        await publishToQueue({
            queue_name: "order_queue",
            event_name: ORDER_FAILED,
            data: {
                orderId,
                reason: "Inventory Service System Error"
            }
        });
    }
};

export const handleOrderItemCancelled = async (data) => {
    try {
        console.log("Processing Order Item Cancellation (Inventory Release):", data);
        const { productId, quantity } = data;

        const inventory = await Inventory.findOne({ productId });

        if (!inventory) {
            console.error(`Inventory not found for Product: ${productId}`);
            return;
        }

        // Release reserved stock back to current stock
        inventory.reservedStock = Math.max(0, inventory.reservedStock - quantity);
        inventory.currentStock += quantity;

        await inventory.save();
        console.log(`✅ Stock released for Product: ${productId}, Quantity: ${quantity}`);

    } catch (error) {
        console.error("Error handling order item cancellation:", error);
    }
};
