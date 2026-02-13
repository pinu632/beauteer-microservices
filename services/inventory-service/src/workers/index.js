import { getChannel } from '../utils/rabbitmq.js';
import { handleInventoryQueue } from './workerhandler.js';

export const startWorker = async () => {
    try {
        const channel = getChannel();
        if (!channel) {
            console.error('RabbitMQ channel not available, retrying worker start...');
            setTimeout(startWorker, 5000);
            return;
        }

        const queue = 'inventory_queue';
        await channel.assertQueue(queue, { durable: true });

        console.log(`Worker waiting for messages in ${queue}`);

        channel.consume(queue, (msg) => {
            if (msg !== null) {
                console.log(`Received message in ${queue}:`, msg.content.toString());
                handleInventoryQueue(msg);
                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error('Error starting worker:', error);
    }
};
