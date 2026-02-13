import BaseHelper from "../utils/BaseHelper.js";
import { ParentOrder } from "../models/parentOrder.model.js";
import { SellerOrder } from "../models/sellerOrder.model.js";

class OrderHelper {
    constructor() {
        this.parentOrderRepo = new BaseHelper(ParentOrder);
        this.sellerOrderRepo = new BaseHelper(SellerOrder);
    }

    async createParentOrder(data) {
        return await this.parentOrderRepo.addObject(data);
    }

    async createSellerOrders(data) {
        return await this.sellerOrderRepo.insertMany(data);
    }

    async getParentOrderById(id, populatedQuery = null) {
        return await this.parentOrderRepo.getObjectById({ id, populatedQuery });
    }

    async getSellerOrders(query) {
        return await this.sellerOrderRepo.getAllObjects({ query });
    }

    async getMyParentOrders(userId) {
        return await this.parentOrderRepo.getAllObjects({
            query: { userId },
            sortBy: { createdAt: -1 },
            populatedQuery: { path: "sellerOrders" }
        });
    }

    async updateSellerOrder(id, data) {
        return await this.sellerOrderRepo.updateObject(id, data);
    }

    async updateParentOrder(id, data) {
        return await this.parentOrderRepo.updateObject(id, data);
    }
    async deleteParentOrder(id) {
        return await this.parentOrderRepo.deleteObjectById(id);
    }

}

export default new OrderHelper();
