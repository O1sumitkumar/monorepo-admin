import express from "express";
import bcrypt from "bcryptjs";
import { authV1, generateTokenV1 } from "../../middleware/auth-v1.js";
import {
  validateUserLogin,
  validateUserRegistration,
  validateAdminSignup,
} from "../../middleware/validation.js";
import User from "../../models/User.js";
import jwt from "jsonwebtoken";
import Account from "../../models/Account.js"; // Added import for Account

const router = express.Router();

// Admin signup endpoint
router.post("/admin-signup", validateAdminSignup, async (req, res) => {
  try {
    const { username, email, password, adminCode } = req.body;

    // Verify admin code (you can set this in environment variables)
    const validAdminCode = process.env.ADMIN_SIGNUP_CODE || "ADMIN2024";
    if (adminCode !== validAdminCode) {
      return res.status(403).json({
        success: false,
        message: "Invalid admin signup code",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    // Find or create a default account for admin users
    let defaultAccount = await Account.findOne({ accountType: "Business" });
    if (!defaultAccount) {
      // Create a default admin account if none exists
      defaultAccount = new Account({
        id: "admin-account",
        name: "System Administrator",
        accountId: "admin-account-001",
        email: "admin@system.com",
        description: "Default account for system administrators",
        accountType: "Business",
        status: "active",
        sharedAccounts: [],
      });
      await defaultAccount.save();
    }

    // Hash password
    const saltRounds = 12; // Higher salt rounds for admin accounts
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new admin user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: "admin",
      status: "active",
      accountId: defaultAccount._id, // Assign to default account
    });

    await user.save();

    // Generate token
    const token = generateTokenV1(user._id);

    console.log(`✅ [ADMIN SIGNUP] New admin user created: ${username}`);

    // Return success response
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          accountId: user.accountId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      },
      message: "Admin user created successfully",
    });
  } catch (error) {
    console.error("❌ [ADMIN SIGNUP] Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Simple test endpoint (no database)
router.post("/test-simple", async (req, res) => {
  try {
    console.log("🔍 [TEST SIMPLE] Request received");
    console.log("🔍 [TEST SIMPLE] Body:", req.body);

    res.status(200).json({
      success: true,
      message: "Simple test successful",
      body: req.body,
    });
  } catch (error) {
    console.error("❌ [TEST SIMPLE] Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Test login endpoint (without validation)
router.post("/test-login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("🔍 [TEST LOGIN] Attempting login for:", username);

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      console.log("❌ [TEST LOGIN] User not found:", username);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    console.log("✅ [TEST LOGIN] User found:", user.username);

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log("🔍 [TEST LOGIN] Password check result:", isValidPassword);

    if (!isValidPassword) {
      console.log("❌ [TEST LOGIN] Invalid password for user:", username);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateTokenV1(user._id);

    console.log("✅ [TEST LOGIN] Login successful for:", username);

    // Return success response
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      },
      message: "Login successful",
    });
  } catch (error) {
    console.error("❌ [TEST LOGIN] Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Login endpoint
router.post("/login", validateUserLogin, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateTokenV1(user._id);

    // Return success response
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      },
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Register endpoint
router.post("/register", validateUserRegistration, async (req, res) => {
  try {
    const { username, email, password, role = "user" } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role,
    });

    await user.save();

    // Generate token
    const token = generateTokenV1(user._id);

    // Return success response
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      },
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Verify token endpoint
router.post("/verify", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        valid: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      message: "Token is valid",
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
});

// Get profile endpoint
router.get("/profile", authV1, async (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      message: "Profile retrieved successfully",
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Change password endpoint
router.post("/change-password", authV1, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
