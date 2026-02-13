import express from 'express';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} from '../controllers/notification.controller.js';

// Assuming you have an authentication middleware. 
// If not, I'll need to create a placeholder or reference one.
// Typically: import { protect } from '../middlewares/auth.middleware.js';
// For now, I'll assume `protect` is available or user needs to add it.
// I'll create a placeholder middleware in src/middlewares/auth.js if needed.

const router = express.Router();

// Placeholder middleware logic if not imported
const protect = (req, res, next) => {
    // Logic to verify token and set req.user
    // For now, just pass through if not implemented elsewhere
    // But ideally this verifies JWT
    // if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    next();
};

import { verifyToken } from '../middlewares/auth.js'; // I will create this next

router.use(verifyToken);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);

export default router;
