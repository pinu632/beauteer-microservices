import {
    ORDER_CREATED,
    ORDER_CANCELLED,
    PAYMENT_INITIATED,
    COD_PAYMENT_RECEIVED,
    PROCESS_REFUND,
    ORDER_ITEM_CANCELLED
} from "../constants/eventConstant.js";

import {
    handleOrderCreated,
    handleOrderCancelled,
    handleCODPaymentReceived,
    handleProcessRefund,
    handleOrderItemCancelled
} from "./handlerfunctions.js";

export const handlePaymentQueue = (msg) => {
    const { event, data } = JSON.parse(msg.content.toString());

    switch (event) {
        case ORDER_CREATED:
            handleOrderCreated(data);
            break;
        case ORDER_CANCELLED:
            handleOrderCancelled(data);
            break;
        case PAYMENT_INITIATED:
            // Reusing handleOrderCreated as it contains the payment creation logic
            handleOrderCreated(data);
            break;
        case COD_PAYMENT_RECEIVED:
            handleCODPaymentReceived(data);
            break;
        case PROCESS_REFUND:
            handleProcessRefund(data);
            break;
        case ORDER_ITEM_CANCELLED:
            handleOrderItemCancelled(data);
            break;
        default:
            console.log(`Unknown event: ${event}`);
    }
};
