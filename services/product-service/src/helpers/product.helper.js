import BaseHelper from "../utils/BaseHelper.js";
import { Product } from "../models/product.model.js";

class ProductHelper extends BaseHelper {
    constructor() {
        super(Product);
    }
}

export default new ProductHelper();
