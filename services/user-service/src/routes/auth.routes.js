import express from 'express';
import {
    login,
    register,
    refreshAccessToken,
    getMe,
    verifyPin,
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshAccessToken);
router.get('/me', getMe);
router.post('/verify-pin', verifyPin);

export default router;
