import Payment from '../models/Payment.js';

export const getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        res.status(200).json({ status: 'success', data: payment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const getPaymentByOrderId = async (req, res) => {
    try {
        const payment = await Payment.findOne({ orderId: req.params.orderId });
        if (!payment) {
            // It's possible a payment hasn't been created yet for an order
            return res.status(404).json({ message: 'Payment not found for this order' });
        }
        res.status(200).json({ status: 'success', data: payment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllPaymentLogs = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;

        const query = {};

        if (status) {
            query.status = status;
        }

        if (search) {
            // Basic search by transaction ID or gateway ID if needed
            // For now, let's allow searching by orderId or paymentId if provided
            // OR regex on string fields
            query.$or = [
                { gatewayPaymentId: { $regex: search, $options: 'i' } },
                { gatewayOrderId: { $regex: search, $options: 'i' } },
                // Add more fields as needed
            ];
        }

        const payments = await Payment.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Payment.countDocuments(query);

        res.status(200).json({
            status: 'success',
            data: payments,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalUtils: count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
