
import { SellerOrder } from "../models/sellerOrders.js";
import { getOrderDetails } from "../utils/orderClient.js";
import { getProductDetails } from "../utils/productClient.js";
import { publishToQueue } from "./publisher.js";
import { EVENTS } from "../constants.js";

// Constants (should be centralized ideally)
const SELLER_ORDERS_CREATED = "SELLER_ORDERS_CREATED";

export const handleStockReserved = async (data) => {
    const { orderId, items: eventItems, userId: eventUserId, paymentMode } = data;
    console.log(`📦 Processing STOCK_RESERVED for Order: ${orderId}`);
    console.log(eventItems)

    try {
        let itemsToProcess = eventItems;
        let userId = eventUserId;

        // Fallback: Fetch order if items/userId not in event
        if (!itemsToProcess || !userId) {
            console.log("⚠️ Event data missing items/userId, fetching from Order Service...");
            const parentOrder = await getOrderDetails(orderId);
            if (!parentOrder) {
                console.error(`ParentOrder not found (via API) for ID: ${orderId}`);
                return;
            }
            itemsToProcess = parentOrder.items;
            userId = parentOrder.userId;
        }

        const sellerMap = {};

        for (const item of itemsToProcess) {
            // Optimisation: Use snapshot data if available
            console.log(item)
            let sellerId = item.sellerId;
            let productDetails = item; // Default to item (snapshot)

            if (!sellerId) {
                // Fallback: Fetch product if sellerId missing in snapshot
                const product = await getProductDetails(item.productId);
                if (!product) {
                    console.warn(`Product not found: ${item.productId}, skipping item.`);
                    continue;
                }
                sellerId = product.sellerId || "ADMIN";
                productDetails = product;
            }

            if (!sellerMap[sellerId]) sellerMap[sellerId] = [];
            sellerMap[sellerId].push({ item, product: productDetails });
        }

        const sellerOrderIds = [];

        for (const sellerId of Object.keys(sellerMap)) {
            const group = sellerMap[sellerId];

            const sellerOrder = await SellerOrder.create({
                parentOrderId: orderId,
                sellerId: sellerId === "ADMIN" ? null : sellerId,
                userId: userId,
                items: group.map(g => ({
                    productId: g.item.productId || g.product._id,
                    titleSnapshot: g.product.title || g.product.titleSnapshot || g.item.title,
                    priceSnapshot: g.product.price || g.product.priceSnapshot || g.item.price,
                    quantity: g.item.quantity,
                    variantId: g.item.variantId
                })),
                status: "PLACED",
                statusHistory: [{ status: "PLACED", date: new Date() }]
            });
            group.forEach(g => {
                sellerOrderIds.push({
                    productId: g.item.productId || g.product._id,
                    sellerOrderId: sellerOrder._id,
                    quantity: g.item.quantity,
                    price: g.product.price || g.product.priceSnapshot || g.item.price,
                    title: g.product.title || g.product.titleSnapshot || g.item.title,
                    variantId: g.item.variantId
                });
            });
        }

        console.log(`Updating ParentOrder ${orderId} with seller orders:`, sellerOrderIds);
        // Publish event to Order Service to update parent order
        await publishToQueue({
            queue_name: "order_queue",
            event_name: SELLER_ORDERS_CREATED,
            data: {
                orderId,
                sellerOrderIds,
                status: "AWAITING_PAYMENT"
            }
        });

        // Fetch total amount if not present, though assuming it might be needed for payment
        // We need finalAmount for payment creation. 
        // If not in event, we might need to fetch order details again if we didn't earlier.

        let finalAmount = 0;
        // Optimization: if we fetched parentOrder earlier (lines 22-29), use it.
        // But scopes might differ. Let's ensure we have it.

        if (data.finalAmount) {
            finalAmount = data.finalAmount;
        } else {
            // Try to get from order details if we fetched them
            // We can fetch again to be safe if not available
            try {
                const orderDetails = await getOrderDetails(orderId);
                finalAmount = orderDetails.finalAmount;
            } catch (err) {
                console.error("Could not fetch finalAmount for payment initiation", err);
            }
        }

        await publishToQueue({
            queue_name: "payment_queue",
            event_name: EVENTS.PAYMENT_INITIATED,
            data: {
                orderId,
                userId,
                paymentMethod: paymentMode || "RAZORPAY", // Default if missing
                finalAmount
            }
        });

        console.log(`✅ Successfully processed STOCK_RESERVED for ${orderId}`);

    } catch (error) {
        console.error("Error handling STOCK_RESERVED:", error);
    }
};

