import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Firebase Admin SDK
// You should verify that the service account environment variable is set
if (!admin.apps.length) {
    try {
        // Option 1: Using a service account file
        // const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS); 

        // Option 2: Using environment variables mapped to a config object (Better for Docker/K8s)
        // const serviceAccount = {
        //   type: "service_account",
        //   project_id: process.env.FIREBASE_PROJECT_ID,
        //   private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        //   private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        //   client_email: process.env.FIREBASE_CLIENT_EMAIL,
        //   client_id: process.env.FIREBASE_CLIENT_ID,
        //   auth_uri: "https://accounts.google.com/o/oauth2/auth",
        //   token_uri: "https://oauth2.googleapis.com/token",
        //   auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        //   client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
        // };

        // Placeholder initialization for boilerplate purposes
        // In production, replace with actual credential loading logic
        // admin.initializeApp({
        //   credential: admin.credential.cert(serviceAccount)
        // });

        // For now, if no coords provided, we mock it or warn
        if (process.env.FIREBASE_PROJECT_ID) {
            admin.initializeApp({
                credential: admin.credential.applicationDefault(), // Fallback to GOOGLE_APPLICATION_CREDENTIALS env var
            });
            console.log("🔥 Firebase Admin Initialized");
        } else {
            console.warn("⚠️ Firebase Admin NOT initialized. Missing env vars.");
        }

    } catch (error) {
        console.error("Firebase admin initialization error", error);
    }
}

/**
 * Send a multicast message to multiple devices
 * @param {string[]} tokens - Array of FCM registration tokens
 * @param {object} notification - { title, body, imageUrl }
 * @param {object} data - Additional data payload
 */
export const sendMulticastNotification = async (tokens, notification, data = {}) => {
    if (!tokens || tokens.length === 0) return { failureCount: 0, successCount: 0 };
    if (!admin.apps.length) {
        console.warn("Cannot send FCM: Firebase not initialized");
        return { failureCount: tokens.length, successCount: 0 };
    }

    try {
        const message = {
            notification: {
                title: notification.title,
                body: notification.body,
                ...(notification.imageUrl && { imageUrl: notification.imageUrl })
            },
            data: data, // data must be string values
            tokens: tokens
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`FCM Sent: ${response.successCount} success, ${response.failureCount} failed`);

        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                    console.error(`FCM error for token ${tokens[idx]}:`, resp.error);
                }
            });
            // TODO: cleanup invalid tokens
        }

        return response;
    } catch (error) {
        console.error("Error sending multicast notification:", error);
        throw error;
    }
};

/**
 * Send a message to a single device
 * @param {string} token 
 * @param {object} notification 
 * @param {object} data 
 */
export const sendSingleNotification = async (token, notification, data = {}) => {
    if (!token) return;
    if (!admin.apps.length) {
        console.warn("Cannot send FCM: Firebase not initialized");
        return;
    }

    try {
        const message = {
            notification: {
                title: notification.title,
                body: notification.body,
                ...(notification.imageUrl && { imageUrl: notification.imageUrl })
            },
            data: data,
            token: token
        };

        const response = await admin.messaging().send(message);
        console.log("Successfully sent message:", response);
        return response;
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};

export default admin;
