import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { connectRabbitMQ } from './utils/rabbitmq.js';
import { startWorker } from './workers/index.js';
import { connectDB } from './utils/db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3006;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

import notificationRoutes from './routes/notification.routes.js';
app.use('/api/v1/notifications', notificationRoutes);


app.get('/', (req, res) => {
    res.json({
        service: 'Notification Service',
        status: 'active',
        timestamp: new Date().toISOString()
    });
});

app.listen(port, async () => {
    console.log(`Notification Service running on port ${port}`);
    await connectDB();
    await connectRabbitMQ();
    await startWorker();
});
