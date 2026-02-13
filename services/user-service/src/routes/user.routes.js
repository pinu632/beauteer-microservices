import express from 'express';
import {
    createUser,
    updateUser,
    getAllUsers,
    getUserById,
    updateUserById,
    deleteUser,
} from '../controllers/user.controller.js';
import { isAuthenticated, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public Routes (or Admin only? Usually creation is public if registration, but here we have auth routes for that. keeping create for admin or internal use maybe?)
// Assuming createUser is an admin function or handled via auth.controller.register
// For now, let's protect these user management routes

// Profile Route (User updates own profile)
router.put('/profile', isAuthenticated, updateUser);

// Admin Routes
router.use(isAuthenticated);

router.route('/')
    .get(getAllUsers)
    .post(createUser)
    .put(updateUser);

router.route('/:id')
    .get(getUserById)
    .put(updateUserById)
    .delete (deleteUser);

export default router;
