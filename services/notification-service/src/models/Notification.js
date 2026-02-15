import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        index: true
    },

    eventKey: {
        type: String, // e.g. ORDER_SHIPPED, CART_ABANDONED_1H
        index: true
    },

    category: {
        type: String,
        enum: ["ORDER", "SUPPORT", "MARKETING", "SYSTEM"],
    },

    title: String,
    body: String,

    imageUrl: String, // for rich push

    action: {
        type: {
            type: String,
            enum: ["DEEPLINK", "URL", "NONE"],
            default: "NONE"
        },
        value: String
    },

    entity: {
        entityType: String, // Order, Ticket, Product
        entityId: mongoose.Schema.Types.ObjectId
    },

    metadata: mongoose.Schema.Types.Mixed,

    status: {
        type: String,
        enum: ["UNREAD", "READ", "ARCHIVED"],
        default: "UNREAD"
    },

    expiresAt: Date, // marketing notifications auto-expire
    sentAt: Date

}, { timestamps: true });

notificationSchema.index({ userId: 1, status: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
