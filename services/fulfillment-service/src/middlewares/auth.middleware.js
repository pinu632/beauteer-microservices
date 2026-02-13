import jwt from 'jsonwebtoken';
import AppError from '../handlers/AppError.js';

export const isAuthenticated = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new AppError('Not authorized to access this route', 401));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'access_secret');
            req.user = decoded;
            next();
        } catch (error) {
            return next(new AppError('Not authorized to access this route', 401));
        }
    } catch (error) {
        next(error);
    }
};

export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError(`User role ${req.user.role} is not authorized to access this route`, 403));
        }
        next();
    };
};
