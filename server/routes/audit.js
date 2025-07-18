import express from 'express';
import { getDatabase } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get audit logs
router.get('/', authenticateToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      action, 
      user_id, 
      start_date, 
      end_date 
    } = req.query;
    
    const db = getDatabase();
    const offset = (page - 1) * limit;

    let query = `
      SELECT a.*, u.full_name as user_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (action) {
      query += ' AND a.action = ?';
      params.push(action);
    }

    if (user_id) {
      query += ' AND a.user_id = ?';
      params.push(user_id);
    }

    if (start_date) {
      query += ' AND DATE(a.created_at) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND DATE(a.created_at) <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const logs = await db.all(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1';
    const countParams = params.slice(0, -2); // Remove limit and offset

    if (action) countQuery += ' AND action = ?';
    if (user_id) countQuery += ' AND user_id = ?';
    if (start_date) countQuery += ' AND DATE(created_at) >= ?';
    if (end_date) countQuery += ' AND DATE(created_at) <= ?';

    const { total } = await db.get(countQuery, countParams);

    res.json({
      logs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;