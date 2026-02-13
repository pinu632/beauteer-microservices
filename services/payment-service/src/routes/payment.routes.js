import express from 'express';
import { getPaymentById, getPaymentByOrderId } from '../controllers/payment.controller.js';

const router = express.Router();

router.get('/:id', getPaymentById);
router.get('/order/:orderId', getPaymentByOrderId);

export default router;
