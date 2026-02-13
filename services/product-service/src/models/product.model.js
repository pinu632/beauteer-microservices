import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,

    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    sellerId: { type: mongoose.Schema.Types.ObjectId },
    inventoryId: { type: mongoose.Schema.Types.ObjectId },
    images: [String],
    
    tags: [String],
    ingredients: [String],
    skinType: [{ type: String, enum: ["oily", "dry", "combination", "normal"] }],
    howToUse: String,
    price: Number,
    discountPrice: Number,

    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true }

}, { timestamps: true });

export const Product = mongoose.model("Product", productSchema);
