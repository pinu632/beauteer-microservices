import mongoose from 'mongoose';

const ticketAssignmentSchema = new mongoose.Schema({
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket" },
    assignedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "SupportAgent" }, // or generic User ID if system assignment
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "SupportAgent" },
    reason: String,
}, { timestamps: true });

export default mongoose.model('TicketAssignment', ticketAssignmentSchema);
