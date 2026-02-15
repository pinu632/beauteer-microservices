import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema({
  // Basic Info
  title: { type: String, required: true },
  description: String,

  type: {
    type: String,
    enum: ["BANNER", "COUPON", "PRODUCT_DISCOUNT", "CATEGORY_DISCOUNT"],
    required: true
  },

  // Media
  imageUrl: String,

  // Discount (optional - only for discount campaigns)
  discount: {
    type: {
      type: String,
      enum: ["PERCENTAGE", "FLAT"]
    },
    value: Number,
    maxDiscount: Number
  },

  // Linking
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId}],
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId }],
  couponCode: String,

  // Basic Targeting
  platform: {
    type: String,
    enum: ["APP", "WEB", "ALL","EMAIL","NOTIFICATION"],
    default: "ALL"
  },

  minOrderValue: Number,

  // Scheduling
  startDate: Date,
  endDate: Date,
  isActive: { type: Boolean, default: true },

  // Basic Analytics
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 }

}, { timestamps: true });

export default mongoose.model("Campaign", campaignSchema);
