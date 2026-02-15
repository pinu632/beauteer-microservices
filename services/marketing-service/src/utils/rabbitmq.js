import amqp from 'amqplib';

let connection = null;
let channel = null;

export const connectRabbitMQ = async () => {
    try {
        const amqpServer = process.env.RABBITMQ_URL || 'amqp://localhost';
        connection = await amqp.connect(amqpServer);
        channel = await connection.createChannel();
        console.log('RabbitMQ Connected');
        return channel;
    } catch (err) {
        console.error('Failed to connect to RabbitMQ', err);
        setTimeout(connectRabbitMQ, 5000);
    }
};

export const getChannel = () => channel;

export const publishToQueue = async (queue, message) => {
    if (!channel) {
        console.error("RabbitMQ channel not available.");
        return;
    }
    try {
        await channel.assertQueue(queue, { durable: true });
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
        console.log(`Message sent to queue ${queue}:`, message);
    } catch (error) {
        console.error("Error publishing message:", error);
    }
};
