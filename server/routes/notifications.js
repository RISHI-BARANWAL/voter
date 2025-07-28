import express from "express";
import Notification from "../models/notification.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";
import mongoose from "mongoose";

const router = express.Router();

// Send notification to selected users
router.post(
  "/send",
  authenticateToken,
  authorizeRoles("Super Admin", "Supervisor", "Karyakarta", "Admin"),   ///....new added
  async (req, res) => {
    try {
      const { message, recipients, type = "manual" } = req.body;

      if (!message || !recipients?.length) {
        return res
          .status(400)
          .json({ message: "Message and recipients are required" });
      }

      const notification = new Notification({
        message,
        recipients,
        type,
        createdBy: req.user._id,
      });

      await notification.save();

      res
        .status(201)
        .json({ message: "Notification sent successfully", notification });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// Mark notification as read
router.post("/read/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await Notification.findByIdAndUpdate(id, {
      $addToSet: { readBy: req.user._id },
    });

    res.json({ message: "Notification marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get notifications for current user
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipients: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get notification logs (admin)
router.get(
  "/logs",
  authenticateToken,
  authorizeRoles("Super Admin", "Supervisor", "Karyakarta", "Admin"),   ///....new added
  async (req, res) => {
    try {
      const notifications = await Notification.find({
        createdBy: req.user._id,
      })
        .sort({ createdAt: -1 })
        .limit(50);

      res.json(notifications);
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// Get notification stats (admin)
router.get(
  "/stats",
  authenticateToken,
  authorizeRoles("Super Admin", "Supervisor", "Karyakarta", "Admin"),   ///....new added
  async (req, res) => {
    try {
      const totalNotifications = await Notification.countDocuments({
        createdBy: req.user._id,
      });

      const totalRead = await Notification.aggregate([
        { $match: { createdBy: req.user._id } },
        { $unwind: "$readBy" },
        { $count: "count" },
      ]);

      const unreadNotifications = await Notification.countDocuments({
        createdBy: req.user._id,
        $expr: { $lt: [{ $size: "$readBy" }, 1] },
      });

      res.json({
        total_notifications: totalNotifications,
        total_reads: totalRead[0]?.count || 0,
        unread_notifications: unreadNotifications,
      });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

export default router;
