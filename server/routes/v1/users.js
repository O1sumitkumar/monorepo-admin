import express from "express";
import { authenticateToken, requireAdmin } from "../../middleware/auth.js";
import {
  validateId,
  validatePagination,
  sanitizeInput,
} from "../../middleware/validation.js";
import usersController from "../../controllers/usersController.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all users with pagination and search
router.get("/", validatePagination, sanitizeInput, usersController.getAllUsers);

// Get user by ID
router.get("/:id", validateId, usersController.getUserById);

// Create new user (admin only)
router.post("/", requireAdmin, sanitizeInput, usersController.createUser);

// Update user (admin only)
router.put(
  "/:id",
  requireAdmin,
  validateId,
  sanitizeInput,
  usersController.updateUser
);

// Delete user (admin only)
router.delete("/:id", requireAdmin, validateId, usersController.deleteUser);

// Get user statistics
router.get("/stats/overview", usersController.getUserStats);

export default router;
