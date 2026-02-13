import { User } from "../models/user.model.js";
import AppError from "../handlers/AppError.js";
import bcrypt from "bcryptjs";

// Create Internal User (Admin only)
export const createInternalUser = async (req, res, next) => {
    try {
        const { name, email, password, role, phone } = req.body;

        // Ensure we don't accidentally create 'customer' via this admin route if we want to separate flows
        if (role === 'customer') {
            return next(new AppError("Cannot create customer via internal route", 400));
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new AppError("User with this email already exists", 400));
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role, // "product_manager", "admin", etc.
            phone,
            isEmailVerified: true // Internal users verify immediately or manually
        });

        await newUser.save();

        res.status(201).json({
            success: true,
            message: `User created successfully with role: ${role}`,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        next(error);
    }
};

// Get All Users (with filters)
export const getAllUsers = async (req, res, next) => {
    try {
        const { role, page = 1, limit = 10, search } = req.query;

        const query = {};

        if (role) {
            query.role = role;
        } else {
            // Optional: by default exclude customers if this view is for internal staff management
            query.role = { $ne: "customer" };
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        const users = await User.find(query)
            .select("-password")
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            count: users.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
            data: users
        });

    } catch (error) {
        next(error);
    }
};

// Update User Role
export const updateUserRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const user = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
            return next(new AppError("User not found", 404));
        }

        res.status(200).json({
            success: true,
            message: "User role updated successfully",
            user
        });

    } catch (error) {
        next(error);
    }
};

// Toggle Block Status
export const toggleUserBlock = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isBlocked } = req.body; // true or false

        const user = await User.findByIdAndUpdate(
            id,
            { isBlocked },
            { new: true }
        ).select("-password");

        if (!user) {
            return next(new AppError("User not found", 404));
        }

        res.status(200).json({
            success: true,
            message: `User ${isBlocked ? "blocked" : "unblocked"} successfully`,
            user
        });

    } catch (error) {
        next(error);
    }
};
