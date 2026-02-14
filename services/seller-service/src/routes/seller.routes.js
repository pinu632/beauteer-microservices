import express from 'express';
import {
    getSellerProfile,
    updateSellerProfile,
    createBulkSellers
} from '../controllers/seller.controller.js';
import { getAllSellerOrder, getSellerOrderById } from '../controllers/sellerOrder.controller.js';

const router = express.Router();

// router.post('/', createSellerProfile);
router.post('/bulk', createBulkSellers);
router.get('/:id', getSellerProfile);
router.put('/:id', updateSellerProfile);

// Order routes
router.get('/orders/all', getAllSellerOrder);
router.get('/orders/:id', getSellerOrderById);

export default router;
