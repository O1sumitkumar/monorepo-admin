import express from "express";
import { authenticateToken, requireAdmin } from "../../middleware/auth.js";
import {
  validateId,
  validatePagination,
  validateAccount,
  validateAccountPartial,
  sanitizeInput,
} from "../../middleware/validation.js";
import accountsController from "../../controllers/accountsController.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all accounts with pagination and search
router.get(
  "/",
  validatePagination,
  sanitizeInput,
  accountsController.getAllAccounts
);

// Get account by ID
router.get("/:id", validateId, accountsController.getAccountById);

// Create new account (admin only)
router.post(
  "/",
  requireAdmin,
  validateAccount,
  sanitizeInput,
  accountsController.createAccount
);

// Update account (admin only) - Use partial validation for updates
router.put(
  "/:id",
  requireAdmin,
  validateId,
  validateAccountPartial,
  sanitizeInput,
  accountsController.updateAccount
);

// Delete account (admin only)
router.delete(
  "/:id",
  requireAdmin,
  validateId,
  accountsController.deleteAccount
);

// Share account (admin only)
router.post(
  "/:id/share",
  requireAdmin,
  validateId,
  accountsController.shareAccount
);

// Get account statistics
router.get("/stats/overview", accountsController.getAccountStats);

export default router;
