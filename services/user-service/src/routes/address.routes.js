import express from 'express';
import {
    addAddress,
    getAllAddresses,
    getAddressById,
    updateAddress,
    deleteAddress
} from '../controllers/address.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(isAuthenticated);

router.route('/')
    .post(addAddress)
    .get(getAllAddresses);

router.route('/:id')
    .get(getAddressById)
    .put(updateAddress)
    .delete(deleteAddress);

export default router;
