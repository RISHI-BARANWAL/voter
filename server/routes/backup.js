import express from 'express';
import { getDatabase } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Create backup
router.post('/create', authenticateToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
  try {
    const db = getDatabase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `./backups/backup-${timestamp}.sql`;

    // Ensure backup directory exists
    if (!fs.existsSync('./backups')) {
      fs.mkdirSync('./backups', { recursive: true });
    }

    // Simple backup by copying database file
    fs.copyFileSync('./database.sqlite', `./backups/database-${timestamp}.sqlite`);

    // Log audit
    await db.run(`
      INSERT INTO audit_logs (user_id, action)
      VALUES (?, ?)
    `, [req.user.id, 'CREATE_BACKUP']);

    res.json({
      message: 'Backup created successfully',
      filename: `database-${timestamp}.sqlite`
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// List backups
router.get('/list', authenticateToken, authorizeRoles('Super Admin', 'Admin'), (req, res) => {
  try {
    if (!fs.existsSync('./backups')) {
      return res.json([]);
    }

    const files = fs.readdirSync('./backups')
      .filter(file => file.endsWith('.sqlite'))
      .map(file => {
        const stats = fs.statSync(path.join('./backups', file));
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime
        };
      })
      .sort((a, b) => b.created - a.created);

    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;