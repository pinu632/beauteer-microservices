import express from 'express';


import {
    createOrder,
    getOrdersByUser,
    updateParentOrderWithSellerData,
    getOrderItemDetails,
    getOrderItemById,

    getOrderById,
    getAllOrders,
    updateOrderItemStatus
} from '../controllers/order.controller.js';

const router = express.Router();

import { authMiddleware } from '../middlewares/auth.middleware.js';

router.post('/', authMiddleware, createOrder);
router.get('/', authMiddleware, getOrdersByUser);
// router.get('/user/:userId', getMyOrders);
// router.get('/seller/:sellerId', getSellerOrders);
// router.patch('/seller-order/:id/status', updateSellerOrderStatus);

// Internal endpoint for seller-service to update parent order
router.patch('/:id/seller-update', updateParentOrderWithSellerData)
router.get('/items/:orderItemId', getOrderItemById);
router.get('/items/:orderItemId/:parentOrderId', getOrderItemDetails);
router.patch('/items/:id/status', updateOrderItemStatus);
router.get('/all/list', getAllOrders);
router.get('/:id', getOrderById);

export default router;
