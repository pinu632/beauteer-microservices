import { getChannel } from '../utils/rabbitmq.js';
import { handlePaymentSuccess } from './handlerfunctions.js';

const PAYMENT_SUCCESS = "PAYMENT_SUCCESS"; // Ensure this matches payment service event
const RETURN_REQUESTED = "RETURN_REQUESTED";

export const startWorker = async () => {
    console.log("startWorker execution started");
    try {
        const channel = getChannel();
        if (!channel) {
            console.error('RabbitMQ channel not available, retrying worker start...');
            setTimeout(startWorker, 5000);
            return;
        }

        const queue = 'fulfillment_queue';
        await channel.assertQueue(queue, { durable: true });

        console.log(`Worker waiting for messages in ${queue}`);

        channel.consume(queue, (msg) => {
            if (msg !== null) {
                const content = JSON.parse(msg.content.toString());
                console.log(`Received message in ${queue}:`, content.event);

                if (content.event === PAYMENT_SUCCESS) {
                    handlePaymentSuccess(content.data);
                } else if (content.event === RETURN_REQUESTED) {
                    // handleReturnRequested(content.data);
                    console.log("Return requested event received (handler pending implementation)");
                } else {
                    console.log("Unhandled event:", content.event);
                }

                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error('Error starting worker:', error);
    }
};
