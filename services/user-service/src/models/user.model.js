import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  phone: String,
  password: { type: String, required: true },

  role: {
    type: String,
    enum: ["customer", "admin", "seller", "product_manager", "support", "finance", "order_manager", "inventory_manager"],
    default: "customer"
  },

  isEmailVerified: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  deviceToken: { type: String }

}, { timestamps: true });

export const User = mongoose.model("User", userSchema);
