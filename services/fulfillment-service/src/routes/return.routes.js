import express from 'express';
import { requestReturn, updateReturnStatus, confirmReturnPickup } from '../controllers/return.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/',isAuthenticated, requestReturn);
router.patch('/:id/status', updateReturnStatus);
router.post('/:id/pickup', confirmReturnPickup);

export default router;
