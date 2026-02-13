import { getChannel } from '../utils/rabbitmq.js';

export const startWorker = async () => {
    const channel = getChannel();
    if (!channel) {
        console.error('RabbitMQ channel not available, retrying worker start...');
        setTimeout(startWorker, 5000);
        return;
    }

    const queue = 'gateway_queue';
    await channel.assertQueue(queue, { durable: true });

    console.log(`Worker waiting for messages in ${queue}`);

    channel.consume(queue, (msg) => {
        if (msg !== null) {
            console.log(`Recieved message in ${queue}:`, msg.content.toString());
            channel.ack(msg);
        }
    });
};
