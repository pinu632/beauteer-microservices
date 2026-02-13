import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
    productId: { type: String, required: true },     // ID from product service
    productName: { type: String, required: true },   // snapshot
    productImage: { type: String },
    priceAtAddTime: { type: Number, required: true },
    quantity: { type: Number, default: 1, min: 1 }
}, { _id: false });

const cartSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true }, // from auth service

    items: [cartItemSchema],

    totalItems: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },

    currency: { type: String, default: "INR" },

    lastActivityAt: { type: Date, default: Date.now }

}, { timestamps: true });

cartSchema.pre("save", function () {
    this.totalItems = this.items.reduce((acc, i) => acc + i.quantity, 0);
    this.totalPrice = this.items.reduce((acc, i) => acc + (i.priceAtAddTime * i.quantity), 0);
    this.lastActivityAt = new Date();
   
});

export default mongoose.model("Cart", cartSchema);
