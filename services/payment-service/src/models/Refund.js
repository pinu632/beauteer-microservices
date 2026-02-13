import mongoose from "mongoose";

const refundSchema = new mongoose.Schema({
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
        required: true
    },
    orderId: { // Refers to ParentOrder
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    orderItemId: { // Refers to OrderItem
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    sellerOrderId: { // Specific item/sub-order being refunded
        type: mongoose.Schema.Types.ObjectId,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    reason: {
        type: String
    },
    status: {
        type: String,
        enum: ["INITIATED", "PROCESSING", "COMPLETED", "FAILED"],
        default: "INITIATED"
    },
    metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

export default mongoose.model("Refund", refundSchema);
