import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", index: true },

    sku: { type: String, unique: true },
    shadeName: String,
    size: String,
    finish: String,

    price: { type: Number, required: true },
    discountPrice: Number,

    stock: { type: Number, default: 0 },
    weight: Number,

    images: [String]

}, { timestamps: true });

export const ProductVariant = mongoose.model("ProductVariant", variantSchema);
