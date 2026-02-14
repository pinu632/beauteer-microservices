import { ParentOrder } from "../models/parentOrder.model.js";
import OrderItem from "../models/orderItem.model.js";


export const handleSellerOrdersCreated = async (data) => {
    try {
        console.log("📦 Seller Orders Created Handler:", data);
        const { orderId, sellerOrderIds, status } = data;

        const parentOrder = await ParentOrder.findById(orderId);
        if (!parentOrder) {
            console.error(`ParentOrder not found: ${orderId}`);
            return;
        }

        for (const sellerOrder of sellerOrderIds) {
            const { sellerOrderId, productId } = sellerOrder;
            // Scoped to this parent order to avoid collision with other orders for same product
            const item = await OrderItem.findOne({ productId, parentOrderId: orderId });
            if (item) {
                item.sellerOrderId = sellerOrderId;
                await item.save();
            } else {
                console.warn(`OrderItem not found for product ${productId} in order ${orderId}`);
            }
        }

        if (sellerOrderIds && sellerOrderIds.length > 0) {
            // Extract just the IDs since parentOrder.sellerOrders expects [ObjectId]
            parentOrder.sellerOrders = sellerOrderIds.map(so => so.sellerOrderId);
        }
        if (status) {
            parentOrder.status = status;
        }

        await parentOrder.save();
        console.log(`✅ Updated ParentOrder ${orderId} with seller orders and status ${status}`);

    } catch (error) {
        console.error("Error handling seller orders created:", error);
    }
};


export const handlePaymentSuccess = async (data) => {
    try {
        console.log("💰 Payment Success Handler:", data);
        // TODO: Update order status to PAID
    } catch (error) {
        console.error("Error handling payment success:", error);
    }
};

export const handlePaymentFailed = async (data) => {
    try {
        console.log("❌ Payment Failed Handler:", data);
        // TODO: Update order status to FAILED or CANCELLED
    } catch (error) {
        console.error("Error handling payment failure:", error);
    }
};


export const handleInventoryUpdated = async (data) => {
    try {
        console.log("📦 Inventory Updated Handler:", data);
        // TODO: Handle inventory updates if necessary for order validation
    } catch (error) {
        console.error("Error handling inventory update:", error);
    }
};

export const handlePaymentInitiated = async (data) => {
    try {
        console.log("💳 Payment Initiated Handler:", data);
        const { orderId, paymentId, status } = data;

        const parentOrder = await ParentOrder.findById(orderId);
        if (!parentOrder) {
            console.error(`ParentOrder not found: ${orderId}`);
            return;
        }

        parentOrder.paymentId = paymentId;
        // If status is specific (e.g. PENDING_COLLECTION), we might want to update paymentStatus?
        // ParentOrder paymentStatus enum: PENDING, PAID, FAILED, REFUNDED.
        // PENDING_COLLECTION fits "PENDING".
        // INITIATED fits "PENDING".
        // So we might not need to change paymentStatus yet.

        await parentOrder.save();
        console.log(`✅ Linked Payment ${paymentId} to Order ${orderId}`);


    } catch (error) {
        console.error("Error handling payment initiated:", error);
    }
};

export const handleShipmentDelivered = async (data) => {
    try {
        console.log("🚚 Processing SHIPMENT_DELIVERED:", data);
        const { parentOrderId, sellerOrderId, status, timestamp } = data;

        // Update Parent Order
        const parentOrder = await ParentOrder.findById(parentOrderId);
        if (parentOrder && parentOrder.status !== "DELIVERED") {
            parentOrder.status = "DELIVERED";
            await parentOrder.save();
            console.log(`✅ ParentOrder ${parentOrderId} marked as DELIVERED`);
        }

        const orderItem = await OrderItem.findOne({
            sellerOrderId: sellerOrderId,
            parentOrderId: parentOrderId
        })

        if (orderItem) {
            orderItem.status = "DELIVERED";
            orderItem.statusHistory.push({ status: "DELIVERED", date: new Date(timestamp) });
            await orderItem.save();
            console.log(`✅ OrderItem with SellerOrderId ${sellerOrderId} marked as DELIVERED`);
        }

        // We could also update specific seller order if multiple shipments exist
        // But for now, Parent Order status update satisfies requirements.

    } catch (error) {
        console.error("Error handling SHIPMENT_DELIVERED:", error);
    }
};

export const handleReturnRequested = async (data) => {
    try {
        console.log("↩️ Processing RETURN_REQUESTED:", data);
        const { sellerOrderId, status } = data;

        // Update OrderItems associated with this SellerOrder
        const result = await OrderItem.updateMany(
            { sellerOrderId: sellerOrderId },
            {
                $set: { status: "RETURN_REQUESTED" },
                $push: {
                    statusHistory: {
                        status: "RETURN_REQUESTED",
                        date: new Date()
                    }
                }
            }
        );

        console.log(`✅ Updated ${result.modifiedCount} OrderItems to RETURN_REQUESTED for SellerOrder ${sellerOrderId}`);

    } catch (error) {
        console.error("Error handling RETURN_REQUESTED:", error);
    }
};

