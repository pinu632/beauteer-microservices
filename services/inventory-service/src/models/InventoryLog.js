import mongoose from "mongoose";

const inventoryLogSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    },
    inventoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Inventory"
    },
    change: Number,          // -2, +3
    type: String,            // ORDER_PLACED, CANCELLED, RETURNED
    orderId: mongoose.Schema.Types.ObjectId
}, { timestamps: true });


export const InventoryLog = mongoose.model("InventoryLog", inventoryLogSchema);
