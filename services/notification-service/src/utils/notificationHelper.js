
import Notification from "../models/Notification.js";
import { NotificationDelivery } from "../models/NotificationDelivery.js";
import { sendSingleNotification } from "../utils/firebase.js";
import { NOTIFICATION_CATEGORIES } from "../constants/events.js";
import mongoose from "mongoose";

// Mock User model import or direct DB access
// Since this is a microservice, we should ideally fetch user details from User Service or have a local replica/cache.
// However, for `deviceToken` to send Push, we need it.
// We can either:
// 1. Expect `deviceToken` in the event payload (Best for decoupled services)
// 2. Query User Service (Adds latency)
// 3. Query local DB if we share it (Not recommended but possible if monolithic DB)
// 
// Given the prompt "use these models", and `userId` in Notification, 
// I'll assume for now we might get `deviceToken` in the event data OR we need to fetch it.
// 
// Let's assume we might need to fetch the user to get the device token if not provided.
// Since we don't have direct access to User model in this service (it is in user-service), 
// WE SHOULD PROBABLY ADD `deviceToken` to the event payload from the publisher side (e.g. Order Service), 
// OR we make an API call to User Service.
// 
// For simplicity and speed in this task, I will implement a fetch to User Service or direct DB query if they share DB (they seem to share cluster based on .env, but usually different DBs).
// Wait, looking at .env, they might be using different DBs.
// 
// Strategy: 
// 1. Try to get deviceToken from event data.
// 2. If not, try to fetch from User Service (TODO).
// 
// For this boilerplate, I'll assume it's passed or we just log that we cant send push without it.

export const createAndSendNotification = async ({
    userId,
    eventKey,
    category = NOTIFICATION_CATEGORIES.SYSTEM,
    title,
    body,
    imageUrl,
    actionType = "NONE",
    actionValue,
    entityType,
    entityId,
    metadata,
    deviceToken // Optional, if passed in event
}) => {
    try {
        // 1. Create Notification Record
        const notification = await Notification.create({
            userId,
            eventKey,
            category,
            title,
            body,
            imageUrl,
            action: {
                type: actionType,
                value: actionValue
            },
            entity: {
                entityType,
                entityId
            },
            metadata
        });

        console.log(`Notification created: ${notification._id} for ${eventKey}`);

        // 2. Send Push Notification (If device token exists)
        // If not provided in args, we might want to fetch it. 
        // For now, let's assume if it's not here, we can't push.

        // Check if we need to fetch token (if not provided)
        let token = deviceToken;

        /*
        if (!token) {
            // Fetch from User Service
            // const user = await axios.get(`http://user-service/api/users/${userId}`);
            // token = user.data.deviceToken;
        }
        */

        if (token) {
            try {
                const response = await sendSingleNotification(token, {
                    title,
                    body,
                    imageUrl
                }, {
                    notificationId: notification._id.toString(),
                    actionType,
                    actionValue: actionValue || ""
                });

                // 3. Log Delivery
                await NotificationDelivery.create({
                    notificationId: notification._id,
                    userId,
                    channel: "PUSH",
                    provider: "FCM",
                    deviceToken: token,
                    status: "SENT", // firebase-admin doesn't give callback, so status is SENT
                    sentAt: new Date(),
                    deliveredAt: new Date() // approximate
                });
            } catch (sendError) {
                console.error("FCM Send Error:", sendError);
                await NotificationDelivery.create({
                    notificationId: notification._id,
                    userId,
                    channel: "PUSH",
                    provider: "FCM",
                    deviceToken: token,
                    status: "FAILED",
                    error: sendError.message,
                    attempts: 1
                });
            }
        } else {
            console.log(`Skipping Push for ${userId}: No device token`);
        }

        return notification;

    } catch (error) {
        console.error("Create Notification Error:", error);
        throw error;
    }
};
