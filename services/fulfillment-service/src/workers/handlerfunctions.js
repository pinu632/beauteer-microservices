import Shipment from '../models/Shipment.js';

export const handlePaymentSuccess = async (data) => {
    try {
        console.log("Processing PAYMENT_SUCCESS for fulfillment:", data);
        const { orderId, userId, items, address, sellerOrders } = data;
        // Note: sellerOrders might be array of sellerOrderIds or objects.
        // The shipment model expects sellerOrderId.
        // If we get a parent order payment success, we might need to create multiple shipments if there are multiple text seller orders?
        // Or one shipment per seller order? 
        // The model has `sellerOrderId`. So likely one shipment per seller order.

        // Logic:
        // 1. If `data` contains `sellerOrders` (array), iterate and create shipment for each.
        // 2. If `data` is just parent order info, we might need to fetch seller orders.

        // Assuming data comes from Payment Service which might just have `orderId`.
        // We might need to fetch order details from Order Service if not fully populated.

        // For now, let's assume we receive necessary info or simple implementation.
        // If we don't have sellerOrderId, we can't create a valid shipment based on the schema.

        // Placeholder implementation:
        // verify if sellerOrders exists in data
        if (data.sellerOrders && Array.isArray(data.sellerOrders)) {
            for (const sOrder of data.sellerOrders) {
                await Shipment.create({
                    sellerOrderId: sOrder._id || sOrder,
                    parentOrderId: orderId,
                    sellerId: sOrder.sellerId, // Need this from somewhere
                    shipmentStatus: "CREATED",
                    trackingHistory: [{
                        status: "CREATED",
                        slug: "created",
                        location: "Warehouse",
                        remark: "Shipment created automatically after payment",
                        timestamp: new Date()
                    }]
                });
                console.log(`Shipment created for Seller Order ${sOrder._id || sOrder}`);
            }
        } else {
            console.log("No seller orders found in payload, cannot create specific shipments yet. Might need order lookup.");
        }

    } catch (error) {
        console.error("Error handling PAYMENT_SUCCESS:", error);
    }
};
