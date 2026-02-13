import mongoose from "mongoose";

const cartActivitySchema = new mongoose.Schema({
    userId: { type: String, required: true },

    product: {
        productId: String,
        productName: String,
        price: Number
    },

    action: {
        type: String,
        enum: [
            "ADD_ITEM",
            "REMOVE_ITEM",
            "INCREASE_QTY",
            "DECREASE_QTY",
            "CLEAR_CART",
            "CHECKOUT_INITIATED"
        ],
        required: true
    },

    quantityChange: Number,  // +1, -1, etc
    cartValueAfterAction: Number,

    device: String,   // mobile/web
    source: String,   // app/web/promo

    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("CartActivity", cartActivitySchema);
