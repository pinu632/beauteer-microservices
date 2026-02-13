
import Payment from "../models/Payment.js";
import Refund from "../models/Refund.js";
import { publishToQueue } from "./publisher.js";

// TODO: Define this in constants
const PAYMENT_INITIATED = "PAYMENT_INITIATED";

export const handleOrderCreated = async (data) => {
    try {
        console.log("🛒 Order Created Handler:", data);
        const { orderId, userId, paymentMethod, finalAmount } = data;

        const isCOD = paymentMethod === "COD";

        const gateway = isCOD
            ? "COD"
            : (["RAZORPAY", "STRIPE", "PAYPAL", "PHONEPE"].includes(paymentMethod)
                ? paymentMethod
                : "RAZORPAY");

        // Amount in paise
        // Ensure finalAmount is present. If logic in order service failed, fallback? 
        // We assume it's there.
        const amountInPaise = Math.round((finalAmount || 0) * 100);

        const payment = new Payment({
            orderId,
            userId,
            gateway,
            amount: amountInPaise,
            currency: "INR",

            // 🔥 NEW IMPORTANT FIELDS
            collectedAmount: 0,
            pendingAmount: amountInPaise,
            isFullyPaid: false,

            status: isCOD ? "PENDING_COLLECTION" : "INITIATED",

            transactions: [] // No money collected yet
        });

        await payment.save();
        console.log(`✅ Payment record created: ${payment._id} for Order: ${orderId}`);

        // Publish event for Order Service to update status/link payment
        await publishToQueue({
            queue_name: "order_queue",
            event_name: PAYMENT_INITIATED,
            data: {
                orderId,
                paymentId: payment._id,
                status: payment.status,
                gateway
            }
        });

    } catch (error) {
        console.error("Error handling order creation:", error);

        // Publish failure event
        if (data && data.orderId) {
            await publishToQueue({
                queue_name: "order_queue",
                event_name: "PAYMENT_FAILED", // Should import constant
                data: {
                    orderId: data.orderId,
                    reason: error.message || "Payment Processing Error"
                }
            });
        }
    }
};

export const handleOrderCancelled = async (data) => {
    try {
        console.log("🚫 Order Cancelled Handler:", data);
        // TODO: Handle refund or payment cancellation
    } catch (error) {
        console.error("Error handling order cancellation:", error);
    }
};

