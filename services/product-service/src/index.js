import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { connectRabbitMQ } from './utils/rabbitmq.js';
import { startWorker } from './workers/index.js';
import { connectDB } from './utils/db.js';
import productRoutes from './routes/product.routes.js';
import brandRoutes from './routes/brand.routes.js';
import categoryRoutes from './routes/category.routes.js';
import variantRoutes from './routes/variant.routes.js';
import logger from './logs/logger.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        service: 'Product Service',
        status: 'active',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/brands', brandRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/variants', variantRoutes);

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
    console.log(`Product Service running on port ${port}`);
    await connectDB();
    try {
        await connectRabbitMQ();
        await startWorker();
    } catch (err) {
        console.error("RabbitMQ/Worker failed to start:", err);
    }
});
