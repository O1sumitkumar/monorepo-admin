import express from "express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { User } from "../database/init.js";

const router = express.Router();

// Get all users with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    let query = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count
    const total = await User.countDocuments(query);

    // Get users (without passwords)
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get statistics
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          admins: {
            $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] },
          },
          users: {
            $sum: { $cond: [{ $eq: ["$role", "user"] }, 1, 0] },
          },
        },
      },
    ]);

    const statistics = stats[0] || { total: 0, admins: 0, users: 0 };

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      statistics,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get single user
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id }).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Create new user
router.post("/", async (req, res) => {
  try {
    const { username, email, password, role = "user" } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Username, email, and password are required" });
    }

    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ error: "Role must be admin or user" });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username });

    if (existingUsername) {
      return res.status(409).json({ error: "Username already exists" });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const id = uuidv4();
    const now = new Date();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      id,
      username,
      email,
      password: hashedPassword,
      role,
      createdAt: now,
      updatedAt: now,
    });

    await newUser.save();

    const userResponse = await User.findOne({ id }).select("-password");

    res.status(201).json(userResponse);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Update user
router.put("/:id", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if user exists
    const existing = await User.findOne({ id: req.params.id });

    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if new username conflicts with existing
    if (username) {
      const conflict = await User.findOne({
        username,
        id: { $ne: req.params.id },
      });

      if (conflict) {
        return res.status(409).json({ error: "Username already exists" });
      }
    }

    // Check if new email conflicts with existing
    if (email) {
      const conflict = await User.findOne({
        email,
        id: { $ne: req.params.id },
      });

      if (conflict) {
        return res.status(409).json({ error: "Email already exists" });
      }
    }

    const now = new Date();
    let updateData = {
      ...(username && { username }),
      ...(email && { email }),
      ...(role && { role }),
      updatedAt: now,
    };

    // Hash password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const updatedUser = await User.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true }
    ).select("-password");

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Delete user
router.delete("/:id", async (req, res) => {
  try {
    // Check if user exists
    const existing = await User.findOne({ id: req.params.id });

    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    await User.findOneAndDelete({ id: req.params.id });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Get user statistics
router.get("/stats/overview", async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          admins: {
            $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] },
          },
          users: {
            $sum: { $cond: [{ $eq: ["$role", "user"] }, 1, 0] },
          },
        },
      },
    ]);

    const statistics = stats[0] || { total: 0, admins: 0, users: 0 };

    // Get recent users
    const recentUsers = await User.find()
      .select("id username email role createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      statistics,
      recentUsers,
    });
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

export default router;
