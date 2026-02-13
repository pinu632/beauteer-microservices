import { getChannel } from "../utils/rabbitmq.js";

export const publishToQueue = async ({ queue_name, event_name, data }) => {
    const channel = getChannel();
    if (!channel) {
        console.error("RabbitMQ channel not ready");
        return;
    }

    await channel.assertQueue(queue_name, { durable: true });

    const message = {
        event: event_name,
        data,
        timestamp: new Date().toISOString()
    };

    channel.sendToQueue(
        queue_name,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
    );

    console.log(`📤 Sent event ${event_name} to ${queue_name}`);
};