export const handleReturnRequested = async (data) => {
    try {
        console.log("↩️ Processing RETURN_REQUESTED (Seller Service):", data);
        const { sellerOrderId, status } = data;

        const sellerOrder = await SellerOrder.findById(sellerOrderId);
        if (!sellerOrder) {
            console.error(`SellerOrder not found: ${sellerOrderId}`);
            return;
        }

        sellerOrder.status = "RETURN_REQUESTED";
        sellerOrder.statusHistory.push({
            status: "RETURN_REQUESTED",
            date: new Date()
        });

        await sellerOrder.save();
        console.log(`✅ SellerOrder ${sellerOrderId} status updated to RETURN_REQUESTED`);

    } catch (error) {
        console.error("Error handling RETURN_REQUESTED:", error);
    }
};

export const handleReturnStatusUpdated = async (data) => {
    try {
        console.log("🔄 Processing RETURN_STATUS_UPDATED (Seller Service):", data);
        const { sellerOrderId, status } = data;

        const sellerOrder = await SellerOrder.findById(sellerOrderId);
        if (!sellerOrder) {
            console.error(`SellerOrder not found: ${sellerOrderId}`);
            return;
        }

        // Map status if needed. SellerOrder enum: 
        // PLACED, CONFIRMED, PACKED, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, RETURN_REQUESTED, RETURN_RECEIVED, CANCELLED

        let targetStatus = status;
        if (["APPROVED", "PICKUP_SCHEDULED"].includes(status)) {
            targetStatus = "RETURN_REQUESTED"; // Keep it here until received
        } else if (status === "RETURN_RECEIVED") {
            targetStatus = "RETURN_RECEIVED";
        } else if (["REFUND_INITIATED", "REFUNDED"].includes(status)) {
            // SellerOrder doesn't explicitly have REFUNDED in enum (lines 28-38 step 101).
            // It has RETURN_RECEIVED.
            // We can maybe add REFUNDED to enum? Or stick to RETURN_RECEIVED.
            // Let's stick to RETURN_RECEIVED for now or check if we can add it.
            // Usually REFUNDED is final state.
            // Ideally we should add REFUNDED to SellerOrder enum.
            // For now, let's just log or keep as RETURN_RECEIVED.
            targetStatus = "RETURN_RECEIVED";
        }

        // Validate against enum if strictly enforced by mongoose (it is).
        const validStatuses = [
            "PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY",
            "DELIVERED", "RETURN_REQUESTED", "RETURN_RECEIVED", "CANCELLED"
        ];

        if (!validStatuses.includes(targetStatus)) {
            console.warn(`Status ${targetStatus} (mapped from ${status}) not valid for SellerOrder. Skipping.`);
            return;
        }

        sellerOrder.status = targetStatus;
        sellerOrder.statusHistory.push({
            status: targetStatus,
            date: new Date()
        });

        await sellerOrder.save();
        console.log(`✅ SellerOrder ${sellerOrderId} status updated to ${targetStatus}`);

    } catch (error) {
        console.error("Error handling RETURN_STATUS_UPDATED:", error);
    }
};

export const handleShipmentCreated = async (data) => {
    try {
        console.log("📦 Processing SHIPMENT_CREATED (Seller Service):", data);
        const { sellerOrderId, status } = data;

        const sellerOrder = await SellerOrder.findById(sellerOrderId);
        if (!sellerOrder) {
            console.error(`SellerOrder not found: ${sellerOrderId}`);
            return;
        }

        // Shipment Created -> PACKED
        const targetStatus = "PACKED";

        sellerOrder.status = targetStatus;
        sellerOrder.statusHistory.push({
            status: targetStatus,
            date: new Date()
        });

        await sellerOrder.save();
        console.log(`✅ SellerOrder ${sellerOrderId} status updated to ${targetStatus}`);

    } catch (error) {
        console.error("Error handling SHIPMENT_CREATED:", error);
    }
};

