import mongoose from "mongoose";

const parentOrderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    shippingAddress: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId },
        variantId: mongoose.Schema.Types.ObjectId,
        titleSnapshot: String,
        price: Number,
        quantity: Number
    }],

    sellerOrders: [
        { type: mongoose.Schema.Types.ObjectId }
    ],

    orderItems: [
        { type: mongoose.Schema.Types.ObjectId, ref: "OrderItem" }
    ],

    totalAmount: Number,
    discountAmount: Number,
    taxAmount: Number,
    shippingFee: Number,
    finalAmount: Number,

    paymentMethod: {
        type: String,
        enum: ["ONLINE", "COD"]
    },

    paymentStatus: {
        type: String,
        enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
        default: "PENDING"
    },

    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment" // Refers to payment in Valid Payment Service (loosely)
    },

    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 15 * 60 * 1000) // 15 mins
    },



}, { timestamps: true });

export const ParentOrder = mongoose.model("ParentOrder", parentOrderSchema);
