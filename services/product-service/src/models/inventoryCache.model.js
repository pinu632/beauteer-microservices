import mongoose from "mongoose";

const inventoryCacheSchema = new mongoose.Schema({
    inventoryId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Product"
    },
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Variant"
    },
    currentStock: {
        type: Number,
        required: true,
        default: 0
    },
    reservedStock: {
        type: Number,
        default: 0
    },
    warehouseLocation: {
        type: String,
        trim: true
    }
}, { timestamps: true });

export const InventoryCache = mongoose.model("InventoryCache", inventoryCacheSchema);
