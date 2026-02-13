import express from 'express';
import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    bulkCreateProducts,
    getRecommendedProducts,
    getProductByQuery,
    getPopularProducts
} from '../controllers/product.controller.js';

const router = express.Router();

router.route('/recommended').get(getRecommendedProducts);
router.route('/popular').get(getPopularProducts);

router.route('/')
    .post(createProduct)
    .get(getProducts);

router.route('/p/list').post(
    getProductByQuery
)

router.route('/:id')
    .get(getProductById)
    .patch(updateProduct)
    .delete(deleteProduct);

router.route('/bulk')
    .post(bulkCreateProducts);

export default router;
