import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './utils/db.js';
import { connectRabbitMQ } from './utils/rabbitmq.js';
import { startWorker } from './workers/index.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3011;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

import campaignRoutes from './routes/campaign.routes.js';
import bannerRoutes from './routes/banner.routes.js';

app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/banners', bannerRoutes);

app.get('/', (req, res) => {
    res.json({
        service: 'Marketing Service',
        status: 'active',
        timestamp: new Date().toISOString()
    });
});

app.listen(port, async () => {
    console.log(`Marketing Service running on port ${port}`);
    await connectDB();
    await connectRabbitMQ();
    startWorker();
});
