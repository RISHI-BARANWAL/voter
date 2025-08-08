import express from 'express';
import { LevelProgram, User, Voter, Task, AuditLog } from '../models/index.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get all level programs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { level, area } = req.query;
    const query = {};
    
    if (level) query.level = level;
    if (area) query.area = area;

    const programs = await LevelProgram.find(query)
      .populate('supervisor', 'full_name role')
      .populate('karyakartas', 'full_name role')
      .populate('supporters', 'full_name political_preference')
      .populate('tasks', 'title status priority')
      .sort({ createdAt: -1 });

    res.json(programs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create level program
router.post('/', authenticateToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
  try {
    const program = await LevelProgram.create(req.body);

    // Log audit
    await AuditLog.create({
      user_id: req.user._id,
      action: 'CREATE_LEVEL_PROGRAM',
      table_name: 'levelprograms',
      record_id: program._id.toString()
    });

    res.status(201).json({
      message: 'Level program created successfully',
      programId: program._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update level program
router.put('/:id', authenticateToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const program = await LevelProgram.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!program) {
      return res.status(404).json({ message: 'Level program not found' });
    }

    // Log audit
    await AuditLog.create({
      user_id: req.user._id,
      action: 'UPDATE_LEVEL_PROGRAM',
      table_name: 'levelprograms',
      record_id: id
    });

    res.json({ message: 'Level program updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get area summary
router.get('/area-summary/:area', authenticateToken, async (req, res) => {
  try {
    const { area } = req.params;

    const [
      supervisors,
      karyakartas,
      supporters,
      partyStrength
    ] = await Promise.all([
      User.find({ role: 'Supervisor', booth_access: area }),
      User.find({ role: 'Karyakarta', booth_access: area }),
      Voter.find({ ward_area: area, is_dead: false }),
      Voter.aggregate([
        { $match: { ward_area: area, is_dead: false } },
        { $group: { _id: '$political_preference', count: { $sum: 1 } } }
      ])
    ]);

    const strengthMap = {};
    partyStrength.forEach(item => {
      strengthMap[item._id?.toLowerCase() || 'neutral'] = item.count;
    });

    res.json({
      area,
      supervisors,
      karyakartas,
      supporters,
      party_strength: {
        bjp: strengthMap.bjp || 0,
        congress: strengthMap.congress || 0,
        // aap: strengthMap.aap || 0,
        neutral: strengthMap.neutral || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;