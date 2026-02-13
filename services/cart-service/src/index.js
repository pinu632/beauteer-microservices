import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { connectRabbitMQ } from './utils/rabbitmq.js';
import { startWorker } from './workers/index.js';
import cartRoutes from './routes/cart.routes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3005;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

import { startCronJobs } from './cron/abandonedCart.js';
startCronJobs();

// Routes


app.get('/', (req, res) => {
    res.json({
        service: 'Cart Service',
        status: 'active',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/v1/cart', cartRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Global Error Handler", err);
    res.status(500).json({
        status: 'error',
        message: err.message,
    });
});

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected for Cart Service");
    } catch (err) {
        console.error("MongoDB connection failed", err);
        process.exit(1);
    }
};

app.listen(port, async () => {
    console.log(`Cart Service running on port ${port}`);
    await connectDB();
    try {
        await connectRabbitMQ();
        await startWorker();
    } catch (err) {
        console.error("RabbitMQ/Worker failed to start:", err);
    }
});
