
import { getChannel } from "../utils/rabbitmq.js";

const QUEUE_NAME = "marketing_queue";

export const startWorker = async () => {
    const channel = getChannel();
    if (!channel) {
        console.error("RabbitMQ channel not ready, retrying...");
        setTimeout(startWorker, 5000);
        return;
    }

    try {
        // Assert a queue for marketing events
        await channel.assertQueue(QUEUE_NAME, { durable: true });
        console.log(`✅ Marketing Worker listening on ${QUEUE_NAME}`);

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
                    // channel.nack(msg); 
                    channel.ack(msg); // Ack to prevent blocking queue on error
                }
            }
        });

    } catch (error) {
        console.error("Worker error:", error);
    }
};

const handleEvent = async (event, data) => {
    switch (event) {
        case "USER_REGISTERED":
            console.log(`User registered: ${data.userId}. Initiating welcome campaign logic (placeholder).`);
            // Logic to assign welcome campaign or send welcome email via notification service
            break;

        case "ORDER_PLACED":
            console.log(`Order placed: ${data.orderId}. Checking for post-purchase campaigns.`);
            break;

        default:
            console.log(`Unhandled event: ${event}`);
    }
};
