import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { connectRabbitMQ } from './utils/rabbitmq.js';
import { startWorker } from './workers/index.js';
import { connectDB } from './utils/db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3004;

import paymentRoutes from './routes/payment.routes.js';

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/v1/payments', paymentRoutes);

app.get('/', (req, res) => {
    res.json({
        service: 'Payment Service',
        status: 'active',
        timestamp: new Date().toISOString()
    });
});

app.listen(port, async () => {
    console.log(`Payment Service running on port ${port}`);
    await connectDB();
    await connectRabbitMQ();
    await startWorker();
});
