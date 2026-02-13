import Notification from "../models/Notification.js";
import AppError from "../utils/AppError.js"; // Assuming AppError exists or I'll create a simple one logic

export const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id; // Assumes middleware populates req.user
        const { page = 1, limit = 20, status } = req.query;

        const query = { userId };
        if (status) query.status = status;

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({ userId, status: "UNREAD" });

        res.status(200).json({
            status: "success",
            data: {
                notifications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                },
                unreadCount
            }
        });
    } catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const markAsRead = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId },
            { status: "READ" },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.status(200).json({
            status: "success",
            data: { notification }
        });
    } catch (error) {
        console.error("Mark Read Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.user.id;

        await Notification.updateMany(
            { userId, status: "UNREAD" },
            { status: "READ" }
        );

        res.status(200).json({
            status: "success",
            message: "All notifications marked as read"
        });
    } catch (error) {
        console.error("Mark All Read Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const deleteNotification = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const notification = await Notification.findOneAndDelete({ _id: id, userId });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.status(204).send(); // No content
    } catch (error) {
        console.error("Delete Notification Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
