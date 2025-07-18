import express from 'express';
import { Comment, AuditLog } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get comments for an entity
router.get('/:entityType/:entityId', authenticateToken, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    const comments = await Comment.find({
      entity_type: entityType,
      entity_id: entityId
    })
    .populate('created_by', 'full_name')
    .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create comment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { entity_type, entity_id, comment } = req.body;
    
    const newComment = await Comment.create({
      entity_type,
      entity_id,
      comment,
      created_by: req.user._id
    });

    // Log audit
    await AuditLog.create({
      user_id: req.user._id,
      action: 'CREATE_COMMENT',
      table_name: 'comments',
      record_id: newComment._id.toString()
    });

    const populatedComment = await Comment.findById(newComment._id)
      .populate('created_by', 'full_name');

    res.status(201).json({
      message: 'Comment created successfully',
      comment: populatedComment
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update comment
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    
    const updatedComment = await Comment.findOneAndUpdate(
      { _id: id, created_by: req.user._id },
      { comment },
      { new: true }
    ).populate('created_by', 'full_name');

    if (!updatedComment) {
      return res.status(404).json({ message: 'Comment not found or unauthorized' });
    }

    // Log audit
    await AuditLog.create({
      user_id: req.user._id,
      action: 'UPDATE_COMMENT',
      table_name: 'comments',
      record_id: id
    });

    res.json({ message: 'Comment updated successfully', comment: updatedComment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete comment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const comment = await Comment.findOneAndDelete({
      _id: id,
      created_by: req.user._id
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found or unauthorized' });
    }

    // Log audit
    await AuditLog.create({
      user_id: req.user._id,
      action: 'DELETE_COMMENT',
      table_name: 'comments',
      record_id: id
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;