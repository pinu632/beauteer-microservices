import jwt from 'jsonwebtoken';
import AppError from '../handlers/AppError.js';

export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(new AppError('No token provided, authorization denied', 401));
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return next(new AppError('No token provided, authorization denied', 401));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        return next(new AppError('Token is not valid', 401));
    }
};
