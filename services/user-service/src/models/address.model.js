import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },

    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    country: String,
    pincode: String,

    type: { type: String, enum: ["home", "work"] }

}, { timestamps: true });

export default mongoose.model("Address", addressSchema);
