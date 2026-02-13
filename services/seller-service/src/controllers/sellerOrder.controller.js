import Seller from "../models/Seller.js";
import { SellerOrder } from "../models/sellerOrders.js";


export const getSellerOrders = async (req, res, next) => {
    try {
        const { id } = req.params;
        const seller = await Seller.findById(id);


        if (!seller) {
            const error = new Error('Seller profile not found');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            status: 'success',
            data: seller
        });
    } catch (error) {
        next(error);
    }
}

export const getAllSellerOrder = async (req, res, next) => {
    try {
        const { status, pageSize = 10, PageNum = 1 } = req.query;
        const query = {};

        if (status) {
            query.status = status;
        }

        const limit = parseInt(pageSize);
        const skip = (parseInt(PageNum) - 1) * limit;

        const orders = await SellerOrder.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        const totalOrders = await SellerOrder.countDocuments(query);

        res.status(200).json({
            status: 'success',
            results: orders.length,
            total: totalOrders,
            PageNum: parseInt(PageNum),
            pageSize: limit,
            data: orders
        });
    } catch (error) {
        next(error);
    }
}
