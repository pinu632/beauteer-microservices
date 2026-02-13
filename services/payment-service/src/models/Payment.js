import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({

    orderId: { type: mongoose.Schema.Types.ObjectId, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, index: true },

    gateway: {
        type: String,
        enum: ["RAZORPAY", "STRIPE", "PAYPAL", "PHONEPE", "COD"],
    },

    // User requested specific logic for gateway, we should ensure model supports it.
    // The user's code: gateway = isCOD ? "COD" : ... 
    // This matches the enum.

    gatewayOrderId: String,
    gatewayPaymentId: String,
    gatewaySignature: String,
    gatewayCustomerId: String,

    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    methodDetails: {
        upiId: String,
        cardNetwork: String,
        cardLast4: String,
        cardType: String,
        bankName: String,
        walletProvider: String
    },

    collectedAmount: { type: Number, default: 0 },
    pendingAmount: { type: Number },
    isFullyPaid: { type: Boolean, default: false },

    // 🔥 UPDATED TRANSACTIONS
    transactions: [{

        transactionId: String,

        orderItemId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        sellerOrderId: {
            type: mongoose.Schema.Types.ObjectId,
        },

        amount: Number,

        method: {
            type: String,
            enum: ["CARD", "UPI", "WALLET", "NETBANKING", "BNPL", "CASH","ORDER_CANCELLED"]
        },

        collectionSource: {
            type: String,
            enum: ["GATEWAY", "DELIVERY_AGENT", "STORE_COUNTER"],
            default: "GATEWAY"
        },

        status: {
            type: String,
            enum: ["SUCCESS", "FAILED", "ORDER_CANCELLED"]
        },

        collectedAt: Date
    }],

    status: {
        type: String,
        enum: [
            "CREATED",
            "INITIATED", // matches user's code
            "PENDING_COLLECTION",
            "PARTIALLY_PAID",
            "SUCCESS",
            "FAILED",
            "CANCELLED",
            "REFUND_INITIATED",
            "REFUNDED",
            "PARTIALLY_REFUNDED",
            "ORDER_CANCELLED"
        ],
        default: "CREATED",
        index: true
    },

    refunds: [{
        refundId: String,
        sellerOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SellerOrder"
        },
        orderItemId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        amount: Number,
        reason: String,
        status: String,
        processedAt: Date
    }],

    webhookEvents: [{
        eventId: String,
        eventType: String,
        payload: mongoose.Schema.Types.Mixed,
        receivedAt: Date
    }],

    metadata: mongoose.Schema.Types.Mixed,

}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);
