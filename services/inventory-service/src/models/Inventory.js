import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId},
    sellerId: { type: mongoose.Schema.Types.ObjectId },

    variantId: mongoose.Schema.Types.ObjectId,

    currentStock: { type: Number, required: true },
    reservedStock: { type: Number, default: 0 },

    warehouseLocation: String

}, { timestamps: true });

inventorySchema.index(
    { productId: 1, sellerId: 1, variantId: 1 },
    { unique: true }
);

export default mongoose.model("Inventory", inventorySchema);
