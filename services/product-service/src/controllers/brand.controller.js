import { Brand } from '../models/brand.model.js';
import BaseHelper from '../utils/BaseHelper.js';

const brandHelper = new BaseHelper(Brand);

export const createBrand = async (req, res, next) => {
    try {
        const brand = await brandHelper.addObject(req.body);
        res.status(201).json({
            success: true,
            data: brand,
        });
    } catch (error) {
        next(error);
    }
};

export const bulkCreateBrands = async (req, res, next) => {
    try {
        const brands = await brandHelper.insertMany(req.body);
        res.status(201).json({
            success: true,
            data: brands
        });
    } catch (error) {
        next(error);
    }
};

export const getAllBrands = async (req, res, next) => {
    try {
        const brands = await brandHelper.getAllObjects(req.query);
        const count = await brandHelper.getAllObjectCount({ query: req.query });

        res.status(200).json({
            success: true,
            count,
            data: brands
        });
    } catch (error) {
        next(error);
    }
};

export const getBrandById = async (req, res, next) => {
    try {
        const brand = await brandHelper.getObjectById({ id: req.params.id });
        res.status(200).json({
            success: true,
            data: brand
        });
    } catch (error) {
        next(error);
    }
};

export const updateBrand = async (req, res, next) => {
    try {
        const brand = await brandHelper.updateObject(req.params.id, req.body);
        res.status(200).json({
            success: true,
            message: "Brand updated successfully",
            data: brand
        });
    } catch (error) {
        next(error);
    }
};

export const deleteBrand = async (req, res, next) => {
    try {
        await brandHelper.deleteObjectById(req.params.id);
        res.status(200).json({
            success: true,
            message: "Brand deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};
