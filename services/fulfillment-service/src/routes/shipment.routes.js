import { createShipment, getShipment, getShipmentByOrderId, getShipmentById,updateShipmentStatus, markAsDelivered, getShipmentTrackingDetails } from '../controllers/shipment.controller.js';
import express from 'express';
const router = express.Router();

router.post('/', createShipment);
router.post('/delivered', markAsDelivered);
router.get('/:id', getShipmentById); // This was missing or ambiguous. Assuming getShipment handles ID.
router.get('/order/:orderId', getShipmentByOrderId); // Explicit order ID endpoint
router.patch('/:id/status', updateShipmentStatus);
router.get('/track/:orderId/:orderItemId', getShipmentTrackingDetails);

export default router;
