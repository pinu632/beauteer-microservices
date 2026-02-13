import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import winston from 'winston';
import { connectDB } from './utils/db.js';
import { connectRabbitMQ } from './utils/rabbitmq.js';
import { startWorker } from './workers/index.js';
import shipmentRoutes from './routes/shipment.routes.js';
import returnRoutes from './routes/return.routes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3008;

// Logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'fulfillment-service' },
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    ],
});

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        service: 'Fulfillment Service',
        status: 'active',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/v1/shipments', shipmentRoutes);
app.use('/api/v1/returns', returnRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    logger.error(err.message);
    res.status(err.statusCode || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error'
    });
});

app.listen(port, async () => {
    console.log(`Fulfillment Service running on port ${port}`);
    await connectDB();
    try {
        await connectRabbitMQ();
        console.log("Calling startWorker...");
        await startWorker();
        console.log("startWorker called successfully.");
    } catch (err) {
        console.error("RabbitMQ/Worker failed to start:", err);
    }
});
