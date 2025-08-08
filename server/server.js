import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectToDatabase } from "./config/database.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import voterRoutes from "./routes/voters.js";
// import uploadRoutes  from "./routes/upload.js";  ///....new added IMG
import taskRoutes from "./routes/tasks.js";
import smsRoutes from "./routes/sms.js";
import analyticsRoutes from "./routes/analytics.js";
import backupRoutes from "./routes/backup.js";
import auditRoutes from "./routes/audit.js";
import settingsRoutes from "./routes/settings.js";
import levelProgramRoutes from "./routes/levelProgram.js";
import customFieldRoutes from "./routes/customFields.js";
import commentRoutes from "./routes/comments.js";
import notificationRoutes from "./routes/notifications.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// app.use(cors());
const allowedOrigins = [  ///....new added
  "http://localhost:5173",        // Local dev frontend
  "https://thebyd.org",           // Production frontend (Hostinger)
  "https://voter-fssv.onrender.com/api" // Optional: backend or SSR frontend
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // allows cookies and auth headers if needed
};  ///....new added

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Preflight handling

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB
await connectToDatabase();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/voters", voterRoutes);
// app.use('/api/upload', uploadRoutes);  ///....new added IMG
app.use("/api/tasks", taskRoutes);
app.use("/api/sms", smsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/backup", backupRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/level-program", levelProgramRoutes);
app.use("/api/custom-fields", customFieldRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Voter Management System API is running",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
