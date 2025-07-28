import express from 'express';
import { getDatabase } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Get settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    // const settings = await db.all('SELECT * FROM settings');   ///....new added.  db of SQLite was used previously.
    const settings = await db.collection('settings').find({}).toArray();   ///....new added
    
    const settingsObject = {};
    settings.forEach(setting => {
      settingsObject[setting.key] = setting.value;
    });

    res.json(settingsObject);
  } catch (error) {
    console.error('Error fetching settings:', error); //....new added
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update settings
router.put('/', authenticateToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
  try {
    const db = getDatabase();
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      // await db.run(`
      //   INSERT OR REPLACE INTO settings (key, value, updated_at)
      //   VALUES (?, ?, CURRENT_TIMESTAMP)
      // `, [key, value]);
      await db.collection('settings').updateOne( { key }, { $set: { key, value, updated_at: new Date() } }, { upsert: true } );   //....new added
    }

    // Log audit
    // await db.run(`
    //   INSERT INTO audit_logs (user_id, action)
    //   VALUES (?, ?)
    // `, [req.user.id, 'UPDATE_SETTINGS']);
    // Safely convert only if it's a valid ObjectId string
    let userId = req.user.id;
    if (typeof userId === 'string' && ObjectId.isValid(userId)) {
      userId = new ObjectId(userId);
    }
    // const userId = ObjectId.isValid(req.user.id) ? new ObjectId(req.user.id) : req.user.id;
    await db.collection('auditlogs').insertOne({  //....new added
      user_id: userId,  //....new added  or req.user.id,
      action: 'UPDATE_SETTINGS',
      timestamp: new Date()
    });   //....new added

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error); //....new added
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;