import mongoose from 'mongoose';

const ticketActivitySchema = new mongoose.Schema({
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket" },
    action: String,
    performedBy: mongoose.Schema.Types.ObjectId, // User or Agent ID
    meta: mongoose.Schema.Types.Mixed
}, { timestamps: true });

export default mongoose.model('TicketActivityLog', ticketActivitySchema);
