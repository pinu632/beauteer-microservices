import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './utils/db.js';
import { connectRabbitMQ } from './utils/rabbitmq.js';
import orderRoutes from './routes/order.routes.js';
import logger from './logs/logger.js';
import { startWorker } from './workers/index.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3003; // Matching .env

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        service: 'Order Service',
        status: 'active',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/v1/orders', orderRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    logger.error("Global Error Handler", err);

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
    });
});



app.listen(port, async () => {
    console.log(`Order Service running on port ${port}`);
    await connectDB();
    try {
        await connectRabbitMQ();
        await startWorker();
    } catch (err) {
        console.error("RabbitMQ failed to start:", err);
    }
});
