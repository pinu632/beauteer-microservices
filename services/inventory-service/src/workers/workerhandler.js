import { ORDER_CREATED, ORDER_ITEM_CANCELLED } from "../constants/eventConstant.js";
import { handleOrderCreated, handleOrderItemCancelled } from "./handlerfunctions.js";

export const handleInventoryQueue = async (msg) => {
    try {
        const { event, data } = JSON.parse(msg.content.toString());

        switch (event) {
            case ORDER_CREATED:
                await handleOrderCreated(data);
                break;
            case ORDER_ITEM_CANCELLED:
                await handleOrderItemCancelled(data);
                break;
            default:
                console.log(`Unknown event in Inventory Service: ${event}`);
        }
    } catch (error) {
        console.error("Error parsing message in inventory worker:", error);
    }
};
