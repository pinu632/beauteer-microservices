import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;
const OrderItemSchema = new mongoose.Schema({
    parentOrderId: { type: ObjectId, ref: "ParentOrder" },
    sellerOrderId: { type: ObjectId, ref: "SellerOrder" },
    shipmentId: { type: ObjectId},

    productId: ObjectId,
    sellerId: ObjectId,

    titleSnapshot: String,
    imageSnapshot: String,

    price: Number,
    quantity: Number,
    itemTotal: Number,

    // 🔥 ITEM LIFECYCLE
    status: {
        type: String,
        enum: [
            "PLACED",
            "CONFIRMED",
            "PACKED",
            "SHIPPED",
            "DELIVERED",
            "CANCELLED",
            "RETURN_REQUESTED",
            "RETURNED",
            "REFUNDED"
        ],
        default: "PLACED"
    },

    statusHistory: [{
        status: String,
        date: { type: Date, default: Date.now }
    }],

    refundAmount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("OrderItem", OrderItemSchema);
