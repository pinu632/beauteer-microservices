import express from 'express';
import { getPaymentById, getPaymentByOrderId, getAllPaymentLogs } from '../controllers/payment.controller.js';

const router = express.Router();


router.get('/logs', getAllPaymentLogs);
router.get('/:id', getPaymentById);

router.get('/order/:orderId', getPaymentByOrderId);

export default router;
