import express from 'express';
import { getInventory, getInventoryByProductId, createInventory, updateStock, bulkUploadInventory } from '../controllers/inventory.controller.js';

const router = express.Router();

router.get('/', getInventory);
router.get('/product/:productId', getInventoryByProductId);
router.post('/', createInventory);
router.put('/:id/stock', updateStock);
router.post('/bulk', bulkUploadInventory);

export default router;
