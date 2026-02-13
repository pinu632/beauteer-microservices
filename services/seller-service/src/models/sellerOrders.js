import mongoose from "mongoose";

const sellerOrderSchema = new mongoose.Schema({
    parentOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ParentOrder",
        required: true,
        index: true
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId, // Can be "ADMIN" or a specific seller ID
        ref: "Seller",
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId },
        titleSnapshot: String,
        priceSnapshot: Number,
        quantity: Number,
        variantId: mongoose.Schema.Types.ObjectId
    }],
    status: {
        type: String,
        enum: [
            "PLACED",
            "CONFIRMED",
            "PACKED",
            "SHIPPED",
            "OUT_FOR_DELIVERY",
            "DELIVERED",
            "RETURN_REQUESTED",
            "RETURN_RECEIVED",
            "CANCELLED"
        ],
        default: "PLACED"
    },
    statusHistory: [{
        status: String,
        date: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

export const SellerOrder = mongoose.model("SellerOrder", sellerOrderSchema);
