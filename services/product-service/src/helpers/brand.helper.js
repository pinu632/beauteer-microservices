import BaseHelper from "../utils/BaseHelper.js";
import { Brand } from "../models/brand.model.js";

class BrandHelper extends BaseHelper {
    constructor() {
        super(Brand);
    }
}

export default new BrandHelper();
