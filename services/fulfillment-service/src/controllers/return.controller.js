import Return from '../models/Return.js';
import Shipment from '../models/Shipment.js';
import { publishToQueue } from '../utils/publisher.js';



export const getAllReturns = async (req, res) => {
    try {
        const query = {};
        const role = req.user?.role;

        // Non-admin users can only view their own return requests.
        if (role !== 'admin' && role !== 'super-admin') {
            query.userId = req.user?.id;
        }

        const returns = await Return.find(query).sort({ createdAt: -1 });
        res.status(200).json({ status: 'success', results: returns.length, data: returns });
    } catch (error) {
        console.log(err.message)
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const requestReturn = async (req, res) => {
    try {

        const { sellerOrderId, reason, description, images, refundAmount } = req.body;
        const shipment = await Shipment.findOne({ sellerOrderId: sellerOrderId });
        if (!shipment) {
            return res.status(404).json({ status: 'error', message: 'Shipment not found for the given sellerOrderId' });
        }

        const body = {
            sellerOrderId,
            shipmentId: shipment._id,
            userId: req.user.id,
            reason,
            description,
            images,
           
        }
        const returnReq = await Return.create(body);

        // Fetch Shipment to get parentOrderId for event
        let parentOrderId = null;
        if (shipment) {
            parentOrderId = shipment.parentOrderId;
        } else {
            console.warn(`Shipment not found for sellerOrderId ${sellerOrderId} while creating return request ${returnReq._id}`);
        }

        await publishToQueue({
            queue_name: 'order_queue',
            event_name: 'RETURN_REQUESTED',
            data: {
                returnId: returnReq._id,
                sellerOrderId: returnReq.sellerOrderId,
                parentOrderId,
                reason: returnReq.reason,
                refundAmount: returnReq.refundAmount,
                status: returnReq.status
            }
        });

        res.status(201).json({ status: 'success', data: returnReq });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const updateReturnStatus = async (req, res) => {
    try {
        const { status, remark } = req.body;
        const returnReq = await Return.findById(req.params.id);

        if (!returnReq) return res.status(404).json({ status: 'error', message: 'Return request not found' });

        console.log(status)
        returnReq.status = status;
        returnReq.events.push({
            status,
            remark,
            date: new Date()
        });

        await returnReq.save();

        // Publish Event
        await publishToQueue({
            queue_name: 'order_queue',
            event_name: 'RETURN_STATUS_UPDATED',
            data: {
                returnId: returnReq._id,
                sellerOrderId: returnReq.sellerOrderId,
                status: returnReq.status,
                remark
            }
        });

        res.status(200).json({ status: 'success', data: returnReq });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const confirmReturnPickup = async (req, res) => {
    try {
        const { id } = req.params;
        const { condition, remark } = req.body;

        const returnReq = await Return.findById(id);

        if (!returnReq) {
            return res.status(404).json({ status: 'error', message: 'Return request not found' });
        }

        if (returnReq.status !== 'APPROVED' && returnReq.status !== 'PICKUP_SCHEDULED') {
            return res.status(400).json({ status: 'error', message: 'Return request is not in a valid state for pickup' });
        }

        if (condition === 'A') {
            // Condition A: Good condition, proceed to refund
            returnReq.status = 'RETURN_RECEIVED';
            returnReq.events.push({
                status: 'RETURN_RECEIVED',
                remark: remark || 'Item picked up in good condition',
                date: new Date()
            });

            // Fetch Shipment to get parentOrderId
            let parentOrderId = null;
            if (returnReq.shipmentId) {
                const shipment = await Shipment.findById(returnReq.shipmentId);
                if (shipment) {
                    parentOrderId = shipment.parentOrderId;
                }
            } else {
                console.warn(`Return ${returnReq._id} has no shipmentId. Attempting to find shipment by sellerOrderId.`);
                const shipment = await Shipment.findOne({ sellerOrderId: returnReq.sellerOrderId });
                if (shipment) {
                    parentOrderId = shipment.parentOrderId;
                }
            }

            if (!parentOrderId) {
                console.error(`Could not find parentOrderId for Return ${returnReq._id}. Refund event might fail processing in Payment Service.`);
            }

            // Publish PROCESS_REFUND event to payment-service
            if (parentOrderId) {
                await publishToQueue({
                    queue_name: 'payment_queue',
                    event_name: 'PROCESS_REFUND',
                    data: {
                        orderId: parentOrderId,
                        sellerOrderId: returnReq.sellerOrderId,
                        userId: returnReq.userId,
                        amount: returnReq.refundAmount,
                        reason: 'Return Picked Up - Condition A'
                    }
                });
            } else {
                console.error(`CRITICAL: Failed to publish PROCESS_REFUND for Return ${returnReq._id} due to missing parentOrderId.`);
            }

        } else {
            // Condition B/C: Not good, maybe reject or manual review
            returnReq.status = 'DISPUTE_RAISED';
            returnReq.events.push({
                status: 'DISPUTE_RAISED',
                remark: remark || `Item picked up in condition ${condition}`,
                date: new Date()
            });
        }

        // Publish Status Update Event (for Order/Seller Service)
        await publishToQueue({
            queue_name: 'order_queue',
            event_name: 'RETURN_STATUS_UPDATED',
            data: {
                returnId: returnReq._id,
                sellerOrderId: returnReq.sellerOrderId,
                status: returnReq.status,
                remark: remark || `Return status updated to ${returnReq.status}`
            }
        });

        if (condition === 'A') {
            await publishToQueue({
                queue_name: 'notification_queue',
                event_name: 'RETURN_RECEIVED',
                data: {
                    returnId: returnReq._id,
                    orderId: returnReq.orderId || parentOrderId, // Using what we have
                    sellerOrderId: returnReq.sellerOrderId,
                    userId: returnReq.userId,
                    status: 'RETURN_RECEIVED',
                    timestamp: new Date()
                }
            });
        }

        await returnReq.save();
        res.status(200).json({ status: 'success', data: returnReq });

    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
