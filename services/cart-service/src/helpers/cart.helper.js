import Cart from "../models/cart.model.js";

export const getCartByUserId = async (userId) => {
    return await Cart.findOne({ userId });
};

export const createCart = async (userId) => {
    return await Cart.create({ userId, items: [] });
};

export const saveCart = async (cart) => {
    return await cart.save();
};

export const clearCart = async (userId) => {
    return await Cart.findOneAndUpdate(
        { userId },
        { items: [], totalItems: 0, totalPrice: 0 },
        { new: true }
    );
};
