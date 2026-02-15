import express from "express";
import {
    getOverviewCards,
    getSalesTrend,
    getProductPerformance,
    getCustomerInsights,
    getOrderHealth
} from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/overview", getOverviewCards);
router.get("/sales-trend", getSalesTrend);
router.get("/product-performance", getProductPerformance);
router.get("/customer-insights", getCustomerInsights);
router.get("/order-health", getOrderHealth);

export default router;
