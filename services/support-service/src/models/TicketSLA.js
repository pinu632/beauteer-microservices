import mongoose from 'mongoose';

const ticketSlaSchema = new mongoose.Schema({
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket" },

    firstResponseDue: Date,
    resolutionDue: Date,

    firstResponseMet: Boolean,
    resolutionMet: Boolean
}, { timestamps: true });

export default mongoose.model('TicketSLA', ticketSlaSchema);
