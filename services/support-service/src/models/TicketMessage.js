import mongoose from 'mongoose';

const ticketMessageSchema = new mongoose.Schema({
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", index: true },

    senderType: {
        type: String,
        enum: ["USER", "AGENT", "SELLER", "SYSTEM"],
        required: true
    },

    senderId: mongoose.Schema.Types.ObjectId,

    message: String,
    attachments: [String],

    isInternal: { type: Boolean, default: false },

    readBy: [{
        userId: mongoose.Schema.Types.ObjectId,
        readAt: Date
    }]

}, { timestamps: true });

export default mongoose.model('TicketMessage', ticketMessageSchema);
