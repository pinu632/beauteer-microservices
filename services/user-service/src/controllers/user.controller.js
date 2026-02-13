import { User } from '../models/user.model.js';
import BaseHelper from '../utils/BaseHelper.js';
import AppError from '../handlers/AppError.js';
import bcrypt from 'bcryptjs';

const userHelper = new BaseHelper(User);

export const createUser = async (req, res, next) => {
    try {
        const user = await userHelper.addObject(req.body);
        res.status(201).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

// User: Update own profile
export const updateUser = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { name, email, password } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return next(new AppError("User not found", 404));
        }

        if (name) user.name = name;
        if (email) user.email = email;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                avatar: user.avatar
            }
        });

    } catch (error) {
        next(error);
    }
};

// Admin: Get all users
export const getAllUsers = async (req, res, next) => {
    try {
        const { role } = req.query;
        const query = role ? { role } : {};
        const users = await User.find(query).select("-password");
        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        next(error);
    }
};

// Admin: Get user by ID
export const getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) {
            return next(new AppError("User not found", 404));
        }
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// Admin: Update user details (e.g., status, role)
export const updateUserById = async (req, res, next) => {
    try {
        const { name, email, role, status } = req.body;
        const userId = req.params.id || req.user.id; // Allow both admin and user to update
        const user = await User.findById(userId);

        if (!user) {
            return next(new AppError("User not found", 404));
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        if (status) user.status = status;

        await user.save();

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        await userHelper.deleteObjectById(req.params.id);

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (error) {
        next(error);
    }
};
