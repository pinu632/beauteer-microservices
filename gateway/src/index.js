import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import proxy from 'express-http-proxy';
import { connectRabbitMQ } from './utils/rabbitmq.js';
import { startWorker } from './workers/index.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        service: 'Gateway',
        status: 'active',
        timestamp: new Date().toISOString()
    });
});

// Proxy Routes
app.use('/users', proxy('http://user-service:3001'));
app.use('/products', proxy('http://product-service:3002'));
app.use('/orders', proxy('http://order-service:3003'));
app.use('/payments', proxy('http://payment-service:3004'));
app.use('/cart', proxy('http://cart-service:3005'));
app.use('/notifications', proxy('http://notification-service:3006'));
app.use('/sellers', proxy('http://seller-service:3007'));
app.use('/fulfillment', proxy('http://fulfillment-service:3008'));
app.use('/inventory', proxy('http://inventory-service:3010'));
app.use('/support', proxy('http://support-service:3009'));
app.use('/marketing', proxy('http://marketing-service:3011'));

app.listen(port, async () => {
    console.log(`Gateway running on port ${port}`);
    await connectRabbitMQ();
    await startWorker();
});
