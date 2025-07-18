import express from 'express';
import { getDatabase } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const settings = await db.all('SELECT * FROM settings');
    
    const settingsObject = {};
    settings.forEach(setting => {
      settingsObject[setting.key] = setting.value;
    });

    res.json(settingsObject);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update settings
router.put('/', authenticateToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
  try {
    const db = getDatabase();
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      await db.run(`
        INSERT OR REPLACE INTO settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `, [key, value]);
    }

    // Log audit
    await db.run(`
      INSERT INTO audit_logs (user_id, action)
      VALUES (?, ?)
    `, [req.user.id, 'UPDATE_SETTINGS']);

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;