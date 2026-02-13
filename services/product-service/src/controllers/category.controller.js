import { Category } from '../models/category.model.js';
import BaseHelper from '../utils/BaseHelper.js';

const categoryHelper = new BaseHelper(Category);

export const createCategory = async (req, res, next) => {
    try {
        const category = await categoryHelper.addObject(req.body);
        res.status(201).json({
            success: true,
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

export const bulkCreateCategories = async (req, res, next) => {
    try {
        const categories = await categoryHelper.insertMany(req.body);
        res.status(201).json({
            success: true,
            data: categories
        });
    } catch (error) {
        next(error);
    }
};

export const getAllCategories = async (req, res, next) => {
    try {
        const categories = await categoryHelper.getAllObjects(req.query);
        const count = await categoryHelper.getAllObjectCount({ query: req.query });

        res.status(200).json({
            success: true,
            count,
            data: categories
        });
    } catch (error) {
        next(error);
    }
};

export const getCategoryById = async (req, res, next) => {
    try {
        const category = await categoryHelper.getObjectById({ id: req.params.id });
        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        next(error);
    }
};

export const updateCategory = async (req, res, next) => {
    try {
        const category = await categoryHelper.updateObject(req.params.id, req.body);
        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: category
        });
    } catch (error) {
        next(error);
    }
};

export const deleteCategory = async (req, res, next) => {
    try {
        await categoryHelper.deleteObjectById(req.params.id);
        res.status(200).json({
            success: true,
            message: "Category deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};
