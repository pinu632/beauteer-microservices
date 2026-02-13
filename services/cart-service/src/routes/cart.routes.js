import express from "express";
import { getCart, addToCart, removeFromCart, reduceQuantity, clearCart } from "../controllers/cart.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getCart); // Simplified for dev, usually uses middleware
router.post("/add", authMiddleware, addToCart);
router.post("/remove", authMiddleware, removeFromCart);
router.post("/reduce", authMiddleware, reduceQuantity);
router.post("/clear", authMiddleware, clearCart);

export default router;
