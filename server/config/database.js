import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) {
    console.log('Already connected to MongoDB');
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/voter_management_db';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = true;
    console.log('Connected to MongoDB successfully');
    
    // Create default admin user
    await createDefaultAdmin();
    
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createDefaultAdmin() {
  try {
    const { User } = await import('../models/index.js');
    
    const existingAdmin = await User.findOne({ role: 'Super Admin' });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await User.create({
        username: 'admin',
        full_name: 'System Administrator',
        email: 'admin@system.com',
        mobile: '1234567890',
        password: hashedPassword,
        role: 'Super Admin',
        is_active: true
      });
      
      // console.log('Default admin created - Username: admin, Password: admin123');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
}

export function getDatabase() {
  return mongoose.connection.db;
}