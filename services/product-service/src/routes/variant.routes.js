import express from 'express';
import {
    createVariant,
    getAllVariants,
    getVariantById,
    updateVariant,
    deleteVariant
} from '../controllers/variant.controller.js';

const router = express.Router();

router.route('/')
    .post(createVariant)
    .get(getAllVariants);

router.route('/:id')
    .get(getVariantById)
    .patch(updateVariant)
    .delete(deleteVariant);

export default router;
