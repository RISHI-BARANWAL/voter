// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const fs = require('fs');
// const path = require('path');
// const authenticateToken = require('../middleware/auth'); // adjust path as needed

// // Ensure uploads/ folder exists
// const imageStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const dir = path.join(__dirname, '../uploads');
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir, { recursive: true });
//     }
//     cb(null, dir);
//   },
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname).toLowerCase();
//     const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
//     const voterId = req.body.voter_id || 'unknown';
//     const finalName = `${base}_${voterId}${ext}`;
//     cb(null, finalName);
//   },
// });

// const imageFilter = (req, file, cb) => {
//   const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif'];
//   const ext = path.extname(file.originalname).toLowerCase();
//   if (allowedTypes.includes(ext)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only image files (JPG, JPEG, PNG, GIF) are allowed'));
//   }
// };

// const uploadVoterImage = multer({
//   storage: imageStorage,
//   fileFilter: imageFilter,
// });

// router.post(
//   '/upload-image',
//   authenticateToken,
//   uploadVoterImage.single('voter_image'),
//   (req, res) => {
//     if (!req.file) {
//       return res.status(400).json({ message: 'No image uploaded' });
//     }

//     const imageUrl = `/uploads/${req.file.filename}`;
//     res.json({
//       message: 'Image uploaded',
//       fileName: req.file.filename,
//       imageUrl,
//     });
//   }
// );

// module.exports = router;










// ///....new added working on it....
// const multer = require('multer');
// const path = require('path');

// // Set storage engine
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/'); // Ensure 'uploads/' folder exists
//   },
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     const filename = `img_${Date.now()}${ext}`;
//     cb(null, filename);
//   },
// });

// // File filter (optional, restrict to image types)
// const fileFilter = (req, file, cb) => {
//   const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
//   if (allowed.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Invalid file type. Only JPG, PNG allowed.'), false);
//   }
// };

// const upload = multer({ storage, fileFilter });

// module.exports = upload;




















// import express from 'express';
// import multer from 'multer';
// import path from 'path';
// import { v4 as uuidv4 } from 'uuid';
// import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
// import { fileURLToPath } from 'url';

// const router = express.Router();

// // Handle __dirname in ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Set up multer storage
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.join(__dirname, '../uploads'));
//   },
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname);
//     const filename = `${Date.now()}-${file.originalname}`;
//     cb(null, filename);
//   },
// });

// const upload = multer({ storage });

// // Upload route
// router.post('/', upload.single('voter_image'), (req, res) => {    ///.....new added IMG image or voter_image
//   if (!req.file) {
//     return res.status(400).json({ error: 'No file uploaded' });
//   }

//   const imageUrl = `/uploads/${req.file.filename}`;
//   res.json({ imageUrl }); // Send back image URL
// });

// export default router;






























































// // Create uploads/ folder if it doesn't exist
// const imageStorage = multer.diskStorage({    ///....new added img
//   destination: function (req, file, cb) {
//     const dir = path.join(__dirname, '../uploads');  // const dir = 'uploads/';  //  uploadDir or dir
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir, { recursive: true });
//     }
//     cb(null, dir);
//   },
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname).toLowerCase();
//     const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
//     const voterId = req.body.voter_id || 'unknown';
//     const finalName = `${base}_${voterId}${ext}`;
//     cb(null, finalName);
//   }
// });

// const imageFilter = (req, file, cb) => {
//   if (file.fieldname === 'voter_image') {
//       // For voter images
//       const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif'];
//       const ext = path.extname(file.originalname).toLowerCase();
//       if (allowedTypes.includes(ext)) {
//         cb(null, true);
//       } else {
//         cb(new Error('Only image files (JPG, JPEG, PNG, GIF) are allowed'));
//       }
//   }
//   // const allowed = /jpeg|jpg|png/;
//   // const isValid =
//   //   allowed.test(path.extname(file.originalname).toLowerCase()) &&
//   //   allowed.test(file.mimetype);
//   // isValid ? cb(null, true) : cb(new Error("Only .jpg, .jpeg, .png allowed"));
// };

// const uploadVoterImage = multer({
//   storage: imageStorage,
//   fileFilter: imageFilter,
// });   ///....new added

// // Upload Voter Image route.     ///....new added
// router.post('/upload-image', authenticateToken, uploadVoterImage.single('voter_image'), (req, res) => {  ///....new added instead image
//   if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: 'No image file uploaded' });
//     }

//     const imageUrl = `/uploads/${req.file.filename}`;
    
//     res.json({
//       message: "Image uploaded",   // message: 'Image uploaded successfully',
//       fileName: req.file.filename,   // filename: req.file.filename
//       imageUrl: `/uploads/${req.file.filename}`  //  filePath or imageUrl: imageUrl,
//     });
//   } catch (error) {
//     console.error('Error uploading image:', error);
//     res.status(500).json({ message: 'Image upload failed', error: error.message });
//   }
// });   ///....new added



// xlsx multer
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = path.join(__dirname, '../uploads');
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   }
// });
