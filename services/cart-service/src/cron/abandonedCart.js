import cron from 'node-cron';
import Cart from '../models/cart.model.js';
import { publishToQueue } from '../workers/publish.js';

// Run every hour
export const startCronJobs = () => {
    console.log('⏳ Starting Cart Cron Jobs...');

    // Check for carts abandoned for 1 hour
    cron.schedule('0 * * * *', async () => {
        try {
            console.log('Running CART_ABANDONED_1H check...');
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000); // To avoid re-sending deeply abandoned ones constantly if we don't mark them

            // Find carts updated between 1 and 2 hours ago
            const carts = await Cart.find({
                updatedAt: { $lt: oneHourAgo, $gt: twoHoursAgo },
                items: { $not: { $size: 0 } } // Not empty
            });

            for (const cart of carts) {
                await publishToQueue({
                    queue_name: 'notification_queue',
                    event_name: 'CART_ABANDONED_1H',
                    data: {
                        userId: cart.userId,
                        cartId: cart._id,
                        itemCount: cart.items.length,
                        totalPrice: cart.totalPrice
                    }
                });
            }
            console.log(`Checked abandoned carts 1H: Found ${carts.length}`);
        } catch (error) {
            console.error('Error in CART_ABANDONED_1H cron:', error);
        }
    });

    // Check for carts abandoned for 24 hours
    cron.schedule('0 0 * * *', async () => { // Once a day? Or every hour checking 24h mark? Let's do every hour checking 24-25h window
        try {
            console.log('Running CART_ABANDONED_24H check...');
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);

            const carts = await Cart.find({
                updatedAt: { $lt: twentyFourHoursAgo, $gt: twentyFiveHoursAgo },
                items: { $not: { $size: 0 } }
            });

            for (const cart of carts) {
                await publishToQueue({
                    queue_name: 'notification_queue',
                    event_name: 'CART_ABANDONED_24H',
                    data: {
                        userId: cart.userId,
                        cartId: cart._id,
                        itemCount: cart.items.length,
                        totalPrice: cart.totalPrice
                    }
                });
            }
            console.log(`Checked abandoned carts 24H: Found ${carts.length}`);
        } catch (error) {
            console.error('Error in CART_ABANDONED_24H cron:', error);
        }
    });
};
