
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
    // Mock Product Service (Port 3002) - Should NOT be called if logic is optimized
    const productApp = express();
    let productApiCalled = false;
    productApp.get('/api/v1/products/:id', (req, res) => {
        console.log("⚠️ FAIL: Product API called!");
        productApiCalled = true;
        res.json({ data: { product: { _id: req.params.id, title: "Product", price: 100, sellerId: "SELLER_1" } } });
    });
    const productServer = productApp.listen(3002, () => console.log('Mock Product Service running on 3002'));

    // Mock Order Service (Port 3003) - Should NOT be called for details
    const orderApp = express();
    orderApp.use(express.json());

    let orderDetailsCalled = false;
    orderApp.get('/api/v1/orders/:id', (req, res) => {
        console.log("⚠️ FAIL: Order Details API called!");
        orderDetailsCalled = true;
        res.json({ data: { order: { _id: req.params.id, items: [] } } });
    });

    let updateCalled = false;
    orderApp.patch('/api/v1/orders/:id/seller-update', (req, res) => {
        console.log("✅ Order Update API called (Expected).");
        updateCalled = true;
        res.json({ status: "success" });
    });

    const orderServer = orderApp.listen(3003, () => console.log('Mock Order Service running on 3003'));

    return { productServer, orderServer, checkCalls: () => ({ productApiCalled, orderDetailsCalled, updateCalled }) };
};

const runVerification = async () => {
    try {
        await connectDB();

        const { productServer, orderServer, checkCalls } = await startMockServers();

        // Give servers a moment
        await new Promise(resolve => setTimeout(resolve, 500));

        const mockData = {
            orderId: new mongoose.Types.ObjectId(),
            userId: new mongoose.Types.ObjectId(),
            items: [{
                productId: new mongoose.Types.ObjectId(),
                quantity: 2,
                variantId: new mongoose.Types.ObjectId(),
                sellerId: "SELLER_OPTIMIZED",
                title: "Optimized Product",
                price: 150
            }]
        };

        console.log("Invoking handleStockReserved with enriched data...");
        await handleStockReserved(mockData);

        // Verify DB
        const sellerOrders = await SellerOrder.find({ parentOrderId: mockData.orderId });

        if (sellerOrders.length > 0 && sellerOrders[0].items[0].titleSnapshot === "Optimized Product") {
            console.log("✅ DB Verification SUCCESS: SellerOrder created with snapshot data.");
        } else {
            console.error("❌ DB Verification FAILED");
        }

        const { productApiCalled, orderDetailsCalled, updateCalled } = checkCalls();

        if (!productApiCalled && !orderDetailsCalled && updateCalled) {
            console.log("✅ Optimization SUCCESS: No unnecessary API calls made.");
        } else {
            console.error("❌ Optimization FAILED: API calls were made:", { productApiCalled, orderDetailsCalled });
        }

        // Cleanup
        productServer.close();
        orderServer.close();
        await SellerOrder.deleteMany({ parentOrderId: mockData.orderId });
        process.exit(0);

    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
};

runVerification();
