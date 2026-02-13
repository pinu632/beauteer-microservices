
import {
    SELLER_CREATED,
    SELLER_UPDATED,
    SELLER_DELETED,
    INVENTORY_CREATED,
    INVENTORY_UPDATED,
    INVENTORY_DELETED
} from "../constants/eventConstant.js";

import {
    handleSellerCreated,
    handleSellerUpdated,
    handleSellerDeleted,
    handleInventoryCreated,
    handleInventoryUpdated,
    handleInventoryDeleted
} from "./handlerfunctions.js";

export function handleProductQueue(msq) {
    const { event, data } = JSON.parse(msq.content.toString());

    switch (event) {
       
        // Seller Events
        case SELLER_CREATED:
            handleSellerCreated(data);
            break;
        case SELLER_UPDATED:
            handleSellerUpdated(data);
            break;
        case SELLER_DELETED:
            handleSellerDeleted(data);
            break;

        // Inventory Events
        case INVENTORY_CREATED:
            handleInventoryCreated(data);
            break;
        case INVENTORY_UPDATED:
            handleInventoryUpdated(data);
            break;
        case INVENTORY_DELETED:
            handleInventoryDeleted(data);
            break;

        default:
            console.log(`Unknown event: ${event}`);
    }
}