export const handleShipmentStatusUpdated = async (data) => {
    try {
        console.log("🚚 Processing SHIPMENT_STATUS_UPDATED (Seller Service):", data);
        const { sellerOrderId, status } = data;

        const sellerOrder = await SellerOrder.findById(sellerOrderId);
        if (!sellerOrder) {
            console.error(`SellerOrder not found: ${sellerOrderId}`);
            return;
        }

        let targetStatus = status;
        // SellerOrder has most statuses so direct mapping might work.
        // Check enum: PLACED, CONFIRMED, PACKED, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, RETURN_REQUESTED, RETURN_RECEIVED, CANCELLED

        const validStatuses = [
            "PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY",
            "DELIVERED", "RETURN_REQUESTED", "RETURN_RECEIVED", "CANCELLED"
        ];

        if (!validStatuses.includes(targetStatus)) {
            console.warn(`Status ${targetStatus} not valid for SellerOrder. Skipping.`);
            return;
        }

        sellerOrder.status = targetStatus;
        sellerOrder.statusHistory.push({
            status: targetStatus,
            date: new Date()
        });

        await sellerOrder.save();
        console.log(`✅ SellerOrder ${sellerOrderId} status updated to ${targetStatus}`);

    } catch (error) {
        console.error("Error handling SHIPMENT_STATUS_UPDATED:", error);
    }
};


export const handleSupportTicketCreated = async (data) => {
    try {
        console.log("🎫 Processing SUPPORT_TICKET_CREATED (Seller Service):", data);
        // data: { ticketId, userId, subject, description, category, timestamp }
        // TODO: Implement logic to notify seller or create a SellerTicket record
        // For now, we just log it as the system is being built.
        // We might want to look up the sellerId from the ticket (if passed) or order.
        // The event data from support service should ideally include sellerId if it's related to an order.

    } catch (error) {
        console.error("Error handling SUPPORT_TICKET_CREATED:", error);
    }
};

export const handleSupportAgentReplied = async (data) => {
    try {
        console.log("💬 Processing SUPPORT_AGENT_REPLIED (Seller Service):", data);
        // data: { ticketId, userId, message, agentId, timestamp }
        // TODO: Notify seller of agent reply if relevant
    } catch (error) {
        console.error("Error handling SUPPORT_AGENT_REPLIED:", error);
    }
};

export const handleOrderItemCancelled = async (data) => {
    try {
        console.log("🚫 Processing ORDER_ITEM_CANCELLED (Seller Service):", data);
        const { sellerOrderId } = data;

        if (!sellerOrderId) {
            console.warn("sellerOrderId missing in ORDER_ITEM_CANCELLED event");
            return;
        }

        // We update the specific SellerOrder status to CANCELLED.
        // WARNING: This assumes the event implies the whole SellerOrder is cancelled 
        // or that SellerOrder status tracks the "most critical" status.
        // Since Schema has single status, we update it.

        await SellerOrder.findByIdAndUpdate(sellerOrderId, {
            $set: { status: "CANCELLED" },
            $push: {
                statusHistory: {
                    status: "CANCELLED",
                    date: new Date()
                }
            }
        });

        console.log(`✅ SellerOrder ${sellerOrderId} status updated to CANCELLED`);

    } catch (error) {
        console.error("Error handling ORDER_ITEM_CANCELLED:", error);
    }
};

export const handleOrderItemUpdate = async (data) => {
    try {
        console.log("ℹ️ Processing ORDER_ITEM_UPDATE (Seller Service):", data);
        const { sellerOrderId, status } = data;

        if (!sellerOrderId || !status) return;

        // Map status if necessary. OrderItem status -> SellerOrder status
        // OrderItem: PLACED, CONFIRMED, PACKED, SHIPPED, DELIVERED, CANCELLED, RETURN_REQUESTED, RETURNED, REFUNDED
        // SellerOrder: PLACED, CONFIRMED, PACKED, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, RETURN_REQUESTED, RETURN_RECEIVED, CANCELLED

        let targetStatus = status;
        if (status === "RETURNED") targetStatus = "RETURN_RECEIVED";
        if (status === "REFUNDED") targetStatus = "RETURN_RECEIVED"; // or ignore

        const validStatuses = [
            "PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY",
            "DELIVERED", "RETURN_REQUESTED", "RETURN_RECEIVED", "CANCELLED"
        ];

        if (!validStatuses.includes(targetStatus)) {
            console.warn(`Status ${targetStatus} not valid for SellerOrder. Skipping.`);
            return;
        }

        await SellerOrder.findByIdAndUpdate(sellerOrderId, {
            $set: { status: targetStatus },
            $push: {
                statusHistory: {
                    status: targetStatus,
                    date: new Date()
                }
            }
        });

        console.log(`✅ SellerOrder ${sellerOrderId} updated to ${targetStatus}`);

    } catch (error) {
        console.error("Error handling ORDER_ITEM_UPDATE:", error);
    }
};