export const handleReturnStatusUpdated = async (data) => {
    try {
        console.log("🔄 Processing RETURN_STATUS_UPDATED:", data);
        const { sellerOrderId, status } = data;
        

        // Map Fulfillment status to OrderItem status if needed, 
        // or ensure they use same enum. 
        // Fulfillment: REQUESTED, APPROVED, REJECTED, PICKUP_SCHEDULED, RETURN_RECEIVED, REFUND_INITIATED, REFUNDED
        // OrderItem: RETURN_REQUESTED, RETURNED, REFUNDED, (others are delivery related)

        let targetStatus = status;
        // Simple mapping
        if(status === 'APPROVED') targetStatus = 'RETURN_APPROVED';
        if (status === "RETURN_RECEIVED") targetStatus = "RETURNED";
        if (status === "REFUND_INITIATED") targetStatus = "REFUNDED"; // Or close to it
        // If status is not in OrderItem enum, it might fail validation if strict? 
        // OrderItem enum: PLACED, CONFIRMED, PACKED, SHIPPED, DELIVERED, CANCELLED, RETURN_REQUESTED, RETURNED, REFUNDED

        // We might want to be careful.
        const validStatuses = ["RETURN_REQUESTED", "RETURNED", "REFUNDED"];
        if (!validStatuses.includes(targetStatus)) {
            // Maybe just log it or map to closest?
            // "APPROVED", "PICKUP_SCHEDULED" -> Keep as RETURN_REQUESTED?
            if (["APPROVED", "PICKUP_SCHEDULED"].includes(status)) {
                targetStatus = "RETURN_REQUESTED";
            } else if (["REJECTED"].includes(status)) {
                targetStatus = "DELIVERED"; // Revert to delivered? Or specific REJECTED status?
                // OrderItem doesn't have REJECTED.
                console.warn(`Status ${status} not directly supported in OrderItem. Skipping update.`);
                return;
            }
        }

        const result = await OrderItem.updateMany(
            { sellerOrderId: sellerOrderId },
            {
                $set: { status: targetStatus },
                $push: {
                    statusHistory: {
                        status: targetStatus,
                        date: new Date()
                    }
                }
            }
        );

        console.log(`✅ Updated ${result.modifiedCount} OrderItems to ${targetStatus} for SellerOrder ${sellerOrderId}`);

    } catch (error) {
        console.error("Error handling RETURN_STATUS_UPDATED:", error);
    }
};

export const handleShipmentCreated = async (data) => {
    try {
        console.log("📦 Processing SHIPMENT_CREATED:", data);
        const { sellerOrderId, status, shipmentId } = data;

        // Shipment Created usually means items are PACKED
        const targetStatus = "PACKED";

        const updateData = {
            $set: { status: targetStatus },
            $push: {
                statusHistory: {
                    status: targetStatus,
                    date: new Date()
                }
            }
        };

        if (shipmentId) {
            updateData.$set.shipmentId = shipmentId;
        }

        const result = await OrderItem.updateMany(
            { sellerOrderId: sellerOrderId },
            updateData
        );

        console.log(`✅ Updated ${result.modifiedCount} OrderItems to ${targetStatus} with shipmentId ${shipmentId} for SellerOrder ${sellerOrderId}`);

    } catch (error) {
        console.error("Error handling SHIPMENT_CREATED:", error);
    }
};

export const handleShipmentStatusUpdated = async (data) => {
    try {
        console.log("🚚 Processing SHIPMENT_STATUS_UPDATED:", data);
        const { sellerOrderId, status } = data;

        let targetStatus = status;

        // Map common shipment statuses to OrderItem statuses
        if (status === "SHIPPED") targetStatus = "SHIPPED";
        if (status === "OUT_FOR_DELIVERY") targetStatus = "SHIPPED"; // Or add OUT_FOR_DELIVERY to OrderItem enum if supported (it is NOT supported in OrderItem enum shown in step 265, checks: PLACED, CONFIRMED, PACKED, SHIPPED, DELIVERED...)
        // OrderItem Enum: PLACED, CONFIRMED, PACKED, SHIPPED, DELIVERED, CANCELLED, RETURN_REQUESTED, RETURNED, REFUNDED.

        if (status === "DELIVERED") targetStatus = "DELIVERED";
        if (status === "CANCELLED") targetStatus = "CANCELLED";

        if (status === "OUT_FOR_DELIVERY") {
            // OrderItem doesn't specificially track OUT_FOR_DELIVERY usually, 
            // but we can log or ignore update if strict.
            // Or maybe it maps to SHIPPED still.
            console.log("Skipping OrderItem update for OUT_FOR_DELIVERY (not in enum)");
            return;
        }

        const validStatuses = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURN_REQUESTED", "RETURNED", "REFUNDED"];

        if (!validStatuses.includes(targetStatus)) {
            console.warn(`Status ${targetStatus} not valid for OrderItem. Skipping.`);
            return;
        }

        const result = await OrderItem.updateMany(
            { sellerOrderId: sellerOrderId },
            {
                $set: { status: targetStatus },
                $push: {
                    statusHistory: {
                        status: targetStatus,
                        date: new Date()
                    }
                }
            }
        );

        console.log(`✅ Updated ${result.modifiedCount} OrderItems to ${targetStatus} for SellerOrder ${sellerOrderId}`);

    } catch (error) {
        console.error("Error handling SHIPMENT_STATUS_UPDATED:", error);
    }
};

