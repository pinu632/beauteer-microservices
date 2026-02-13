import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { connectRabbitMQ } from './utils/rabbitmq.js';
import { startWorker } from './workers/index.js';
import { connectDB } from './utils/db.js';
import logger from './logs/logger.js';
import sellerRoutes from './routes/seller.routes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3007;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        service: 'Seller Service',
        status: 'active',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/v1/sellers', sellerRoutes);

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
    console.log(`Seller Service running on port ${port}`);
    await connectDB();
    await connectRabbitMQ();
    startWorker().catch(err => console.error("Failed to start worker", err));
});
