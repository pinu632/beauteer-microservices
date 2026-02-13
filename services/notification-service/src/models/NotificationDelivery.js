import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema({
    notificationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notification",
        required: true,
        index: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    channel: {
        type: String,
        enum: ["PUSH", "EMAIL", "SMS"],
        required: true
    },

    provider: {
        type: String, // FCM, SES, Twilio
    },

    deviceToken: String, // only for push

    status: {
        type: String,
        enum: ["PENDING", "SENT", "DELIVERED", "FAILED"],
        default: "PENDING"
    },

    error: String,

    attempts: {
        type: Number,
        default: 0
    },

    sentAt: Date,
    deliveredAt: Date

}, { timestamps: true });

deliverySchema.index({ notificationId: 1, channel: 1 });

export const NotificationDelivery = mongoose.model("NotificationDelivery", deliverySchema);
