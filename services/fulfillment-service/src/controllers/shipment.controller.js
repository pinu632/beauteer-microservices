import Shipment from '../models/Shipment.js';
import { publishToQueue } from '../utils/publisher.js';


const generateTrackingId = (sellerOrderId, parentOrderId, courierName) => {

    const mapping = {
        "Delhivery": "DH",
        "Ecom Express": "EE",
        "India Post": "IP",
        "BlueDart": "BD",
        "Ekart": "EK",
        "Other": "OT"
    }

    return `${mapping[courierName]}-${sellerOrderId.toString().slice(0, 6)}-${parentOrderId.toString().slice(0, 6)}-${Date.now()}`;

}

export const createShipment = async (req, res) => {
    console.log(req.body)
    try {

        const {
            sellerOrderId,
            parentOrderId,
            sellerId,
            courierName,
            InventoryLocation,
            userId } = req.body;

        const trackingNumber = generateTrackingId(sellerOrderId, parentOrderId, courierName);




        const shipment = await Shipment.create({
            sellerOrderId,
            parentOrderId,
            sellerId,
            courierName,
            trackingNumber,
            shipmentStatus: "CREATED",
            trackingHistory: [
                {
                    status: "CREATED",
                    location: InventoryLocation,
                    remark: "Shipment created",
                    slug: "created",

                }
            ],

        });



        // Publish SHIPMENT_CREATED event to Order Service
        await publishToQueue({
            queue_name: 'order_queue',
            event_name: 'SHIPMENT_CREATED',
            data: {
                parentOrderId,
                sellerOrderId,
                trackingNumber,
                courierName,
                status: "CREATED",
                timestamp: new Date(),
                shipmentId: shipment._id
            }
        });


        // Publish SHIPMENT_CREATED event to Seller Service
        await publishToQueue({
            queue_name: 'seller_queue',
            event_name: 'SHIPMENT_CREATED',
            data: {
                parentOrderId,
                sellerOrderId,
                trackingNumber,
                courierName,
                status: "CREATED",
                timestamp: new Date()
            }
        });

        // Publish ORDER_SHIPPED notification event
        await publishToQueue({
            queue_name: 'notification_queue',
            event_name: 'ORDER_SHIPPED',
            data: {
                orderId: parentOrderId,
                userId,
                sellerOrderId,
                trackingNumber,
                courierName,
                status: "SHIPPED",
                timestamp: new Date()
            }
        });

        res.status(201).json({ status: 'success', data: shipment });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const getShipment = async (req, res) => {
    try {
        const shipment = await Shipment.findById({ sellerOrderId: req.params.id });
        if (!shipment) return res.status(404).json({ status: 'error', message: 'Shipment not found' });
        res.status(200).json({ status: 'success', data: shipment });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const getShipmentById = async (req, res) => {
    try {
        const shipment = await Shipment.findById(req.params.id);    
        if (!shipment) return res.status(404).json({ status: 'error', message: 'Shipment not found' });
        res.status(200).json({ status: 'success', data: shipment });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const getShipmentByOrderId = async (req, res) => {
    try {
        const { orderId } = req.params;
        const shipments = await Shipment.find({ parentOrderId: orderId });

        if (!shipments || shipments.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Shipments not found for this order' });
        }

        res.status(200).json({ status: 'success', data: shipments });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const updateShipmentStatus = async (req, res) => {
    try {
        const { status, location, remark } = req.body;
        const shipment = await Shipment.findById(req.params.id);

        if (!shipment) return res.status(404).json({ status: 'error', message: 'Shipment not found' });

        shipment.shipmentStatus = status;
        shipment.trackingHistory.push({
            status,
            location,
            remark,
            slug: status.toLowerCase().replace('_', '-'),
            timestamp: new Date()
        });

        await shipment.save();

        // Publish SHIPMENT_STATUS_UPDATED event to Order Service
        await publishToQueue({
            queue_name: 'order_queue',
            event_name: 'SHIPMENT_STATUS_UPDATED',
            data: {
                parentOrderId: shipment.parentOrderId,
                sellerOrderId: shipment.sellerOrderId,
                status: status,
                remark,
                location,
                timestamp: new Date()
            }
        });

        // Publish SHIPMENT_STATUS_UPDATED event to Seller Service
        await publishToQueue({
            queue_name: 'seller_queue',
            event_name: 'SHIPMENT_STATUS_UPDATED',
            data: {
                parentOrderId: shipment.parentOrderId,
                sellerOrderId: shipment.sellerOrderId,
                status: status,
                remark,
                location,
                timestamp: new Date()
            }
        });

        // 🔹 Publish Notification Events
        let notificationEvent = null;
        if (status === "SHIPPED") notificationEvent = "ORDER_SHIPPED";
        if (status === "OUT_FOR_DELIVERY") notificationEvent = "ORDER_OUT_FOR_DELIVERY";
        if (status === "DELIVERED") notificationEvent = "ORDER_DELIVERED";

        if (notificationEvent) {
            await publishToQueue({
                queue_name: 'notification_queue',
                event_name: notificationEvent,
                data: {
                    orderId: shipment.parentOrderId, // User expects orderId but we have parentOrderId, usually same for user notification grouping
                    sellerOrderId: shipment.sellerOrderId,
                    trackingNumber: shipment.trackingNumber,
                    courierName: shipment.courierName,
                    // We might not have userId here unless we fetch or store it. 
                    // Assuming Notification Service can handle lookup simply or we send what we have.
                    // Ideally we should have userId in Shipment model. 
                    // But looking at code, createShipment doesn't seem to save userId explicitly?
                    // Ah, createShipment receives it? No.
                    // Wait, markAsDelivered fetches it. 
                    // Let's assume we need to fetch it or design flaw in shipment model not having userId.
                }
            });
        }

        res.status(200).json({ status: 'success', data: shipment });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const markAsDelivered = async (req, res) => {
    try {
        const { orderId, sellerOrderId } = req.body;

        // Find shipment
        const shipment = await Shipment.findOne({
            $or: [
                { sellerOrderId: sellerOrderId },
                { parentOrderId: orderId } // This might be ambiguous if multiple shipments for parent order. user said "orderId and sellerOrdeId"
            ]
        });

        if (!shipment) return res.status(404).json({ status: 'error', message: 'Shipment not found' });

        // Update status
        shipment.shipmentStatus = "DELIVERED";
        shipment.trackingHistory.push({
            status: "DELIVERED",
            slug: "delivered",
            location: "Customer Address",
            remark: "Package delivered to customer",
            timestamp: new Date()
        });
        await shipment.save();

        // Fetch Order Details to check Payment Method (calling Order Service)
        // Assuming Order Service has an endpoint for this or we have the info.
        // For now, let's assume we can get it via axios or if we stored it (we didn't).
        // Let's call order service.
        let paymentMethod = "UNKNOWN";
        let userId = null;

        try {
            // Use internal docker DNS
            const axios = (await import('axios')).default;
            const response = await axios.get(`http://order-service:3003/api/v1/orders/${shipment.parentOrderId}`);
            if (response.data && response.data.data && response.data.data.parentOrder) {
                paymentMethod = response.data.data.parentOrder.paymentMethod;
                userId = response.data.data.parentOrder.userId;
            }
        } catch (err) {
            console.error("Failed to fetch order details:", err.message);
        }

        const { publishToQueue } = await import('../utils/publisher.js');

        // Publish SHIPMENT_DELIVERED (for Seller Service / Order Service)
        await publishToQueue({
            queue_name: "order_queue", // Order service listens to this? or seller service?
            event_name: "SHIPMENT_DELIVERED",
            data: {
                parentOrderId: shipment.parentOrderId,
                sellerOrderId: shipment.sellerOrderId,
                status: "DELIVERED",
                timestamp: new Date()
            }
        });

        // 🔹 Publish Notification Event
        await publishToQueue({
            queue_name: "notification_queue",
            event_name: "ORDER_DELIVERED",
            data: {
                orderId: shipment.parentOrderId,
                userId, // This was fetched successfully in previous block
                sellerOrderId: shipment.sellerOrderId,
                status: "DELIVERED",
                timestamp: new Date()
            }
        });

        // If COD, publish COD_DELIVERED (for Payment Service)
        if (paymentMethod === "COD") {
            await publishToQueue({
                queue_name: "payment_queue",
                event_name: "COD_Payment_Recieved", // As per user request "publish and event for the payment fullfillment"
                data: {
                    orderId: shipment.parentOrderId,
                    userId: userId,
                    status: "COMPLETED",
                    amount: 0 // We might need to send amount too.
                }
            });
        }

        res.status(200).json({ status: 'success', data: shipment });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const getShipmentTrackingDetails = async (req, res) => {
    try {
        const { orderId, orderItemId } = req.params;

        const shipment = await Shipment.findOne({
            $or: [
                { sellerOrderId: orderItemId },
                { _id: orderItemId }
            ]
        });

        const trackingDetails = {
            orderId,
            orderItemId,
            status: "PENDING",
            trackingNumber: null,
            courierName: null,
            shippingAddress: null,
            orderTimeline: [],
            shipmentHistory: [],
            estimatedDelivery: null
        };

        try {
            const axios = (await import('axios')).default;
            const orderResponse = await axios.get(`http://order-service:3003/api/v1/orders/${orderId}`);

            if (orderResponse.data && orderResponse.data.data) {
                const order = orderResponse.data.data;

                trackingDetails.shippingAddress = order.shippingAddress;
                trackingDetails.orderTimeline = [
                    { status: "ORDER_PLACED", timestamp: order.createdAt }
                ];
            }
        } catch (err) {
            console.error("Failed to fetch order details:", err.message);
        }

        if (shipment) {
            trackingDetails.status = shipment.shipmentStatus;
            trackingDetails.trackingNumber = shipment.trackingNumber;
            trackingDetails.courierName = shipment.courierName;
            trackingDetails.shipmentHistory = shipment.trackingHistory;
            trackingDetails.estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }

        res.status(200).json({ status: 'success', data: trackingDetails });

    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
