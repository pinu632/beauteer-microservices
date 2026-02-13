import { getChannel } from '../utils/rabbitmq.js';
import { handleCartQueue } from './workerhandler.js';

export const startWorker = async () => {
    const channel = getChannel();
    if (!channel) {
        console.error('RabbitMQ channel not available, retrying worker start...');
        setTimeout(startWorker, 5000);
        return;
    }

    const queue = 'cart_queue';
    await channel.assertQueue(queue, { durable: true });

    console.log(`Worker waiting for messages in ${queue}`);

    channel.consume(queue, (msg) => {
        if (msg !== null) {
            console.log(`Recieved message in ${queue}:`, msg.content.toString());
            handleCartQueue(msg);
            channel.ack(msg);
        }
    });
};
