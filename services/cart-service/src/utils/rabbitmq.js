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
