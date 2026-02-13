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
