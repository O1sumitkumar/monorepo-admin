import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../database/init.js";

const router = express.Router();

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    // Find user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    // Return user data (without password) and token
    const { password: _, ...userData } = user.toObject();

    res.json({
      user: userData,
      token,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Register endpoint
router.post("/register", async (req, res) => {
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const { v4: uuidv4 } = await import("uuid");
    const id = uuidv4();
    const now = new Date();

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

    // Generate JWT token
    const token = jwt.sign(
      {
        id,
        username,
        email,
        role,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    // Return user data (without password) and token
    const userResponse = await User.findOne({ id }).select("-password");

    res.status(201).json({
      user: userResponse,
      token,
      message: "Registration successful",
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Verify token endpoint
router.post("/verify", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    // Verify JWT token
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      );

      // Check if user still exists
      const user = await User.findOne({ id: decoded.id }).select("-password");

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json({
        valid: true,
        user,
        message: "Token is valid",
      });
    } catch (jwtError) {
      res.status(401).json({ error: "Invalid token" });
    }
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(500).json({ error: "Token verification failed" });
  }
});

// Refresh token endpoint
router.post("/refresh", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    // Verify current token
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      );

      // Check if user still exists
      const user = await User.findOne({ id: decoded.id });

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Generate new token
      const newToken = jwt.sign(
        {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" }
      );

      // Return user data (without password) and new token
      const { password: _, ...userData } = user.toObject();

      res.json({
        user: userData,
        token: newToken,
        message: "Token refreshed successfully",
      });
    } catch (jwtError) {
      res.status(401).json({ error: "Invalid token" });
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({ error: "Token refresh failed" });
  }
});

// Logout endpoint (client-side token removal)
router.post("/logout", async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // by removing the token from storage
    res.json({
      message: "Logout successful",
      note: "Please remove the token from client storage",
    });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

// Get current user profile
router.get("/profile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      );

      // Get user data
      const user = await User.findOne({ id: decoded.id }).select("-password");

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json({
        user,
        message: "Profile retrieved successfully",
      });
    } catch (jwtError) {
      res.status(401).json({ error: "Invalid token" });
    }
  } catch (error) {
    console.error("Error getting profile:", error);
    res.status(500).json({ error: "Failed to get profile" });
  }
});

// Change password endpoint
router.post("/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current password and new password are required" });
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      );

      // Get user with password
      const user = await User.findOne({ id: decoded.id });

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isValidPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await User.findOneAndUpdate(
        { id: user.id },
        { password: hashedNewPassword, updatedAt: new Date() }
      );

      res.json({
        message: "Password changed successfully",
      });
    } catch (jwtError) {
      res.status(401).json({ error: "Invalid token" });
    }
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

export default router;
