import express from 'express';
import { CustomField, AuditLog } from '../models/index.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get all custom fields
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { applies_to } = req.query;
    const query = applies_to ? { applies_to } : {};
    
    const fields = await CustomField.find(query).sort({ createdAt: -1 });
    res.json(fields);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create custom field
router.post('/', authenticateToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
  try {
    const field = await CustomField.create(req.body);

    // Log audit
    await AuditLog.create({
      user_id: req.user._id,
      action: 'CREATE_CUSTOM_FIELD',
      table_name: 'customfields',
      record_id: field._id.toString()
    });

    res.status(201).json({
      message: 'Custom field created successfully',
      fieldId: field._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update custom field
router.put('/:id', authenticateToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const field = await CustomField.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!field) {
      return res.status(404).json({ message: 'Custom field not found' });
    }

    // Log audit
    await AuditLog.create({
      user_id: req.user._id,
      action: 'UPDATE_CUSTOM_FIELD',
      table_name: 'customfields',
      record_id: id
    });

    res.json({ message: 'Custom field updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete custom field
router.delete('/:id', authenticateToken, authorizeRoles('Super Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const field = await CustomField.findByIdAndDelete(id);

    if (!field) {
      return res.status(404).json({ message: 'Custom field not found' });
    }

    // Log audit
    await AuditLog.create({
      user_id: req.user._id,
      action: 'DELETE_CUSTOM_FIELD',
      table_name: 'customfields',
      record_id: id
    });

    res.json({ message: 'Custom field deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;