import bcrypt from "bcryptjs";
import AppError from "../handlers/AppError.js";
import { findUserByEmail } from "../utils/findUser.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const login = async (req, res, next) => {
    try {
        console.log(req.body);
        const { email, password } = req.body;

        const user = await User.findOne({
            email
        }).select("+password");
        if (!user) return next(new AppError("User not found", 404));

        console.log(user)
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) return next(new AppError("Invalid credentials", 401));

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        return res.json({
            success: true,
            message: "Logged in successfully",
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                avatar: user.avatar, // note: avatar might not be in schema, check if needed
            },
        });
    } catch (error) {
        next(error);
    }
};

export const register = async (req, res, next) => {
    try {
        const { name, email, password, phone, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return next(new AppError("User already exists", 400));

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            name,
            email,
            phone,
            password: hashedPassword,
            role: role || "customer",
        });

        await user.save();

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        next(error);
    }
};

export const refreshAccessToken = async (req, res, next) => {
    try {
        const token = req.body.refreshToken;

        if (!token) return next(new AppError("No refresh token", 401));

        jwt.verify(
            token,
            process.env.REFRESH_TOKEN_SECRET || "refresh_secret",
            async (err, decoded) => {
                if (err) return next(new AppError("Invalid refresh token", 403));

                // get user from DB
                let user = await User.findById(decoded.id);

                if (!user) return next(new AppError("User no longer exists", 404));

                const newAccessToken = generateAccessToken(user);

                return res.json({
                    success: true,
                    accessToken: newAccessToken,
                });
            }
        );
    } catch (error) {
        next(error);
    }
};

export const getMe = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return next(new AppError("No token provided", 401));
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || "access_secret", async (err, decoded) => {
            if (err) return next(new AppError("Invalid token", 401));
            // get user from DB
            let user = await User.findById(decoded.id);

            if (!user) return next(new AppError("User no longer exists", 404));
            return res.json({
                success: true,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        });
    } catch (error) {
        next(error);
    }
};

export const verifyPin = async (req, res, next) => {
    return res.json({ verified: true });
};
