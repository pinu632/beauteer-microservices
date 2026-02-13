import BaseHelper from "../utils/BaseHelper.js";
import { Category } from "../models/category.model.js";

class CategoryHelper extends BaseHelper {
    constructor() {
        super(Category);
    }
}

export default new CategoryHelper();
