import express from 'express';
import {
    createBrand,
    bulkCreateBrands,
    getAllBrands,
    getBrandById,
    updateBrand,
    deleteBrand
} from '../controllers/brand.controller.js';

const router = express.Router();

router.route('/bulk').post(bulkCreateBrands);

router.route('/')
    .post(createBrand)
    .get(getAllBrands);

router.route('/:id')
    .get(getBrandById)
    .patch(updateBrand)
    .delete(deleteBrand);

export default router;
