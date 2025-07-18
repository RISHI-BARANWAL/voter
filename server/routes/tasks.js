import express from 'express';
import { Task, User, AuditLog } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all tasks with proper filtering and population
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, assigned_to, page = 1, limit = 20, priority } = req.query;
    const skip = (page - 1) * limit;
    const query = {};

    if (status) query.status = status;
    if (assigned_to) query.assigned_to = assigned_to;
    if (priority) query.priority = priority;

    // Role-based filtering
    if (req.user.role === 'Supervisor' || req.user.role === 'Karyakarta') {
      query.$or = [
        { assigned_to: req.user._id },
        { assigned_by: req.user._id }
      ];
    }

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('assigned_to', 'full_name role')
        .populate('assigned_by', 'full_name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Task.countDocuments(query)
    ]);

    // Format tasks for frontend
    const formattedTasks = tasks.map(task => ({
      id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      start_date: task.start_date,
      area: task.area,
      notes: task.notes,
      assigned_to_name: task.assigned_to?.full_name,
      assigned_by_name: task.assigned_by?.full_name,
      created_at: task.createdAt,
      updated_at: task.updatedAt
    }));

    res.json(formattedTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single task by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id)
      .populate('assigned_to', 'full_name role')
      .populate('assigned_by', 'full_name role');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has permission to view this task
    if (req.user.role === 'Supervisor' || req.user.role === 'Karyakarta') {
      if (task.assigned_to?._id.toString() !== req.user._id.toString() && 
          task.assigned_by?._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const formattedTask = {
      id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      start_date: task.start_date,
      area: task.area,
      notes: task.notes,
      assigned_to_name: task.assigned_to?.full_name,
      assigned_by_name: task.assigned_by?.full_name,
      created_at: task.createdAt,
      updated_at: task.updatedAt
    };

    res.json(formattedTask);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title, description, assigned_to, due_date, start_date, 
      priority, area, notes
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const taskData = {
      title,
      description,
      assigned_to: assigned_to || null,
      assigned_by: req.user._id,
      due_date: due_date || null,
      start_date: start_date || null,
      priority: priority || 'Medium',
      area,
      notes,
      status: 'Not Started'
    };

    const task = await Task.create(taskData);
    
    // Populate the created task
    const populatedTask = await Task.findById(task._id)
      .populate('assigned_to', 'full_name role')
      .populate('assigned_by', 'full_name role');

    // Log audit
    await AuditLog.create({
      user_id: req.user._id,
      action: 'CREATE_TASK',
      table_name: 'tasks',
      record_id: task._id.toString(),
      new_values: taskData
    });

    const formattedTask = {
      id: populatedTask._id,
      title: populatedTask.title,
      description: populatedTask.description,
      status: populatedTask.status,
      priority: populatedTask.priority,
      due_date: populatedTask.due_date,
      start_date: populatedTask.start_date,
      area: populatedTask.area,
      notes: populatedTask.notes,
      assigned_to_name: populatedTask.assigned_to?.full_name,
      assigned_by_name: populatedTask.assigned_by?.full_name,
      created_at: populatedTask.createdAt,
      updated_at: populatedTask.updatedAt
    };

    res.status(201).json({
      message: 'Task created successfully',
      taskId: task._id,
      task: formattedTask
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update task
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    const oldTask = await Task.findById(id);
    if (!oldTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions for non-admin users
    if (req.user.role === 'Supervisor' || req.user.role === 'Karyakarta') {
      if (oldTask.assigned_to?.toString() !== req.user._id.toString() && 
          oldTask.assigned_by?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const task = await Task.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).populate('assigned_to', 'full_name role')
     .populate('assigned_by', 'full_name role');

    // Log audit
    await AuditLog.create({
      user_id: req.user._id,
      action: 'UPDATE_TASK',
      table_name: 'tasks',
      record_id: id,
      old_values: oldTask.toObject(),
      new_values: updateData
    });

    const formattedTask = {
      id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      start_date: task.start_date,
      area: task.area,
      notes: task.notes,
      assigned_to_name: task.assigned_to?.full_name,
      assigned_by_name: task.assigned_by?.full_name,
      created_at: task.createdAt,
      updated_at: task.updatedAt
    };

    res.json({ 
      message: 'Task updated successfully',
      task: formattedTask
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only allow task creator or admin to delete
    if (req.user.role !== 'Super Admin' && req.user.role !== 'Admin') {
      if (task.assigned_by?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    await Task.findByIdAndDelete(id);

    // Log audit
    await AuditLog.create({
      user_id: req.user._id,
      action: 'DELETE_TASK',
      table_name: 'tasks',
      record_id: id,
      old_values: task.toObject()
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get tasks assigned to current user
router.get('/my/assigned', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ assigned_to: req.user._id })
      .populate('assigned_by', 'full_name role')
      .sort({ createdAt: -1 });

    const formattedTasks = tasks.map(task => ({
      id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      start_date: task.start_date,
      area: task.area,
      notes: task.notes,
      assigned_by_name: task.assigned_by?.full_name,
      created_at: task.createdAt,
      updated_at: task.updatedAt
    }));

    res.json(formattedTasks);
  } catch (error) {
    console.error('Error fetching assigned tasks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get tasks created by current user
router.get('/my/created', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ assigned_by: req.user._id })
      .populate('assigned_to', 'full_name role')
      .sort({ createdAt: -1 });

    const formattedTasks = tasks.map(task => ({
      id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      start_date: task.start_date,
      area: task.area,
      notes: task.notes,
      assigned_to_name: task.assigned_to?.full_name,
      created_at: task.createdAt,
      updated_at: task.updatedAt
    }));

    res.json(formattedTasks);
  } catch (error) {
    console.error('Error fetching created tasks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update task status (for assigned users)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Not Started', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is assigned to this task or is admin
    if (req.user.role !== 'Super Admin' && req.user.role !== 'Admin') {
      if (task.assigned_to?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const oldStatus = task.status;
    task.status = status;
    task.updatedAt = new Date();
    await task.save();

    // Log audit
    await AuditLog.create({
      user_id: req.user._id,
      action: 'UPDATE_TASK_STATUS',
      table_name: 'tasks',
      record_id: id,
      old_values: { status: oldStatus },
      new_values: { status }
    });

    const updatedTask = await Task.findById(id)
      .populate('assigned_to', 'full_name role')
      .populate('assigned_by', 'full_name role');

    const formattedTask = {
      id: updatedTask._id,
      title: updatedTask.title,
      description: updatedTask.description,
      status: updatedTask.status,
      priority: updatedTask.priority,
      due_date: updatedTask.due_date,
      start_date: updatedTask.start_date,
      area: updatedTask.area,
      notes: updatedTask.notes,
      assigned_to_name: updatedTask.assigned_to?.full_name,
      assigned_by_name: updatedTask.assigned_by?.full_name,
      created_at: updatedTask.createdAt,
      updated_at: updatedTask.updatedAt
    };

    res.json({ 
      message: 'Task status updated successfully',
      task: formattedTask
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;