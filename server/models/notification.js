import mongoose from "mongoose";  ///....new added

const notificationSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    type: { type: String, default: "manual" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
