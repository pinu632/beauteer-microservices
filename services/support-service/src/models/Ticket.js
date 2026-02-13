import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
    ticketId: { type: String, unique: true, index: true },

    userId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Assuming separate user service, removed ref for loose coupling or keep strict if preferred. User's schemas use ref 'User'.
    sellerOrderId: { type: mongoose.Schema.Types.ObjectId }, // ref 'SellerOrder'
    sellerId: { type: mongoose.Schema.Types.ObjectId }, // ref 'Seller'
    orderItemId: { type: mongoose.Schema.Types.ObjectId }, // ref 'OrderItem' if exists, otherwise can just use sellerOrderId and product details

    subject: String,
    description: String,

    type: {
        type: String,
        enum: ["GRIEVANCE", "REFUND", "RETURN", "PAYMENT", "TECHNICAL", "GENERAL","SUPPORT"],
        default: "GENERAL"
    },

    category: String,
    subCategory: String,

    status: {
        type: String,
        enum: ["OPEN", "ASSIGNED", "PENDING_USER", "PENDING_SELLER", "ESCALATED", "RESOLVED", "CLOSED"],
        default: "OPEN"
    },

    priority: {
        type: String,
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        default: "MEDIUM"
    },

    source: {
        type: String,
        enum: ["APP", "WEB", "EMAIL", "CALL", "BOT"],
        default: "APP"
    },

    tags: [String],

    assignedAgentId: { type: mongoose.Schema.Types.ObjectId, ref: "SupportAgent" },

    firstResponseAt: Date,
    resolvedAt: Date,
    closedAt: Date,

    slaDueAt: Date,

}, { timestamps: true });

export default mongoose.model('Ticket', ticketSchema);
