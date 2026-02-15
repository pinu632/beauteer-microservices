
import { getChannel } from "../utils/rabbitmq.js";
import { createAndSendNotification } from "../utils/notificationHelper.js";
import { EVENTS, NOTIFICATION_CATEGORIES } from "../constants/events.js";

const QUEUE_NAME = "notification_queue";

export const startWorker = async () => {
    const channel = getChannel();
    if (!channel) {
        console.error("RabbitMQ channel not ready, retrying...");
        setTimeout(startWorker, 5000);
        return;
    }

    try {
        await channel.assertQueue(QUEUE_NAME, { durable: true });
        console.log(`✅ Notification Worker listening on ${QUEUE_NAME}`);

        channel.consume(QUEUE_NAME, async (msg) => {
            if (msg !== null) {
                try {
                    const content = JSON.parse(msg.content.toString());
                    const { event, data } = content;

                    console.log(`📨 Received event: ${event}`);

                    await handleEvent(event, data);

                    channel.ack(msg);
                } catch (err) {
                    console.error("Error processing message:", err);
                    // channel.nack(msg); // Be careful with nack loops
                    channel.ack(msg); // Ack to avoid stuck messages for now
                }
            }
        });

    } catch (error) {
        console.error("Worker error:", error);
    }
};

const handleEvent = async (event, data) => {
    // data usually contains: orderId, userId, items, status, etc.
    // We map these events to user-friendly titles/bodies.

    let title = "New Notification";
    let body = "You have a new update.";
    let category = NOTIFICATION_CATEGORIES.SYSTEM;
    let eventKey = event;
    let actionType = "NONE";
    let actionValue = "";
    let imageUrl = "";
    let entityType = "System";
    let entityId = null;

    switch (event) {
        /* ---------------- ORDER EVENTS ---------------- */
        case EVENTS.ORDER_CONFIRMED:
            title = "Order Confirmed! 🎉";
            body = `Your order #${data.orderId.slice(-6)} has been placed successfully.`;
            category = NOTIFICATION_CATEGORIES.ORDER;
            entityType = "Order";
            entityId = data.orderId;
            actionType = "DEEPLINK";
            actionValue = `app://orders/${data.orderId}`;
            break;

        case EVENTS.ORDER_PROCESSED:
            title = "Order Processed 📦";
            body = `We are packing your order #${data.orderId.slice(-6)}.`;
            category = NOTIFICATION_CATEGORIES.ORDER;
            entityType = "Order";
            entityId = data.orderId;
            actionType = "DEEPLINK";
            actionValue = `app://orders/${data.orderId}`;
            break;

        case EVENTS.ORDER_SHIPPED:
            title = "Order Shipped! 🚚";
            body = `Your order #${data.orderId.slice(-6)} is on its way. Track it now!`;
            category = NOTIFICATION_CATEGORIES.ORDER;
            entityType = "Order";
            entityId = data.orderId;
            actionType = "DEEPLINK";
            actionValue = `app://orders/${data.orderId}`;
            break;

        case EVENTS.ORDER_OUT_FOR_DELIVERY:
            title = "Out for Delivery 🚀";
            body = `Your order #${data.orderId.slice(-6)} will be delivered today.`;
            category = NOTIFICATION_CATEGORIES.ORDER;
            entityType = "Order";
            entityId = data.orderId;
            actionType = "DEEPLINK";
            actionValue = `app://orders/${data.orderId}`;
            break;

        case EVENTS.ORDER_DELIVERED:
            title = "Order Delivered ✅";
            body = `Your order #${data.orderId.slice(-6)} has been delivered. Enjoy!`;
            category = NOTIFICATION_CATEGORIES.ORDER;
            entityType = "Order";
            entityId = data.orderId;
            actionType = "DEEPLINK";
            actionValue = `app://orders/${data.orderId}`;
            break;


        /* ---------------- RETURN/REFUND EVENTS ---------------- */
        case EVENTS.RETURN_REQUEST_APPROVED:
            title = "Return Approved";
            body = `Your return request for order #${data.orderId.slice(-6)} has been approved.`;
            category = NOTIFICATION_CATEGORIES.ORDER;
            entityType = "Return";
            entityId = data.returnId || data.orderId;
            break;

        case EVENTS.RETURN_PICKUP_SCHEDULED:
            title = "Pickup Scheduled";
            body = `Pickup for your return is scheduled for ${data.date || 'tomorrow'}.`;
            category = NOTIFICATION_CATEGORIES.ORDER;
            entityType = "Return";
            entityId = data.returnId || data.orderId;
            break;

        case EVENTS.REFUND_INITIATED:
            title = "Refund Initiated 💸";
            body = `We've initiated a refund of $${data.amount} for your order.`;
            category = NOTIFICATION_CATEGORIES.ORDER;
            entityType = "Refund";
            entityId = data.refundId || data.orderId;
            break;

        case EVENTS.REFUND_COMPLETED:
            title = "Refund Completed";
            body = `Refund of $${data.amount} has been successfully processed.`;
            category = NOTIFICATION_CATEGORIES.ORDER;
            entityType = "Refund";
            entityId = data.refundId || data.orderId;
            break;

        case EVENTS.RETURN_STATUS_UPDATED:
            title = "Return Update";
            body = `Your return status has been updated to: ${data.status}.`;
            category = NOTIFICATION_CATEGORIES.ORDER;
            entityType = "Return";
            entityId = data.returnId;
            break;


        /* ---------------- SUPPORT EVENTS ---------------- */
        case EVENTS.SUPPORT_TICKET_CREATED:
            title = "Support Ticket Created";
            body = `Ticket #${data.ticketId} has been created. We will reply shortly.`;
            category = NOTIFICATION_CATEGORIES.SUPPORT;
            entityType = "Ticket";
            entityId = data.ticketId;
            break;

        case EVENTS.SUPPORT_AGENT_REPLIED:
            title = "New Reply on Ticket";
            body = `Support agent replied: "${data.message.substring(0, 30)}..."`;
            category = NOTIFICATION_CATEGORIES.SUPPORT;
            entityType = "Ticket";
            entityId = data.ticketId;
            actionType = "DEEPLINK";
            actionValue = `app://support/${data.ticketId}`;
            break;


        /* ---------------- MARKETING EVENTS ---------------- */
        case EVENTS.CART_ABANDONED_1H:
            title = "Did you forget something? 👀";
            body = "Your cart is waiting! Complete your purchase now.";
            category = NOTIFICATION_CATEGORIES.MARKETING;
            actionType = "DEEPLINK";
            actionValue = "app://cart";
            break;

        case EVENTS.CART_ABANDONED_24H:
            title = "Still thinking about it?";
            body = "Items in your cart are selling out fast!";
            category = NOTIFICATION_CATEGORIES.MARKETING;
            actionType = "DEEPLINK";
            actionValue = "app://cart";
            break;

        case EVENTS.PRICE_DROP_WISHLIST:
            title = "Price Drop Alert! 📉";
            body = `An item in your wishlist is now on sale!`;
            category = NOTIFICATION_CATEGORIES.MARKETING;
            actionType = "DEEPLINK";
            actionValue = "app://wishlist";
            if (data.productId) imageUrl = data.productImage; // Assuming data has image
            break;

        case EVENTS.REVIEW_REQUEST:
            title = "How was your order? ⭐";
            body = "Rate your recent purchase and help others.";
            category = NOTIFICATION_CATEGORIES.SYSTEM;
            entityType = "Order";
            entityId = data.orderId;
            actionType = "DEEPLINK";
            actionValue = `app://review/${data.orderId}`;
            break;

        case EVENTS.CAMPAIGN_NOTIFICATION:
            title = data.title;
            body = data.description || "Check out our new campaign!";
            category = NOTIFICATION_CATEGORIES.MARKETING;
            entityType = "Campaign";
            entityId = data._id;
            // Handle image logic if present
            if (data.imageUrl) imageUrl = data.imageUrl;

            // Handle Action if present
            if (data.link) {
                actionType = "DEEPLINK";
                actionValue = data.link;
            }
            break;

        default:
            console.log(`Unhandled event type: ${event}`);
            return;
    }

    await createAndSendNotification({
        userId: data.userId,
        eventKey,
        category,
        title,
        body,
        imageUrl,
        actionType,
        actionValue,
        entityType,
        entityId,
        metadata: data,
        deviceToken: data.deviceToken // Important: Expecting this from event or fetch logic
    });
};