export const handleCODPaymentReceived = async (data) => {
    try {
        console.log("💰 Processing COD Payment Recieved:", data);
        const { orderId, userId, amount, status } = data;

        // Find the payment record
        const payment = await Payment.findOne({ orderId: orderId });

        if (!payment) {
            console.error(`Payment record not found for Order: ${orderId}`);
            // Should we create one? Only if logic allows. 
            // Usually created at order creation.
            return;
        }

        if (payment.status === "COMPLETED" || payment.isFullyPaid) {
            console.log(`Payment already completed for Order: ${orderId}`);
            return;
        }

        // Update Payment
        payment.status = "COMPLETED";
        payment.isFullyPaid = true;
        payment.collectedAmount = payment.amount; // Assuming full amount collected
        payment.pendingAmount = 0;

        payment.transactions.push({
            transactionId: `COD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            amount: payment.amount,
            status: "SUCCESS",
            method: "COD",
            timestamp: new Date()
        });

        await payment.save();
        console.log(`✅ Payment marked as COMPLETED for Order: ${orderId}`);

        // Publish PAYMENT_SUCCESS event if needed by other services (like Order Service to update status to PAID)
        // fulfillment-service triggered this, so it knows.
        // But Order Service needs to know payment is done to update its status to PAID/COMPLETED if not already.

        // Let's publish PAYMENT_SUCCESS
        await publishToQueue({
            queue_name: "order_queue",
            event_name: "PAYMENT_SUCCESS",
            data: {
                orderId,
                paymentId: payment._id,
                amount: payment.amount,
                method: "COD",
                timestamp: new Date()
            }
        });

    } catch (error) {
        console.error("Error handling COD payment received:", error);
    }
};

export const handleProcessRefund = async (data) => {
    try {
        console.log("🔄 Processing Refund Request:", data);
        const { orderId, sellerOrderId, userId, amount, reason } = data;

        // 1. Check if payment is fulfilled for this sellerOrderId
        // We look for a Payment document associated with this orderId
        // AND containing a transaction for this sellerOrderId with status SUCCESS.
        const payment = await Payment.findOne({
            orderId: orderId,
            "transactions": {
                $elemMatch: {
                    sellerOrderId: sellerOrderId,
                    status: "SUCCESS"
                }
            }
        });

        if (!payment) {
            console.error(`❌ Refund Failed: Payment not fulfilled or not found for SellerOrder: ${sellerOrderId}`);
            // Optionally publish a REFUND_FAILED event
            return;
        }

        // 2. Check if refund already exists (Idempotency)
        const existingRefund = await Refund.findOne({ sellerOrderId });
        if (existingRefund) {
            console.log(`⚠️ Refund already initiated for SellerOrder: ${sellerOrderId}`);
            return;
        }

        // 3. Create Refund Record
        const refund = new Refund({
            paymentId: payment._id,
            orderId,
            sellerOrderId,
            userId,
            amount,
            reason,
            status: "INITIATED"
        });

        await refund.save();
        console.log(`✅ Refund INITIATED for SellerOrder: ${sellerOrderId}, RefundId: ${refund._id}`);

        // 4. Update Payment record to reflect refund initiation (Optional but good for tracking)
        // payment.refunds.push({
        //     refundId: refund._id,
        //     sellerOrderId,
        //     amount,
        //     reason,
        //     status: "INITIATED",
        //     processedAt: new Date()
        // });
        // await payment.save();

        // 5. Publish Refund Initiated Event
        await publishToQueue({
            queue_name: "notification_queue",
            event_name: "REFUND_INITIATED",
            data: {
                refundId: refund._id,
                orderId,
                userId,
                amount: refund.amount,
                reason: refund.reason
            }
        });

        // Mocking immediate completion for this demo/flow (or if logic allows)
        // Ideally, this happens after some gateway callback
        refund.status = "COMPLETED";
        await refund.save();

        await publishToQueue({
            queue_name: "notification_queue",
            event_name: "REFUND_COMPLETED",
            data: {
                refundId: refund._id,
                orderId,
                userId,
                amount: refund.amount
            }
        });

    } catch (error) {
        console.error("Error processing refund:", error);
    }
};

export const handleOrderItemCancelled = async (data) => {
    try {
        console.log("Processing Order Item Cancellation (Payment Adjustment):", data);
        const { orderId, quantity, price, orderItemId } = data; // Ensure these are passed
        const amountToRefund = Math.round(price * quantity * 100); // Amount in paise

        const payment = await Payment.findOne({ orderId });

        if (!payment) {
            console.error(`Payment record not found for Order: ${orderId}`);
            return;
        }

        // Logic: specific user request
        // "refund only possible for if the payment is not pending else just add a transaction of order cancellation"
        // We interpret "not pending" as "COMPLETED" or "PAID".

        const isPaid = payment.status === 'COMPLETED' || payment.isFullyPaid;

        if (isPaid) {
            console.log(`Payment is PAID/COMPLETED. Initiating Refund for amount: ${amountToRefund}`);

            // Create Refund Record
            const refund = new Refund({
                paymentId: payment._id,
                orderId,
                sellerOrderId: data.sellerId, // Or derive logic
                userId: data.userId,
                amount: amountToRefund,
                reason: "Order Item Cancelled",
                status: "INITIATED"
            });
            await refund.save();

            // Simulate Refund Completion (or integrate with gateway)
            refund.status = "COMPLETED";
            await refund.save();

            // Notify
            await publishToQueue({
                queue_name: "notification_queue",
                event_name: "REFUND_COMPLETED",
                data: {
                    refundId: refund._id,
                    orderId,
                    userId: data.userId,
                    amount: refund.amount
                }
            });

        } else {
            console.log(`Payment is PENDING/INITIATED. Reducing Order Amount by: ${amountToRefund}`);
            // Just update the payment record to reflect reduced obligation

            payment.amount = Math.max(0, payment.amount - amountToRefund);
            payment.pendingAmount = Math.max(0, payment.pendingAmount - amountToRefund);

            payment.transactions.push({
                transactionId: `CANCEL-${Date.now()}`,
                amount: amountToRefund,
                status: "SUCCESS",
                method: "ORDER_CANCELLED",
                timestamp: new Date()
            });

            if(payment.pendingAmount === 0){
                payment.status = "COMPLETED";
                payment.isFullyPaid = true;
            }

            await payment.save();
        }

    } catch (error) {
        console.error("Error handling order item cancellation in payment service:", error);
    }
};

