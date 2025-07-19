import mongoose from "mongoose";

// User Schema
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true },
    age: { type: Number },
    address: { type: String },
    id_number: { type: String },
    dob: { type: Date },
    password: { type: String, required: true },
    photo: { type: String },
    designation: { type: String },
    role: {
      type: String,
      required: true,
      enum: ["Super Admin", "Admin", "Supervisor", "Karyakarta"],
      default: "Karyakarta",
    },
    booth_access: { type: String },
    last_login: { type: Date },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Voter Schema
const voterSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true },
    age: { type: Number },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    father_husband_name: { type: String },
    house_no: { type: String },
    category: { type: String },
    caste: { type: String },
    sub_caste: { type: String },
    sub_sub_caste: { type: String },
    ward_area: { type: String },
    district: { type: String },
    taluka: { type: String },
    village: { type: String },
    city: { type: String },
    mobile_number: { type: String },
    whatsapp_number: { type: String },
    head_of_house: { type: Number, default: 0 },
    voter_image: { type: String },
    political_preference: { type: String },
    party_designation: { type: String },
    occupation: { type: String },
    occupation_subcategory: { type: String },
    voter_id: { type: String },
    present_in_city: { type: Boolean, default: true },
    present_city_name: { type: String },
    date_of_birth: { type: Date },
    booth: { type: String },
    is_dead: { type: Boolean, default: false },
    family_id: { type: String },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

// Task Schema
const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assigned_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    due_date: { type: Date },
    start_date: { type: Date },
    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed"],
      default: "Not Started",
    },
    notes: { type: String },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    area: { type: String },
  },
  {
    timestamps: true,
  }
);

// SMS Log Schema
const smsLogSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    recipients: [{ type: String }],
    sent_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    success_count: { type: Number, default: 0 },
    failure_count: { type: Number, default: 0 },
    total_count: { type: Number, default: 0 },
    type: {
      type: String,
      enum: ["manual", "birthday", "reminder", "announcement"],
      default: "manual",
    },
  },
  {
    timestamps: true,
  }
);

// Audit Log Schema
const auditLogSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    table_name: { type: String },
    record_id: { type: String },
    old_values: { type: mongoose.Schema.Types.Mixed },
    new_values: { type: mongoose.Schema.Types.Mixed },
    ip_address: { type: String },
    user_agent: { type: String },
  },
  {
    timestamps: true,
  }
);

// Custom Field Schema
const customFieldSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    field_type: {
      type: String,
      required: true,
      enum: ["text", "number", "date", "select", "textarea", "checkbox"],
    },
    is_required: { type: Boolean, default: false },
    options: [{ type: String }],
    applies_to: {
      type: String,
      required: true,
      enum: ["voter", "user", "task"],
    },
  },
  {
    timestamps: true,
  }
);

// Comment Schema
const commentSchema = new mongoose.Schema(
  {
    entity_type: {
      type: String,
      required: true,
      enum: ["voter", "task", "user"],
    },
    entity_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    comment: { type: String, required: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

// Settings Schema
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String },
    description: { type: String },
  },
  {
    timestamps: true,
  }
);

// Level Program Schema
const levelProgramSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    level: {
      type: String,
      required: true,
      enum: ["State", "District", "City", "Village", "Area"],
    },
    parent_id: { type: mongoose.Schema.Types.ObjectId, ref: "LevelProgram" },
    area: { type: String },
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    karyakartas: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    supporters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Voter" }],
    party_strength: {
      bjp: { type: Number, default: 0 },
      congress: { type: Number, default: 0 },
      aap: { type: Number, default: 0 },
      neutral: { type: Number, default: 0 },
    },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
  },
  {
    timestamps: true,
  }
);

// Backup Schema
const backupSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    size: { type: Number },
    type: {
      type: String,
      enum: ["manual", "automatic"],
      default: "manual",
    },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better performance
// userSchema.index({ username: 1 });
// userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

voterSchema.index({ full_name: 1 });
voterSchema.index({ mobile_number: 1 });
voterSchema.index({ ward_area: 1 });
voterSchema.index({ booth: 1 });
voterSchema.index({ family_id: 1 });
voterSchema.index({ political_preference: 1 });

taskSchema.index({ assigned_to: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ due_date: 1 });

auditLogSchema.index({ user_id: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

// Export models
export const User = mongoose.model("User", userSchema);
export const Voter = mongoose.model("Voter", voterSchema);
export const Task = mongoose.model("Task", taskSchema);
export const SmsLog = mongoose.model("SmsLog", smsLogSchema);
export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export const CustomField = mongoose.model("CustomField", customFieldSchema);
export const Comment = mongoose.model("Comment", commentSchema);
export const Settings = mongoose.model("Settings", settingsSchema);
export const LevelProgram = mongoose.model("LevelProgram", levelProgramSchema);
export const Backup = mongoose.model("Backup", backupSchema);
