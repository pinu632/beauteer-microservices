import { ProductVariant } from '../models/variant.model.js';
import BaseHelper from '../utils/BaseHelper.js';

const variantHelper = new BaseHelper(ProductVariant);

export const createVariant = async (req, res, next) => {
    try {
        const variant = await variantHelper.addObject(req.body);
        res.status(201).json({
            success: true,
            data: variant,
        });
    } catch (error) {
        next(error);
    }
};

export const getAllVariants = async (req, res, next) => {
    try {
        // Allow filtering by productId directly from query
        const variants = await variantHelper.getAllObjects({
            query: req.query,
            populatedQuery: { path: 'productId', select: 'title' }
        });
        const count = await variantHelper.getAllObjectCount({ query: req.query });

        res.status(200).json({
            success: true,
            count,
            data: variants
        });
    } catch (error) {
        next(error);
    }
};

export const getVariantById = async (req, res, next) => {
    try {
        const variant = await variantHelper.getObjectById({
            id: req.params.id,
            populatedQuery: { path: 'productId', select: 'title' }
        });
        res.status(200).json({
            success: true,
            data: variant
        });
    } catch (error) {
        next(error);
    }
};

export const updateVariant = async (req, res, next) => {
    try {
        const variant = await variantHelper.updateObject(req.params.id, req.body);
        res.status(200).json({
            success: true,
            message: "Variant updated successfully",
            data: variant
        });
    } catch (error) {
        next(error);
    }
};

export const deleteVariant = async (req, res, next) => {
    try {
        await variantHelper.deleteObjectById(req.params.id);
        res.status(200).json({
            success: true,
            message: "Variant deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};
