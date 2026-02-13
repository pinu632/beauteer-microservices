import mongoose from "mongoose";

const sellerCacheSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true,
        ref: "Seller"
    },
    storeName: {
        type: String,
        required: true,
        trim: true
    },
    ownerName: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        city: { type: String, trim: true },
        state: { type: String, trim: true }
    }
}, { timestamps: true });

export const SellerCache = mongoose.model("SellerCache", sellerCacheSchema);
