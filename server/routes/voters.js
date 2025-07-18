import express from 'express';
import { Voter, AuditLog } from '../models/index.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and CSV files are allowed'));
    }
  }
});

// Get all voters with pagination and filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      gender,
      area,
      booth,
      age_min,
      age_max,
      mobile_filter,
      is_dead
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { father_husband_name: { $regex: search, $options: 'i' } },
        { mobile_number: { $regex: search, $options: 'i' } },
        { voter_id: { $regex: search, $options: 'i' } }
      ];
    }

    if (gender) query.gender = gender;
    if (area) query.ward_area = { $regex: area, $options: 'i' };
    if (booth) query.booth = { $regex: booth, $options: 'i' };
    if (age_min || age_max) {
      query.age = {};
      if (age_min) query.age.$gte = parseInt(age_min);
      if (age_max) query.age.$lte = parseInt(age_max);
    }
    if (is_dead !== undefined) query.is_dead = is_dead === 'true';

    if (mobile_filter === 'with_mobile') {
      query.mobile_number = { $exists: true, $ne: '', $ne: null };
    } else if (mobile_filter === 'without_mobile') {
      query.$or = [
        { mobile_number: { $exists: false } },
        { mobile_number: '' },
        { mobile_number: null }
      ];
    }

    const [voters, total] = await Promise.all([
      Voter.find(query)
        .populate('created_by', 'full_name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Voter.countDocuments(query)
    ]);

    res.json({
      voters,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching voters:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single voter by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid voter ID format' });
    }
    
    const voter = await Voter.findById(id).populate('created_by', 'full_name');
    
    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }

    res.json(voter);
  } catch (error) {
    console.error('Error fetching voter:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Create voter
router.post('/', authenticateToken, async (req, res) => {
  try {
    const voterData = { ...req.body };

    // Generate family ID if head of house
    if (voterData.head_of_house === 1 || voterData.head_of_house === '1') {
      voterData.family_id = uuidv4();
    } else if (voterData.house_no) {
      // Find existing family ID for same house number
      const existingFamily = await Voter.findOne({
        house_no: voterData.house_no,
        head_of_house: 1
      });
      if (existingFamily) {
        voterData.family_id = existingFamily.family_id;
      }
    }

    voterData.created_by = req.user._id;

    const voter = await Voter.create(voterData);

    // Log audit
    await AuditLog.create({
      user_id: req.user._id,
      action: 'CREATE_VOTER',
      table_name: 'voters',
      record_id: voter._id.toString(),
      new_values: voterData
    });

    res.status(201).json({
      message: 'Voter created successfully',
      voterId: voter._id,
      voter
    });
  } catch (error) {
    console.error('Error creating voter:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update voter
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid voter ID format' });
    }
    
    const oldVoter = await Voter.findById(id);
    if (!oldVoter) {
      return res.status(404).json({ message: 'Voter not found' });
    }

    // Remove empty strings and convert age to number if provided
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '') {
        updateData[key] = null;
      }
      if (key === 'age' && updateData[key]) {
        updateData[key] = parseInt(updateData[key]);
      }
      if (key === 'head_of_house') {
        updateData[key] = parseInt(updateData[key]) || 0;
      }
      if (key === 'present_in_city') {
        updateData[key] = updateData[key] === true || updateData[key] === 'true';
      }
    });

    console.log('Updating voter with ID:', id);
    console.log('Update data:', updateData);

    const voter = await Voter.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('created_by', 'full_name');

    if (!voter) {
      return res.status(404).json({ message: 'Voter not found after update' });
    }

    // Log audit
    await AuditLog.create({
      user_id: req.user._id,
      action: 'UPDATE_VOTER',
      table_name: 'voters',
      record_id: id,
      old_values: oldVoter.toObject(),
      new_values: updateData
    });

    console.log('Voter updated successfully:', voter._id);

    res.json({ 
      message: 'Voter updated successfully',
      voter
    });
  } catch (error) {
    console.error('Error updating voter:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete voter
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const voter = await Voter.findById(id);
    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }

    await Voter.findByIdAndDelete(id);

    // Log audit
    await AuditLog.create({
      user_id: req.user._id,
      action: 'DELETE_VOTER',
      table_name: 'voters',
      record_id: id,
      old_values: voter.toObject()
    });

    res.json({ message: 'Voter deleted successfully' });
  } catch (error) {
    console.error('Error deleting voter:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get family members
router.get('/family/:familyId', authenticateToken, async (req, res) => {
  try {
    const { familyId } = req.params;
    
    const familyMembers = await Voter.find({ family_id: familyId })
      .sort({ head_of_house: -1, age: -1 });

    res.json(familyMembers);
  } catch (error) {
    console.error('Error fetching family members:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Import voters from Excel/CSV (Admin/Super Admin only)
router.post('/import', authenticateToken, authorizeRoles('Super Admin', 'Admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    
    let data = [];
    
    if (ext === '.csv') {
      // Handle CSV files
      const csvData = fs.readFileSync(filePath, 'utf8');
      const lines = csvData.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          data.push(row);
        }
      }
    } else {
      // Handle Excel files
      const XLSX = await import('xlsx');
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);
    }

    const importedVoters = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        
        // Map Excel/CSV columns to database fields
        const voterData = {
          full_name: row['Full Name'] || row['full_name'] || row['Name'] || '',
          age: parseInt(row['Age'] || row['age']) || null,
          gender: row['Gender'] || row['gender'] || '',
          father_husband_name: row['Father/Husband Name'] || row['father_husband_name'] || row['Father Name'] || '',
          house_no: row['House No'] || row['house_no'] || row['House Number'] || '',
          ward_area: row['Ward/Area'] || row['ward_area'] || row['Area'] || '',
          district: row['District'] || row['district'] || '',
          taluka: row['Taluka'] || row['taluka'] || '',
          village: row['Village'] || row['village'] || '',
          city: row['City'] || row['city'] || '',
          mobile_number: row['Mobile Number'] || row['mobile_number'] || row['Mobile'] || '',
          whatsapp_number: row['WhatsApp Number'] || row['whatsapp_number'] || row['WhatsApp'] || '',
          political_preference: row['Political Preference'] || row['political_preference'] || row['Party'] || '',
          occupation: row['Occupation'] || row['occupation'] || '',
          voter_id: row['Voter ID'] || row['voter_id'] || row['ID'] || '',
          booth: row['Booth'] || row['booth'] || '',
          caste: row['Caste'] || row['caste'] || '',
          category: row['Category'] || row['category'] || '',
          created_by: req.user._id,
          head_of_house: parseInt(row['Head of House'] || row['head_of_house']) || 0
        };

        // Skip empty rows
        if (!voterData.full_name) continue;

        // Generate family ID if head of house
        if (voterData.head_of_house === 1) {
          voterData.family_id = uuidv4();
        }

        const voter = await Voter.create(voterData);
        importedVoters.push(voter);

      } catch (error) {
        errors.push({
          row: i + 1,
          error: error.message,
          data: data[i]
        });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    // Log audit
    await AuditLog.create({
      user_id: req.user._id,
      action: 'IMPORT_VOTERS',
      table_name: 'voters',
      new_values: {
        imported_count: importedVoters.length,
        error_count: errors.length,
        filename: req.file.originalname
      }
    });

    res.json({
      message: 'Import completed',
      imported: importedVoters.length,
      errors: errors.length,
      errorDetails: errors.slice(0, 10) // Return first 10 errors
    });

  } catch (error) {
    console.error('Error importing voters:', error);
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Import failed', error: error.message });
  }
});

// Export voters to Excel (Admin/Super Admin only)
router.get('/export/excel', authenticateToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
  try {
    const voters = await Voter.find({}).populate('created_by', 'full_name');
    
    const exportData = voters.map(voter => ({
      'Voter ID': voter.voter_id || '',
      'Full Name': voter.full_name,
      'Age': voter.age || '',
      'Gender': voter.gender || '',
      'Father/Husband Name': voter.father_husband_name || '',
      'House No': voter.house_no || '',
      'Ward/Area': voter.ward_area || '',
      'District': voter.district || '',
      'Taluka': voter.taluka || '',
      'Village': voter.village || '',
      'City': voter.city || '',
      'Mobile Number': voter.mobile_number || '',
      'WhatsApp Number': voter.whatsapp_number || '',
      'Political Preference': voter.political_preference || '',
      'Occupation': voter.occupation || '',
      'Booth': voter.booth || '',
      'Caste': voter.caste || '',
      'Category': voter.category || '',
      'Head of House': voter.head_of_house || 0,
      'Created Date': voter.createdAt ? new Date(voter.createdAt).toLocaleDateString() : '',
      'Created By': voter.created_by?.full_name || ''
    }));

    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Voters');

    const filename = `voters_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    const filepath = path.join(__dirname, '../uploads', filename);

    XLSX.writeFile(workbook, filepath);

    // Log audit
    await AuditLog.create({
      user_id: req.user._id,
      action: 'EXPORT_VOTERS',
      table_name: 'voters',
      new_values: {
        exported_count: voters.length,
        filename
      }
    });

    res.download(filepath, filename, (err) => {
      if (!err) {
        // Clean up file after download
        setTimeout(() => {
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
        }, 5000);
      }
    });

  } catch (error) {
    console.error('Error exporting voters:', error);
    res.status(500).json({ message: 'Export failed', error: error.message });
  }
});

export default router;