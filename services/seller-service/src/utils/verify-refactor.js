
import express from 'express';
import mongoose from 'mongoose';
import { SellerOrder } from '../models/sellerOrders.js';
import { handleStockReserved } from '../workers/handlerfunctions.js';
import { connectDB } from '../utils/db.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const startMockServers = async () => {
    // Mock Product Service (Port 3002)
    const productApp = express();
    productApp.get('/api/v1/products/:id', (req, res) => {
        res.json({
            data: {
                product: {
                    _id: req.params.id,
                    title: "Mock Product",
                    price: 100,
                    sellerId: "SELLER_123"
                }
            }
        });
    });
    const productServer = productApp.listen(3002, () => console.log('Mock Product Service running on 3002'));

    // Mock Order Service (Port 3003)
    const orderApp = express();
    orderApp.use(express.json());

    const mockOrder = {
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        items: [
            { productId: new mongoose.Types.ObjectId(), quantity: 1, variantId: new mongoose.Types.ObjectId() },
            { productId: new mongoose.Types.ObjectId(), quantity: 2, variantId: new mongoose.Types.ObjectId() }
        ],
        status: "PENDING"
    };

    orderApp.get('/api/v1/orders/:id', (req, res) => {
        res.json({
            data: {
                order: mockOrder
            }
        });
    });

    let updateCalled = false;
    orderApp.patch('/api/v1/orders/:id/seller-update', (req, res) => {
        console.log("Mock Order Service received update:", req.body);
        updateCalled = true;
        res.json({ status: "success" });
    });

    const orderServer = orderApp.listen(3003, () => console.log('Mock Order Service running on 3003'));

    return { productServer, orderServer, mockOrder, checkUpdate: () => updateCalled };
};

const runVerification = async () => {
    try {
        await connectDB();

        const { productServer, orderServer, mockOrder, checkUpdate } = await startMockServers();

        // Give servers a moment to start
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log("Invoking handleStockReserved...");
        await handleStockReserved({ orderId: mockOrder._id });

        // Verify DB
        const sellerOrders = await SellerOrder.find({ parentOrderId: mockOrder._id });
        console.log(`Found ${sellerOrders.length} SellerOrders in DB.`);

        if (sellerOrders.length > 0) {
            console.log("✅ DB Verification SUCCESS");
            console.log(JSON.stringify(sellerOrders, null, 2));
        } else {
            console.error("❌ DB Verification FAILED");
        }

        // Verify API Call
        if (checkUpdate()) {
            console.log("✅ API Verification SUCCESS: Order Service updated.");
        } else {
            console.error("❌ API Verification FAILED: Order Service NOT updated.");
        }

        // Cleanup
        productServer.close();
        orderServer.close();
        await SellerOrder.deleteMany({ parentOrderId: mockOrder._id });
        process.exit(0);

    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
};

runVerification();
