import { getChannel } from '../utils/rabbitmq.js';
import { handlePaymentQueue } from './workerhandler.js';

export const startWorker = async () => {
    const channel = getChannel();
    if (!channel) {
        console.error('RabbitMQ channel not available, retrying worker start...');
        setTimeout(startWorker, 5000);
        return;
    }

    const queue = 'payment_queue';
    await channel.assertQueue(queue, { durable: true });

    console.log(`Worker waiting for messages in ${queue}`);

    channel.consume(queue, (msg) => {
        if (msg !== null) {
            console.log(`Received message in ${queue}:`, msg.content.toString());
            handlePaymentQueue(msg);
            channel.ack(msg);
        }
    });
};
