import express from "express";
import bcrypt from "bcryptjs";
import { User, AuditLog } from "../models/index.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Get all users
router.get(
  "/",
  authenticateToken,
  authorizeRoles("Super Admin", "Admin"),
  async (req, res) => {
    try {
      const users = await User.find({}, "-password").sort({ createdAt: -1 });
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Create user
router.post(
  "/",
  authenticateToken,
  authorizeRoles("Super Admin", "Admin"),
  async (req, res) => {
    try {
      const {
        username,
        full_name,
        email,
        mobile,
        age,
        address,
        id_number,
        dob,
        password,
        designation,
        role,
        booth_access,
      } = req.body;

      // Check if username or email exists
      const existing = await User.findOne({
        $or: [{ username }, { email }],
      });

      if (existing) {
        return res
          .status(400)
          .json({ message: "Username or email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await User.create({
        username,
        full_name,
        email,
        mobile,
        age,
        address,
        id_number,
        dob,
        password: hashedPassword,
        designation,
        role,
        booth_access,
      });

      // Log audit
      await AuditLog.create({
        user_id: req.user._id,
        action: "CREATE_USER",
        table_name: "users",
        record_id: user._id.toString(),
      });

      res.status(201).json({
        message: "User created successfully",
        userId: user._id,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Update user
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("Super Admin", "Admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { password, ...updateData } = req.body;

      // Fetch the target user to check their role
      const targetUser = await User.findById(id);   ///....new added
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const targetRole = targetUser.role;
      const currentUserRole = req.user.role;
      const currentUserId = req.user._id.toString();

      // Admin should NOT be able to edit Super Admin or Admin
      if (currentUserRole === "Admin" && (targetRole === "Admin" || targetRole === "Super Admin" ) && id !== currentUserId) {  ///....new added
        return res.status(403).json({
          message: "Admins are not allowed to edit other Admins or Super Admins.",
        });
      }  ///....new added

      if (password) {
        updateData.password = await bcrypt.hash(password, 12);
      }

      const user = await User.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Log audit
      await AuditLog.create({
        user_id: req.user._id,
        action: "UPDATE_USER",
        table_name: "users",
        record_id: id,
      });

      res.json({ message: "User updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Delete user (soft delete)
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("Super Admin", "Admin"),   ///....new added as per permissions, hirarchy "Admin"
  async (req, res) => {
    try {
      const { id } = req.params;

      // Prevent user from deleting themselves.     ///....new added
      if (req.user._id.toString() === id) {
        return res.status(400).json({ message: "You can't delete yourself" });
      }
      // Fetch the user to be deleted
      const targetUser = await User.findById(id);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const targetRole = targetUser.role;
      const currentUserRole = req.user.role;
      // Super Admin can't delete himself (already handled above)
      if (currentUserRole === "Super Admin") {
        // Super Admin can delete anyone else
      }
      // Admin can't delete Super Admin or other Admins
      if (currentUserRole === "Admin") {
        if (targetRole === "Super Admin" || targetRole === "Admin") {
          return res.status(403).json({
            message: "You can't delete this user. Admins can only delete Supervisors and Karyakartas.",
          });
        }
      }   ///....new added as per permissions

      const user = await User.findByIdAndUpdate(
        id,
        { is_active: false },
        { new: true }
      );

      if (!user) {   ///....new added
        return res.status(404).json({ message: "User not found" });
      }

      // Log audit
      await AuditLog.create({
        user_id: req.user._id,
        action: "DELETE_USER",
        table_name: "users",
        record_id: id,
      });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Get users by role (for dynamic user fetch)
router.get(
  "/by-role",
  authenticateToken,
  authorizeRoles("Super Admin", "Admin" ),     ///....new added as per permissions, hirarchy "Admin", "Supervisor", "Karyakarta",
  async (req, res) => {
    try {
      const { role } = req.query;
      if (!role) {
        return res.status(400).json({ message: "Role is required" });
      }

      const users = await User.find({ role, is_active: true }).select(
        "_id full_name username email mobile"
      );

      res.json(users);
    } catch (error) {
      console.error("Error fetching users by role:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

export default router;
