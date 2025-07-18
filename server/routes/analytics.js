import express from 'express';
import { Voter, User, Task, SmsLog, AuditLog } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Dashboard metrics
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const [
      totalVoters,
      activeVoters,
      activeUsers,
      totalTasks,
      completedTasks,
      inProgressTasks,
      totalSmsSent
    ] = await Promise.all([
      Voter.countDocuments(),
      Voter.countDocuments({ is_dead: false }),
      User.countDocuments({ is_active: true }),
      Task.countDocuments(),
      Task.countDocuments({ status: 'Completed' }),
      Task.countDocuments({ status: 'In Progress' }),
      SmsLog.aggregate([
        { $group: { _id: null, total: { $sum: '$total_count' } } }
      ])
    ]);

    res.json({
      totalVoters,
      activeVoters,
      activeUsers,
      totalTasks,
      completedTasks,
      inProgressTasks,
      totalSmsSent: totalSmsSent[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Gender analytics
router.get('/gender', authenticateToken, async (req, res) => {
  try {
    const genderData = await Voter.aggregate([
      { $match: { is_dead: false } },
      { $group: { _id: '$gender', count: { $sum: 1 } } },
      { $project: { gender: '$_id', count: 1, _id: 0 } }
    ]);

    res.json(genderData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Age group analytics
router.get('/age-groups', authenticateToken, async (req, res) => {
  try {
    const ageGroups = await Voter.aggregate([
      { $match: { is_dead: false, age: { $exists: true } } },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$age', 25] }, then: '18-24' },
                { case: { $lt: ['$age', 35] }, then: '25-34' },
                { case: { $lt: ['$age', 45] }, then: '35-44' },
                { case: { $lt: ['$age', 55] }, then: '45-54' },
                { case: { $lt: ['$age', 65] }, then: '55-64' }
              ],
              default: '65+'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $project: { age_group: '$_id', count: 1, _id: 0 } },
      { $sort: { age_group: 1 } }
    ]);

    res.json(ageGroups);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Area-wise analytics
router.get('/areas', authenticateToken, async (req, res) => {
  try {
    const areaData = await Voter.aggregate([
      { $match: { is_dead: false, ward_area: { $exists: true, $ne: '' } } },
      { $group: { _id: '$ward_area', voter_count: { $sum: 1 } } },
      { $project: { ward_area: '$_id', voter_count: 1, _id: 0 } },
      { $sort: { voter_count: -1 } },
      { $limit: 10 }
    ]);

    res.json(areaData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Recent activity
router.get('/recent-activity', authenticateToken, async (req, res) => {
  try {
    const activities = await AuditLog.find()
      .populate('user_id', 'full_name')
      .sort({ createdAt: -1 })
      .limit(10);

    const formattedActivities = activities.map(activity => ({
      id: activity._id,
      action: activity.action,
      user_name: activity.user_id?.full_name || 'System',
      created_at: activity.createdAt
    }));

    res.json(formattedActivities);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;