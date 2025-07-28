// import express from 'express';
// import { getDatabase } from '../config/database.js';
// import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
// import fs from 'fs';
// import path from 'path';

// const router = express.Router();

// // Create backup
// router.post('/create', authenticateToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
//   try {
//     const db = getDatabase();
//     const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
//     const backupPath = `./backups/backup-${timestamp}.sql`;

//     // Ensure backup directory exists
//     if (!fs.existsSync('./backups')) {
//       fs.mkdirSync('./backups', { recursive: true });
//     }

//     // Simple backup by copying database file
//     fs.copyFileSync('./database.sqlite', `./backups/database-${timestamp}.sqlite`);

//     // Log audit
//     await db.run(`
//       INSERT INTO audit_logs (user_id, action)
//       VALUES (?, ?)
//     `, [req.user.id, 'CREATE_BACKUP']);

//     res.json({
//       message: 'Backup created successfully',
//       filename: `database-${timestamp}.sqlite`
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// // List backups
// router.get('/list', authenticateToken, authorizeRoles('Super Admin', 'Admin'), (req, res) => {
//   try {
//     if (!fs.existsSync('./backups')) {
//       return res.json([]);
//     }

//     const files = fs.readdirSync('./backups')
//       .filter(file => file.endsWith('.sqlite'))
//       .map(file => {
//         const stats = fs.statSync(path.join('./backups', file));
//         return {
//           filename: file,
//           size: stats.size,
//           created: stats.birthtime
//         };
//       })
//       .sort((a, b) => b.created - a.created);

//     res.json(files);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// export default router;
















import express from 'express';  ///....new added
import { getDatabase } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const router = express.Router();

// Create MongoDB backup using mongodump
router.post('/create', authenticateToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
  try {
    const db = getDatabase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `./backups/mongo-backup-${timestamp}`;

    // Ensure backup directory exists
    if (!fs.existsSync('./backups')) {
      fs.mkdirSync('./backups', { recursive: true });
    }

    // Run mongodump command
    const dumpCommand = `mongodump --uri="${process.env.MONGODB_URI}" --out="${backupDir}"`;

    exec(dumpCommand, async (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ message: 'Backup failed', error: stderr || error.message });
      }

      // Log audit
      await db.collection('auditlogs').insertOne({
        user_id: req.user.id,
        action: 'CREATE_BACKUP',
        timestamp: new Date()
      });

      res.json({
        message: 'Backup created successfully',
        folder: `mongo-backup-${timestamp}`
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// List backup folders
router.get('/list', authenticateToken, authorizeRoles('Super Admin', 'Admin'), (req, res) => {
  try {
    if (!fs.existsSync('./backups')) {
      return res.json([]);
    }

    const items = fs.readdirSync('./backups')
      .filter(folder => folder.startsWith('mongo-backup-'))
      .map(folder => {
        const stats = fs.statSync(path.join('./backups', folder));
        return {
          folder,
          size: getFolderSizeSync(path.join('./backups', folder)),
          created: stats.birthtime
        };
      })
      .sort((a, b) => b.created - a.created);

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper: Get folder size in bytes
function getFolderSizeSync(folderPath) {
  const files = fs.readdirSync(folderPath);
  return files.reduce((total, file) => {
    const stats = fs.statSync(path.join(folderPath, file));
    return total + (stats.isFile() ? stats.size : getFolderSizeSync(path.join(folderPath, file)));
  }, 0);
}

export default router;
