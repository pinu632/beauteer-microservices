import mongoose from "mongoose";

const brandSchema = new mongoose.Schema({
    name: { type: String, unique: true },
    logo: String,
    description: String,
    isActive: { type: Boolean, default: true },
    slug: { type: String, unique: true },
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String],
}, { timestamps: true });

export const Brand = mongoose.model("Brand", brandSchema);
