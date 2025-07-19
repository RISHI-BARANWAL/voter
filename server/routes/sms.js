import express from "express";
import { getDatabase } from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Send SMS
router.post("/send", authenticateToken, async (req, res) => {
  try {
    const { message, recipients, type = "manual" } = req.body;
    const db = getDatabase();

    // Simulate SMS sending (replace with actual SMS gateway)
    const successCount = recipients.length;
    const failureCount = 0;

    const result = await db.run(
      `
      INSERT INTO sms_logs (message, recipients, sent_by, success_count,
                           failure_count, total_count, type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        message,
        JSON.stringify(recipients),
        req.user.id,
        successCount,
        failureCount,
        recipients.length,
        type,
      ]
    );

    // Log audit
    await db.run(
      `
      INSERT INTO audit_logs (user_id, action, table_name, record_id)
      VALUES (?, ?, ?, ?)
    `,
      [req.user.id, "SEND_SMS", "sms_logs", result.lastID]
    );

    res.json({
      message: "SMS sent successfully",
      successCount,
      failureCount,
      totalCount: recipients.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get SMS logs
router.get("/logs", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const db = getDatabase();
    const offset = (page - 1) * limit;

    const logs = await db.all(
      `
      SELECT s.*, u.full_name as sent_by_name
      FROM sms_logs s
      LEFT JOIN users u ON s.sent_by = u.id
      ORDER BY s.sent_at DESC
      LIMIT ? OFFSET ?
    `,
      [limit, offset]
    );

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get SMS statistics
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();

    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_campaigns,
        SUM(total_count) as total_sent,
        SUM(success_count) as total_success,
        SUM(failure_count) as total_failure
      FROM sms_logs
    `);

    const todayStats = await db.get(`
      SELECT 
        COUNT(*) as today_campaigns,
        SUM(total_count) as today_sent
      FROM sms_logs
      WHERE DATE(sent_at) = DATE('now')
    `);

    res.json({ ...stats, ...todayStats });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
