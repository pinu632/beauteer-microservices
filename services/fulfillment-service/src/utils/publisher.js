import { getChannel } from './rabbitmq.js';

export const publishToQueue = async ({ queue_name, event_name, data }) => {
    try {
        const channel = getChannel();
        if (!channel) {
            console.error("RabbitMQ channel not available.");
            return;
        }

        const payload = JSON.stringify({
            event: event_name,
            data
        });

        await channel.assertQueue(queue_name, { durable: true });
        channel.sendToQueue(queue_name, Buffer.from(payload));
        console.log(`Event ${event_name} published to ${queue_name}`);

    } catch (error) {
        console.error("Error publishing to queue:", error);
    }
};
