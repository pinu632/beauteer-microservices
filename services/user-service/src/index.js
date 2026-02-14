import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { connectRabbitMQ } from './utils/rabbitmq.js';
import { startWorker } from './workers/index.js';
import { connectDB } from './utils/db.js';
import userRoutes from './routes/user.routes.js';
import authRoutes from './routes/auth.routes.js';
import addressRoutes from './routes/address.routes.js';
import iamRoutes from './routes/iam.routes.js';
import logger from './logs/logger.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json())

app.get('/', (req, res) => {
    res.json({
        service: 'User Service',
        status: 'active',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/iam', iamRoutes);

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
    console.log(`User Service running on port ${port}`);
    await connectDB();
    await connectRabbitMQ();
    await startWorker();
});
