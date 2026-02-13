import jwt from 'jsonwebtoken';
// import User from '../models/User'; // If we need to check user existence in DB, but usually for microservices we just verify token signature or rely on gateway. 
// For this service, we might just verify signature if we share secret, or just trust the gateway if it passes user info.
// Assuming we verify key.

export const verifyToken = async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized to access this route' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id: '...', role: '...' }
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Not authorized to access this route' });
    }
};
