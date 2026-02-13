import mongoose from "mongoose";

const shipmentSchema = new mongoose.Schema({
    sellerOrderId: { type: mongoose.Schema.Types.ObjectId},
    parentOrderId: { type: mongoose.Schema.Types.ObjectId},
    sellerId: { type: mongoose.Schema.Types.ObjectId},

    courierName: {
        type: String,
        enum: ["Delhivery", "Ecom Express", "India Post", "BlueDart", "Ekart", "Other"],
        default: "Other"
    },
    trackingNumber: String,

    shipmentStatus: {
        type: String,
        enum: [
            "CREATED", "PICKED_UP",
            "IN_TRANSIT", "OUT_FOR_DELIVERY",
            "DELIVERED", "CANCELLED", "RETURN_REQUESTED", "RETURNED"
        ],
        default: "CREATED"
    },

    trackingHistory: [
        {
            status: String,
            slug: String, // e.g. "in-transit"
            location: String,
            remark: String,
            timestamp: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

export default mongoose.model("Shipment", shipmentSchema);
