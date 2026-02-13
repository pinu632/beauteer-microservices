
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Payment from "../models/Payment.js";
import { handleOrderCreated } from "../workers/handlerfunctions.js";
import { connectDB } from "../utils/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const verifyPaymentCreation = async () => {
    try {
        await connectDB();

        const mockOrderData = {
            orderId: new mongoose.Types.ObjectId(),
            userId: new mongoose.Types.ObjectId(),
            paymentMethod: "COD", // Test COD logic
            finalAmount: 500
        };

        console.log("Invoking handleOrderCreated with mock data:", mockOrderData);
        await handleOrderCreated(mockOrderData);

        console.log("Verifying Payment creation...");
        const payment = await Payment.findOne({ orderId: mockOrderData.orderId });

        if (payment) {
            console.log("✅ Payment record found:", payment._id);
            console.log("Status:", payment.status); // Should be PENDING_COLLECTION
            console.log("Amount:", payment.amount); // Should be 50000

            if (payment.status === "PENDING_COLLECTION" && payment.amount === 50000) {
                console.log("✅ Logic verification SUCCESS");
            } else {
                console.error("❌ Logic verification FAILED: Status or Amount mismatch");
            }

        } else {
            console.error("❌ Payment record NOT found");
        }

        // Cleanup
        if (payment) await Payment.findByIdAndDelete(payment._id);

        process.exit(0);

    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
};

verifyPaymentCreation();
