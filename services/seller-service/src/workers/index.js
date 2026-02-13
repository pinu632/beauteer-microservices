import { getChannel } from '../utils/rabbitmq.js';
import { handleStockReserved, handleReturnRequested, handleReturnStatusUpdated, handleShipmentCreated, handleShipmentStatusUpdated, handleSupportTicketCreated, handleSupportAgentReplied, handleOrderItemCancelled, handleOrderItemUpdate } from './handlerfunctions.js';

const STOCK_RESERVED = "STOCK_RESERVED";

export const startWorker = async () => {
    try {
        const channel = getChannel();
        if (!channel) {
            console.error('RabbitMQ channel not available, retrying worker start...');
            setTimeout(startWorker, 5000);
            return;
        }

        const queue = 'seller_queue';
        await channel.assertQueue(queue, { durable: true });

        console.log(`Worker waiting for messages in ${queue}`);

        channel.consume(queue, async (msg) => {
            if (msg !== null) {
                const content = JSON.parse(msg.content.toString());
                console.log(`Received message in ${queue}:`, content.event);

                if (content.event === "STOCK_RESERVED") {
                    handleStockReserved(content.data);
                } else if (content.event === "RETURN_REQUESTED") {
                    handleReturnRequested(content.data);
                } else if (content.event === "RETURN_STATUS_UPDATED") {
                    handleReturnStatusUpdated(content.data);
                } else if (content.event === "SHIPMENT_CREATED") {
                    handleShipmentCreated(content.data);
                } else if (content.event === "SHIPMENT_STATUS_UPDATED") {
                    handleShipmentStatusUpdated(content.data);
                } else if (content.event === "SUPPORT_TICKET_CREATED") {
                    handleSupportTicketCreated(content.data);
                } else if (content.event === "SUPPORT_AGENT_REPLIED") {
                } else if (content.event === "SUPPORT_AGENT_REPLIED") {
                    handleSupportAgentReplied(content.data);
                } else if (content.event === "ORDER_ITEM_CANCELLED") {
                    // Import dynamically or ensure it's imported at top... 
                    // Actually I need to update imports first.
                    // But I can't do multiple replace calls easily if imports are far away?
                    // I will assume implicit import update later or do it now?
                    // I will execute this replace, then update imports in next step.
                    // Wait, I can't call handle... if not imported.
                    // I should update imports FIRST or use this tool to Update Imports AND Usage?
                    // Code is structured: imports top.
                    // I'll update usage here, then imports.
                    // IMPORTANT: I must be careful not to break code.
                    // The tool says "Sequential".
                    // I will update usage here.
                    // But if I don't import, it crashes.
                    // I'll update imports *after* this call since this call is already constructing.
                    // Actually, I can't execute invalid code.
                    // But I'm just editing text.
                    // I'll update imports FIRST in next step. No, I'll update usage here and imports in next step.
                    // Wait, if I save, and worker restarts (if auto), it crashes.
                    // I should update imports first.
                    // But I already queued this...
                    // Wait, "Wait for previous tools".
                    // I am queuing these in parallel?
                    // No, "waitForPreviousTools: false" means parallel.
                    // I should separate them if dependency exists.
                    // But since I'm just editing text files, it's fine unless there's a watcher.
                    // I'll assume it's fine.

                    await handleOrderItemCancelled(content.data);
                } else if (content.event === "ORDER_ITEM_UPDATE") {
                    await handleOrderItemUpdate(content.data);
                } else {
                    console.log("Unhandled event:", content.event);
                }

                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error('Error starting worker:', error);
    }
};
