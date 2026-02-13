import { QUEUES, EVENTS } from '../constants.js';
import Seller from '../models/Seller.js';
import { getChannel } from '../utils/rabbitmq.js';
import { publishToQueue } from '../workers/publisher.js';

export const createSellerProfile = async (req, res, next) => {
    try {
        const { storeName, ownerName, email, phone, address } = req.body;

        const existingSeller = await Seller.findOne({ email });
        if (existingSeller) {
            const error = new Error('Seller profile already exists for this email');
            error.statusCode = 400;
            throw error;
        }

        const seller = new Seller({
            storeName,
            ownerName,
            email,
            phone,
            address
        });

        await publishToQueue({
            queue_name: QUEUES.PRODUCT_QUEUE,
            event_name: EVENTS.SELLER_CREATED,
            data: {
                sellerId: seller._id,
                storeName: seller.storeName,
                ownerName: seller.ownerName,
                address: seller.address,
               
            }
        });

        await seller.save();

        res.status(201).json({
            status: 'success',
            data: seller
        });
    } catch (error) {
        next(error);
    }
};

export const createBulkSellers = async (req, res, next) => {
    try {
        const sellers = req.body; // Expecting an array of seller objects

        if (!Array.isArray(sellers) || sellers.length === 0) {
            const error = new Error('Please provide an array of sellers');
            error.statusCode = 400;
            throw error;
        }

        const createdSellers = await Seller.insertMany(sellers);
        createdSellers.forEach(seller => {
            publishToQueue({
                queue_name: QUEUES.PRODUCT_QUEUE,
                event_name: EVENTS.SELLER_CREATED,
                data: {
                    sellerId: seller._id,
                    storeName: seller.storeName,
                    ownerName: seller.ownerName,
                    address: seller.address,
                   
                }
            });
        });

        res.status(201).json({
            status: 'success',
            count: createdSellers.length,
            data: createdSellers
        });
    } catch (error) {
        next(error);
    }
};

export const getSellerProfile = async (req, res, next) => {
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
};

export const updateSellerProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Prevent updating sensitive fields directly
        delete updates.totalEarnings;
        delete updates.pendingEarnings;

        const seller = await Seller.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

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
};
