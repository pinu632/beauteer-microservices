import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './utils/db.js';
import { connectRabbitMQ } from './utils/rabbitmq.js';
import { startWorker } from './workers/index.js';
import inventoryRoutes from './routes/inventory.routes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3008; // Using 3008 as 3006 was in use

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        service: 'Inventory Service',
        status: 'active',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/v1/inventory', inventoryRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        status: err.status || 'error',
        message: err.message || 'Internal Server Error',
    });
});

app.listen(port, async () => {
    console.log(`Inventory Service running on port ${port}`);
    await connectDB();
    await connectRabbitMQ();
    startWorker().catch(err => console.error("Failed to start worker", err));
});
