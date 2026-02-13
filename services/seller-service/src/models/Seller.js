import mongoose from 'mongoose';

const sellerSchema = new mongoose.Schema({
    storeName: String,
    ownerName: String,
    email: String,
    phone: String,

    address: {
        city: String,
        state: String
    },

    isVerified: { type: Boolean, default: false },

    commissionRate: { type: Number, default: 10 }, // platform cut %

    totalEarnings: { type: Number, default: 0 },
    pendingEarnings: { type: Number, default: 0 }

}, { timestamps: true });

const Seller = mongoose.model('Seller', sellerSchema);

export default Seller;
