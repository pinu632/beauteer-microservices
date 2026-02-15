import ParentOrder from "../models/parentOrder.model.js";
import OrderItem from "../models/orderItem.model.js";
import AppError from "../handlers/AppError.js";
import { startOfDay, endOfDay, subDays } from "date-fns";
import mongoose from "mongoose";

// 1. Overview Cards
export const getOverviewCards = async (req, res, next) => {
    try {
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());

        // For Overview, we need:
        // 1. Total Revenue: Sum of itemTotal from OrderItems (status: DELIVERED/COMPLETED?) - sticking to DELIVERED as per request context usually
        // 2. Orders Today: Count of ParentOrders created today
        // 3. Total Orders: Count of ParentOrders
        // 4. Average Order Value: Total Revenue / Total COMPLETED Orders (or all orders? usually completed ones for value)
        // 5. Pending Orders: ParentOrders with status PLACED/PARTIALLY_CONFIRMED

        // Parallel execution for independently fetchable metrics
        const [revenueData, ordersTodayData, totalOrdersData, pendingOrdersData] = await Promise.all([
            // 1. & 4. Revenue & Avg Order Value (Base)
            OrderItem.aggregate([
                { $match: { status: "DELIVERED" } },
                { $group: { _id: null, totalRevenue: { $sum: "$itemTotal" }, count: { $sum: 1 } } }
            ]),
            // 2. Orders Today
            ParentOrder.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
            // 3. Total Orders
            ParentOrder.countDocuments({}),
            // 5. Pending Orders
            ParentOrder.countDocuments({ overallStatus: { $in: ["PLACED", "PARTIALLY_CONFIRMED"] } })
        ]);

        const totalRevenue = revenueData[0]?.totalRevenue || 0;
        const totalDeliveredItems = revenueData[0]?.count || 0;

        // For "Average Order Value", usually it's Total Revenue / Total Orders. 
        // If we use OrderItems for revenue, we should probably average over the number of "orders" that generated that revenue, not items.
        // Let's get the distinct count of parent orders that contributed to the revenue for a more accurate AOV.
        const deliveredOrdersCountData = await OrderItem.distinct("parentOrderId", { status: "DELIVERED" });
        const deliveredOrdersCount = deliveredOrdersCountData.length || 1; // avoid divide by zero

        const avgOrderValue = Math.round(totalRevenue / deliveredOrdersCount);

        const data = {
            totalRevenue,
            ordersToday: ordersTodayData,
            totalOrders: totalOrdersData,
            averageOrderValue: avgOrderValue,
            pendingOrders: pendingOrdersData
        };

        res.status(200).json({ status: "success", data });
    } catch (error) {
        next(error);
    }
};

// 2. Sales Trend
export const getSalesTrend = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        let start, end;
        if (startDate && endDate) {
            start = startOfDay(new Date(startDate));
            end = endOfDay(new Date(endDate));
        } else {
            // Default to last 7 days
            end = endOfDay(new Date());
            start = subDays(end, 7);
        }

        const salesTrend = await OrderItem.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    status: { $ne: "CANCELLED" }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$itemTotal" },
                    itemsSold: { $sum: 1 } // Counting items, not orders, as we are in OrderItem collection
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // To get "orders" count per day, we'd need to count unique parentOrderId per day.
        // It's slightly more complex in one pass. Let's do a second query or adjust.
        // For simplicity and speed, "Sales Trend" often implies revenue. If "orders" count is strictly needed, 
        // we might stick to ParentOrder for the count of orders, but use OrderItem for revenue.
        // However, mixing them might cause mismatched dates if an item is added later (rare). 
        // Let's stick to OrderItem aggregation, but if we need unique orders count:

        // Alternative: Sales Trend based on ParentOrder for *Order Count* and OrderItem for *Revenue*? 
        // Or just return items sold count which is also consistent. 
        // Let's return revenue and attempt to get unique orders count if possible, or just orders count from ParentOrder separately.
        // Actually, let's keep it simple: Sales Trend = Date, Revenue (from Items). 
        // If "orders" count is displayed, fetch from ParentOrder separately or accept "Items Sold" as valid metric.
        // Let's join the data from ParentOrder for accurate "Orders" count per day.

        const orderTrend = await ParentOrder.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    overallStatus: { $ne: "CANCELLED" }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Merge results
        const result = {};
        salesTrend.forEach(item => {
            if (!result[item._id]) result[item._id] = { date: item._id, revenue: 0, orders: 0 };
            result[item._id].revenue = item.revenue;
        });
        orderTrend.forEach(item => {
            if (!result[item._id]) result[item._id] = { date: item._id, revenue: 0, orders: 0 };
            result[item._id].orders = item.orders;
        });

        // Convert back to sorted array
        const finalData = Object.values(result).sort((a, b) => a.date.localeCompare(b.date));

        res.status(200).json({ status: "success", data: finalData });
    } catch (error) {
        next(error);
    }
};

// 3. Product Performance
export const getProductPerformance = async (req, res, next) => {
    try {
        const products = await OrderItem.aggregate([
            {
                $group: {
                    _id: "$productId",
                    productName: { $first: "$titleSnapshot" }, // Rely on snapshot
                    totalSold: { $sum: "$quantity" },
                    revenue: { $sum: "$itemTotal" }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);

        res.status(200).json({ status: "success", data: products });
    } catch (error) {
        next(error);
    }
};

// 4. Customer Insights (New vs Returning)
export const getCustomerInsights = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        let start, end;

        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
        } else {
            // Default last 30 days
            end = new Date();
            start = subDays(end, 30);
        }

        // 1. Get all userIds who ordered in the range
        // Self-lookup on ParentOrder is valid as it's the same collection context
        const insights = await ParentOrder.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: { _id: "$userId" }
            },
            {
                $lookup: {
                    from: "parentorders", // Ensure this matches MongoDB collection name (usually lowercase plural of model name)
                    let: { user: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$userId", "$$user"] },
                                        { $lt: ["$createdAt", start] } // Order BEFORE the period
                                    ]
                                }
                            }
                        },
                        { $limit: 1 }
                    ],
                    as: "pastOrders"
                }
            },
            {
                $project: {
                    isReturning: { $gt: [{ $size: "$pastOrders" }, 0] }
                }
            },
            {
                $group: {
                    _id: "$isReturning",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Format output
        const result = { newCustomers: 0, returningCustomers: 0 };
        insights.forEach(i => {
            if (i._id === true) result.returningCustomers = i.count;
            if (i._id === false) result.newCustomers = i.count;
        });

        res.status(200).json({ status: "success", data: result });
    } catch (error) {
        next(error);
    }
};

// 5. Order Health
export const getOrderHealth = async (req, res, next) => {
    try {
        const orderStats = await ParentOrder.aggregate([
            {
                $group: {
                    _id: "$overallStatus",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Transform to map for easier frontend use usually, or just return list
        const stats = {};
        orderStats.forEach(stat => {
            stats[stat._id] = stat.count;
        });

        res.status(200).json({ status: "success", data: stats });
    } catch (error) {
        next(error);
    }
};
