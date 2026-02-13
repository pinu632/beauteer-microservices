import { ParentOrder } from "../models/parentOrder.model.js";
import OrderItem from "../models/orderItem.model.js";
import { publishToQueue } from "../workers/publisher.js";
import { ORDER_CREATED, ORDER_ITEM_CANCELLED, ORDER_ITEM_UPDATE } from "../constants/eventConstant.js";
import AppError from "../handlers/AppError.js";
import axios from "axios";


export const createOrder = async (req, res, next) => {
    try {
        const { items, addressId, paymentMethod } = req.body;
        const userId = req.user.id;

        if (!items || items.length === 0) {
            return next(new AppError("Order must contain at least one item", 400));
        }

        // Validate quantities
        for (const item of items) {
            if (!item.quantity || item.quantity <= 0) {
                return next(new AppError("Invalid quantity", 400));
            }
        }

        const productIds = items.map(item => item.productId);

        // 🔹 Fetch Products from Product Service
        const { data: productData } = await axios.post(
            'http://product-service:3002/api/v1/products/p/list',
            { filter: { _id: { $in: productIds } } }
        );

        if (!productData || productData.length === 0) {
            return next(new AppError("Products not found", 404));
        }

        const productMap = new Map(
            productData.map(p => [p._id.toString(), p])
        );

        let totalAmount = 0;
        const orderItemsPayload = [];

        // 🔹 Build order items using PRODUCT SERVICE data
        for (const item of items) {
            const product = productMap.get(item.productId.toString());

            if (!product) {
                return next(new AppError(`Product ${item.productId} not found`, 404));
            }

            // Stock check (optional if inventory service handles)
            if (product.stock < item.quantity) {
                return next(new AppError(`${product.title} is out of stock`, 400));
            }

            const price = product.discountPrice || product.price;

            totalAmount += price * item.quantity;

            orderItemsPayload.push({
                productId: product._id,
                sellerId: product.sellerId,
                titleSnapshot: product.title,
                price,
                quantity: item.quantity,
                status: "PLACED"
            });
        }

        const finalAmount = totalAmount;

        // 🔹 Create Parent Order
        const parentOrder = await ParentOrder.create({
            userId,
            shippingAddress: addressId,
            paymentMethod,
            status: "PENDING",
            totalAmount,
            finalAmount
        });

        // 🔹 Create Order Items
        const createdOrderItems = await OrderItem.insertMany(
            orderItemsPayload.map(i => ({
                ...i,
                parentOrderId: parentOrder._id
            }))
        );

        // 🔹 Link items to parent
        parentOrder.orderItems = createdOrderItems.map(i => i._id);
        await parentOrder.save();

        // 🔹 Publish event to Inventory Service
        await publishToQueue({
            queue_name: "inventory_queue",
            event_name: ORDER_CREATED,
            data: {
                orderId: parentOrder._id,
                userId,
                paymentMode: paymentMethod,
                finalAmount,
                items: createdOrderItems.map(i => ({
                    productId: i.productId,
                    quantity: i.quantity
                }))
            }
        });

        // 🔹 Publish event to Notification Service
        await publishToQueue({
            queue_name: "notification_queue",
            event_name: "ORDER_CONFIRMED", // Using specific event key
            data: {
                orderId: parentOrder._id,
                userId,
                // deviceToken: req.user.deviceToken // If available in req.user
            }
        });

        res.status(201).json({
            status: "success",
            message: "Order created successfully",
            orderId: parentOrder._id
        });

    } catch (error) {
        next(error);
    }
};



