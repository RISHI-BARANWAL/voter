import express from "express";  ///....new added
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

    // const result = await db.run(
    //   `
    //   INSERT INTO sms_logs (message, recipients, sent_by, success_count,
    //                        failure_count, total_count, type)
    //   VALUES (?, ?, ?, ?, ?, ?, ?)
    // `,
    //   [
    //     message,
    //     JSON.stringify(recipients),
    //     req.user.id,
    //     successCount,
    //     failureCount,
    //     recipients.length,
    //     type,
    //   ]
    // );
    const result = await db.collection('smslogs').insertOne({   //....new added
      message,
      recipients,
      sent_by: req.user.id,
      success_count: successCount,
      failure_count: failureCount,
      total_count: recipients.length,
      type,
      timestamp: new Date() // Optional, good for tracking when it was logged
    });   //....new added


    // Log audit
    // await db.run(
    //   `
    //   INSERT INTO audit_logs (user_id, action, table_name, record_id)
    //   VALUES (?, ?, ?, ?)
    // `,
    //   [req.user.id, "SEND_SMS", "sms_logs", result.lastID]
    // );
    await db.collection('auditlogs').insertOne({  //....new added
      user_id: req.user.id,
      action: "SEND_SMS",
      table_name: "smslogs",
      record_id: result.insertedId, // MongoDB uses insertedId instead of lastID
      timestamp: new Date() // optional but good for tracking
    });   //....new added

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

    // const logs = await db.all(
    //   `
    //   SELECT s.*, u.full_name as sent_by_name
    //   FROM sms_logs s
    //   LEFT JOIN users u ON s.sent_by = u.id
    //   ORDER BY s.sent_at DESC
    //   LIMIT ? OFFSET ?
    // `,
    //   [limit, offset]
    // );
    const logs = await db.collection('sms_logs')  //....new added
      .aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'sent_by',
            foreignField: '_id', // assuming sent_by stores ObjectId
            as: 'sent_by_user'
          }
        },
        { $unwind: { path: "$sent_by_user", preserveNullAndEmptyArrays: true } },
        { $sort: { sent_at: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            message: 1,
            recipients: 1,
            sent_by: 1,
            success_count: 1,
            failure_count: 1,
            total_count: 1,
            type: 1,
            sent_at: 1,
            sent_by_name: "$sent_by_user.full_name"
          }
        }
      ])
      .toArray();  //....new added

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get SMS statistics
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();

    // const stats = await db.get(`
    //   SELECT 
    //     COUNT(*) as total_campaigns,
    //     SUM(total_count) as total_sent,
    //     SUM(success_count) as total_success,
    //     SUM(failure_count) as total_failure
    //   FROM sms_logs
    // `);
    const statsAggregation = await db.collection('smslogs').aggregate([  //....new added
    {
      $group: {
        _id: null,
        total_campaigns: { $sum: 1 },
        total_sent: { $sum: "$total_count" },
        total_success: { $sum: "$success_count" },
        total_failure: { $sum: "$failure_count" }
      }
    },
    {
      $project: {
        _id: 0,
        total_campaigns: 1,
        total_sent: 1,
        total_success: 1,
        total_failure: 1
      }
    }
  ]).toArray();

  const stats = statsAggregation[0] || {
    total_campaigns: 0,
    total_sent: 0,
    total_success: 0,
    total_failure: 0
  };  //....new added

    // const todayStats = await db.get(`
    //   SELECT 
    //     COUNT(*) as today_campaigns,
    //     SUM(total_count) as today_sent
    //   FROM sms_logs
    //   WHERE DATE(sent_at) = DATE('now')
    // `);
    const startOfToday = new Date();  //....new added
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayStatsAggregation = await db.collection('smslogs').aggregate([
      {
        $match: {
          sent_at: {
            $gte: startOfToday,
            $lte: endOfToday
          }
        }
      },
      {
        $group: {
          _id: null,
          today_campaigns: { $sum: 1 },
          today_sent: { $sum: "$total_count" }
        }
      },
      {
        $project: {
          _id: 0,
          today_campaigns: 1,
          today_sent: 1
        }
      }
    ]).toArray();

    const todayStats = todayStatsAggregation[0] || {
      today_campaigns: 0,
      today_sent: 0
    };  //....new added

    res.json({ ...stats, ...todayStats });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
