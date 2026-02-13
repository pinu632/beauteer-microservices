import express from 'express';
import {
    createCategory,
    bulkCreateCategories,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} from '../controllers/category.controller.js';

const router = express.Router();

router.route('/bulk').post(bulkCreateCategories);

router.route('/')
    .post(createCategory)
    .get(getAllCategories);

router.route('/:id')
    .get(getCategoryById)
    .patch(updateCategory)
    .delete(deleteCategory);

export default router;
