
// import { PRODUCT_UPDATED, PRODUCT_DELETED } from "../constants/eventConstant.js";
// import { handleProductUpdated } from "./handlerfunctions.js";

export function handleCartQueue(msg) {
    try {
        const content = JSON.parse(msg.content.toString());
        const { event, data } = content;

        console.log(`Received event: ${event}`, data);

        switch (event) {
            // case PRODUCT_UPDATED:
            //     handleProductUpdated(data);
            //     break;
            default:
                console.log(`Unknown event: ${event}`);
        }
    } catch (error) {
        console.error("Error handling cart queue message:", error);
    }
}
