
import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },

    // Storing optional style objects as Mixed or stringified JSON if needed.
    // Given the interface `imageStyle?: ImageStyle`, we'll use Mixed to allow flexibility.
    imageStyle: { type: mongoose.Schema.Types.Mixed },

    // DimensionValue in RN can be number or string ("50%").
    leftSideWidth: { type: mongoose.Schema.Types.Mixed },
    rightSideWidth: { type: mongoose.Schema.Types.Mixed },

    ctaText: { type: String, required: true },
    ctaLink: { type: String, required: true },

    backgroundColor: { type: String },
    accentColor: { type: String },
    expierDate: { type: Date },
    priority: { type: Number },

    isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("Banner", bannerSchema);
