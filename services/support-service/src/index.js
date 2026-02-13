import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './utils/db.js';
import { connectRabbitMQ } from './utils/rabbitmq.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // allow from anywhere for now, restrict in prod
        methods: ["GET", "POST"]
    }
});

const port = process.env.PORT || 3009;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        service: 'Support Service',
        status: 'active',
        timestamp: new Date().toISOString()
    });
});

// Socket.io connection handler
io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join_ticket', (ticketId) => {
        socket.join(ticketId);
        console.log(`Socket ${socket.id} joined ticket ${ticketId}`);
    });

    // Add more socket handlers here

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

// Make io accessible in routes
app.set('io', io);

// Routes
import supportRoutes from './routes/support.routes.js';
app.use('/api/v1/support', supportRoutes);

httpServer.listen(port, async () => {
    console.log(`Support Service running on port ${port}`);
    await connectDB();
    await connectRabbitMQ();
});
