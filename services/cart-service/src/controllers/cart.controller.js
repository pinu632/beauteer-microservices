import * as cartHelper from "../helpers/cart.helper.js";
import CartActivity from "../models/cartActivity.model.js";

export const getCart = async (req, res) => {
    try {
        const userId  = req.user.id  // Assuming auth middleware populates req.user or passed as param for now

        let cart = await cartHelper.getCartByUserId(userId);
        if (!cart) {
            cart = await cartHelper.createCart(userId);
        }

        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addToCart = async (req, res) => {
    try {
         console.log(req.user);
        const  userId  = req.user.id 
        console.log(req.user);
        const { productId, productName, productImage, price, quantity } = req.body;

        let cart = await cartHelper.getCartByUserId(userId);
        if (!cart) {
            cart = await cartHelper.createCart(userId);
        }

        const existingItemIndex = cart.items.findIndex(item => item.productId === productId);

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            cart.items.push({
                productId,
                productName,
                productImage,
                priceAtAddTime: price,
                quantity
            });
        }

        await cartHelper.saveCart(cart);

        // Log Activity
        await CartActivity.create({
            userId,
            product: { productId, productName, price },
            action: "ADD_ITEM",
            quantityChange: quantity,
            cartValueAfterAction: cart.totalPrice,
            device: req.headers['user-agent'], // Simplified device detection
            source: "web"
        });

    res.status(200).json({
        message: "Item added to cart",
        
    });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
};

export const reduceQuantity = async (req, res) => {
    try {
        const { id:userId } = req.user || req.body;
        const { productId } = req.body;

        let cart = await cartHelper.getCartByUserId(userId);
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        const existingItemIndex = cart.items.findIndex(item => item.productId === productId);

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity -= 1;
        }

        await cartHelper.saveCart(cart);

        // Log Activity
        await CartActivity.create({
            userId,
            product: { productId },
            action: "DECREASE_QTY",
            cartValueAfterAction: cart.totalPrice,
            source: "web"
        });

        res.status(200).json(cart);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
};

export const removeFromCart = async (req, res) => {
    try {
        const { id:userId } = req.user || req.body;
        const { productId } = req.body;

        let cart = await cartHelper.getCartByUserId(userId);
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        cart.items = cart.items.filter(item => item.productId !== productId);

        await cartHelper.saveCart(cart);

        // Log Activity
        await CartActivity.create({
            userId,
            product: { productId },
            action: "REMOVE_ITEM",
            cartValueAfterAction: cart.totalPrice,
            source: "web"
        });

        res.status(200).json(cart);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
};

export const clearCart = async (req, res) => {
    try {
        const { id:userId } = req.user || req.body;
        const cart = await cartHelper.clearCart(userId);

        // Log Activity
        await CartActivity.create({
            userId,
            action: "CLEAR_CART",
            cartValueAfterAction: 0,
            source: "web"
        });

        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