export const updateParentOrderWithSellerData = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { sellerOrders, status } = req.body;

        const parentOrder = await ParentOrder.findById(id);
        if (!parentOrder) {
            return next(new AppError("Parent Order not found", 404));
        }

        if (sellerOrders) parentOrder.sellerOrders = sellerOrders;

        if (status) {
            parentOrder.status = status;

            // 🔹 Map status to Notification Event
            let eventName = null;
            if (status === "PROCESSED") eventName = "ORDER_PROCESSED";
            else if (status === "SHIPPED") eventName = "ORDER_SHIPPED";
            else if (status === "OUT_FOR_DELIVERY") eventName = "ORDER_OUT_FOR_DELIVERY";
            else if (status === "DELIVERED") eventName = "ORDER_DELIVERED";

            if (eventName) {
                await publishToQueue({
                    queue_name: "notification_queue",
                    event_name: eventName,
                    data: {
                        orderId: parentOrder._id,
                        userId: parentOrder.userId,
                        status
                    }
                });
            }
        }

        await parentOrder.save();

        res.status(200).json({
            status: "success",
            message: "Parent Order updated successfully",
            data: {
                parentOrder
            }
        });

    } catch (error) {
        next(error);
    }
};

export const getOrdersByUser = async (req, res, next) => {
    try {
        const { id: userId } = req.user;

        if (!userId) {
            return next(new AppError("User ID is required", 400));
        }

        const orders = await ParentOrder.find({ userId }).populate('orderItems').sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: orders
        });
    } catch (error) {
        next(error);
    }
};

export const getOrderItemDetails = async (req, res, next) => {
    try {
        const { orderItemId, parentOrderId } = req.params;

        const orderItem = await OrderItem.findById(orderItemId);

        if (!orderItem) {
            return next(new AppError("Order Item not found", 404));
        }

        // Verify parent order match
        if (orderItem.parentOrderId.toString() !== parentOrderId) {
            return next(new AppError("Order Item does not belong to this parent order", 400));
        }

        res.status(200).json({
            success: true,
            data: orderItem
        });

    } catch (error) {
        next(error);
    }
}

export const getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const order = await ParentOrder.findById(id).populate('orderItems');

        if (!order) {
            return next(new AppError("Order not found", 404));
        }

        res.status(200).json(order);
    } catch (error) {
        next(error);
    }
};

export const getAllOrders = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const query = {};
        if (status) query.status = status;

        const orders = await ParentOrder.find(query)
            .populate('orderItems')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const count = await ParentOrder.countDocuments(query);

        res.status(200).json({
            success: true,
            totalByUser: count, // Using existing response field naming convention if any, or standard
            data: orders,
        });
    } catch (error) {
        next(error);
    }
};

export const updateOrderItemStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return next(new AppError("Status is required", 400));
        }

        const orderItem = await OrderItem.findById(id);
        if (!orderItem) {
            return next(new AppError("Order Item not found", 404));
        }

        orderItem.status = status;
        orderItem.statusHistory.push({
            status,
            date: new Date()
        });

        await orderItem.save();

        const parentOrder = await ParentOrder.findById(orderItem.parentOrderId);

        // Event Payload
        const eventData = {
            orderItemId: orderItem._id,
            parentOrderId: orderItem.parentOrderId,
            productId: orderItem.productId,
            sellerId: orderItem.sellerId,
            sellerOrderId: orderItem.sellerOrderId,
            userId: parentOrder ? parentOrder.userId : null,
            quantity: orderItem.quantity,
            price: orderItem.price,
            status,
            orderId: parentOrder._id // For payment service reference
        };

        if (status === "CANCELLED") {
            // 1. Inventory Service: Release Reserved Stock
            await publishToQueue({
                queue_name: "inventory_queue",
                event_name: ORDER_ITEM_CANCELLED,
                data: eventData
            });

            // 2. Payment Service: Refund or Adjust Transaction
            await publishToQueue({
                queue_name: "payment_queue",
                event_name: ORDER_ITEM_CANCELLED,
                data: eventData
            });

            // 3. Seller Service: Update Seller Order Status
            await publishToQueue({
                queue_name: "seller_queue",
                event_name: ORDER_ITEM_CANCELLED,
                data: eventData
            });

        } else {
            // For other statuses, notify seller service
            await publishToQueue({
                queue_name: "seller_queue",
                event_name: ORDER_ITEM_UPDATE,
                data: eventData
            });
        }

        res.status(200).json({
            success: true,
            message: `Order Item status updated to ${status}`,
            data: orderItem
        });

    } catch (error) {
        next(error);
    }
};
