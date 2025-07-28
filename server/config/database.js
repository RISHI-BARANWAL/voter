import mongoose from "mongoose";     ///....new added
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) {
    console.log(" Already connected to MongoDB");
    return;
  }

  const mongoUri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/voter_management_dbT";

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000, // fail if cannot connect in 10s
      socketTimeoutMS: 45000, // fail if no response in 45s
      maxPoolSize: 10, // limit connection pool size
      family: 4,
    });

    isConnected = true;
    console.log(" Connected to MongoDB");

    await createDefaultAdmin();
  } catch (error) {
    console.error(" MongoDB connection failed. Retrying in 5 seconds...");
    console.error(error.message);

    // Retry after delay
    setTimeout(connectToDatabase, 5000);
  }
}

async function createDefaultAdmin() {
  try {
    const { User } = await import("../models/index.js");

    const existingAdmin = await User.findOne({ role: "Super Admin" });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 12);

      await User.create({
        username: "admin",
        full_name: "System Administrator",
        email: "admin@system.com",
        mobile: "1234567890",
        password: hashedPassword,
        role: "Super Admin",
        is_active: true,
      });

      console.log(" Default admin created (admin / admin123)");
    }
  } catch (error) {
    console.error(" Error creating default admin:", error.message);
  }
}

export function getDatabase() {
  return mongoose.connection.db;
}
