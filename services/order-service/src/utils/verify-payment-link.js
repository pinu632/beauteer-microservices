
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ParentOrder } from "../models/parentOrder.model.js";
import { handlePaymentInitiated } from "../workers/handlerfunctions.js";
import { connectDB } from "../utils/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const verifyPaymentLink = async () => {
    try {
        await connectDB();

        // Create dummy parent order
        const parentOrder = await ParentOrder.create({
            userId: new mongoose.Types.ObjectId(),
            shippingAddress: new mongoose.Types.ObjectId(),
            items: [],
            totalAmount: 100,
            finalAmount: 100
        });
        console.log("Created dummy ParentOrder:", parentOrder._id);

        const mockEventData = {
            orderId: parentOrder._id,
            paymentId: new mongoose.Types.ObjectId(),
            status: "INITIATED"
        };

        console.log("Invoking handlePaymentInitiated...");
        await handlePaymentInitiated(mockEventData);

        // Verify update
        const updatedOrder = await ParentOrder.findById(parentOrder._id);
        console.log("Updated ParentOrder paymentId:", updatedOrder.paymentId);

        if (updatedOrder.paymentId && updatedOrder.paymentId.toString() === mockEventData.paymentId.toString()) {
            console.log("✅ Verification SUCCESS: Payment linked to Order.");
        } else {
            console.error("❌ Verification FAILED: Payment NOT linked.");
        }

        // Cleanup
        await ParentOrder.findByIdAndDelete(parentOrder._id);
        process.exit(0);

    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
};

verifyPaymentLink();
