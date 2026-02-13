import mongoose from "mongoose";

const returnSchema = new mongoose.Schema({
    sellerOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SellerOrder",
        required: true
    },
    shipmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shipment"
        // Can be null if return is requested before shipment exists (unlikely for returns, but possible for cancellations if we used this model, but this is for returns)
        // Usually return is after delivery, so shipment should exist.
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    description: String,
    images: [String], // URLs of uploaded images

    status: {
        type: String,
        enum: [
            "REQUESTED",
            "APPROVED",
            "REJECTED",
            "PICKUP_SCHEDULED",
            "RETURN_RECEIVED",
            "REFUND_INITIATED",
            "REFUNDED"
        ],
        default: "REQUESTED"
    },

  

    adminComment: String, // Reason for rejection or internal notes

    events: [{
        status: String,
        date: { type: Date, default: Date.now },
        remark: String
    }]

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

returnSchema.virtual("statusColor").get(function () {
    const colors = {
        "REQUESTED": "#3B82F6",         // Blue
        "APPROVED": "#10B981",          // Green
        "REJECTED": "#EF4444",          // Red
        "PICKUP_SCHEDULED": "#F59E0B",  // Amber
        "RETURN_RECEIVED": "#8B5CF6",   // Purple
        "REFUND_INITIATED": "#6366F1",  // Indigo
        "REFUNDED": "#059669"           // Dark Green
    };
    return colors[this.status] || "#6B7280"; // Default Gray
});

export default mongoose.model("Return", returnSchema);
