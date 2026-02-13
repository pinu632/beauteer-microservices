import {
    PAYMENT_SUCCESS,
    PAYMENT_FAILED,
    INVENTORY_UPDATED,
    PAYMENT_INITIATED,
    SELLER_ORDERS_CREATED,
    SHIPMENT_DELIVERED
} from "../constants/eventConstant.js";

import {
    handlePaymentSuccess,
    handlePaymentFailed,
    handleInventoryUpdated,
    handlePaymentInitiated,
    handleSellerOrdersCreated,
    handleShipmentDelivered,
    handleReturnRequested,
    handleReturnStatusUpdated,
    handleShipmentCreated,
    handleShipmentStatusUpdated
} from "./handlerfunctions.js";

export const handleOrderQueue = (msg) => {
    const { event, data } = JSON.parse(msg.content.toString());

    switch (event) {
        case PAYMENT_INITIATED:
            handlePaymentInitiated(data);
            break;
        case PAYMENT_SUCCESS:
            handlePaymentSuccess(data);
            break;
        case INVENTORY_UPDATED:
            handleInventoryUpdated(data);
            break;
        case SELLER_ORDERS_CREATED:
            handleSellerOrdersCreated(data);
            break;
        case SHIPMENT_DELIVERED:
            handleShipmentDelivered(data);
            break;
        case "RETURN_REQUESTED":
            handleReturnRequested(data);
            break;
        case "RETURN_STATUS_UPDATED":
            handleReturnStatusUpdated(data);
            break;
        case "SHIPMENT_CREATED":
            handleShipmentCreated(data);
            break;
        case "SHIPMENT_STATUS_UPDATED":
            handleShipmentStatusUpdated(data);
            break;
        default:
            console.log(`Unknown event: ${event}`);
    }
};
