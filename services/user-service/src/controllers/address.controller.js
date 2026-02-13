import Address from "../models/address.model.js";
import AppError from "../handlers/AppError.js";
import BaseHelper from "../utils/BaseHelper.js";

const addressHelper = new BaseHelper(Address);

export const addAddress = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const addressData = { ...req.body, userId };

        const address = await addressHelper.addObject(addressData);

        res.status(201).json({
            success: true,
            message: "Address added successfully",
            address
        });
    } catch (error) {
        next(error);
    }
};

export const getAllAddresses = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const addresses = await addressHelper.getAllObjects({ query: { userId } });

        res.status(200).json({
            success: true,
            addresses
        });
    } catch (error) {
        next(error);
    }
};

export const getAddressById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const address = await addressHelper.getObjectById({ id });

        // if (address.userId.toString() !== req.user._id.toString()) {
        //     return next(new AppError("Unauthorized access to address", 403));
        // }

        res.status(200).json({
            success: true,
            address
        });
    } catch (error) {
        next(error);
    }
};

export const updateAddress = async (req, res, next) => {
    try {
        const { id } = req.params;
        let address = await Address.findById(id);

        if (!address) {
            return next(new AppError("Address not found", 404));
        }

        if (address.userId.toString() !== req.user._id.toString()) {
            return next(new AppError("Unauthorized to update this address", 403));
        }

        const updatedAddress = await addressHelper.updateObject(id, req.body);

        res.status(200).json({
            success: true,
            message: "Address updated successfully",
            address: updatedAddress
        });
    } catch (error) {
        next(error);
    }
};

export const deleteAddress = async (req, res, next) => {
    try {
        const { id } = req.params;
        const address = await Address.findById(id);

        if (!address) {
            return next(new AppError("Address not found", 404));
        }

        if (address.userId.toString() !== req.user._id.toString()) {
            return next(new AppError("Unauthorized to delete this address", 403));
        }

        await addressHelper.deleteObjectById(id);

        res.status(200).json({
            success: true,
            message: "Address deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};
