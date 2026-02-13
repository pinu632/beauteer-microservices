import express from 'express';
import {
    createInternalUser,
    getAllUsers,
    updateUserRole,
    toggleUserBlock
} from '../controllers/iam.controller.js';
import { isAuthenticated, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protect all routes
router.use(isAuthenticated);
router.use(authorizeRoles('admin'));

router.post('/create', createInternalUser);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/block', toggleUserBlock);

export default router;
