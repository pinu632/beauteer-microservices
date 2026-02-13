import mongoose from 'mongoose';

const supportAgentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true }, // Link to User service
    name: String,
    email: String,
    role: {
        type: String,
        enum: ["L1", "L2", "L3", "SUPERVISOR", "ADMIN"],
        default: "L1"
    },

    skills: [String],

    isOnline: { type: Boolean, default: false },

    activeTickets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ticket" }],

    maxTickets: { type: Number, default: 20 },

    status: {
        type: String,
        enum: ["AVAILABLE", "BUSY", "OFFLINE"],
        default: "OFFLINE"
    }

}, { timestamps: true });

export default mongoose.model('SupportAgent', supportAgentSchema);
