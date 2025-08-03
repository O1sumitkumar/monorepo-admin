import express from "express";
import { authenticateToken, requireAdmin } from "../../middleware/auth.js";
import {
  validateId,
  validatePagination,
  validateRights,
  sanitizeInput,
} from "../../middleware/validation.js";
import rightsController from "../../controllers/rightsController.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all rights with pagination and search (BASE ROUTE - must come first)
router.get(
  "/",
  validatePagination,
  sanitizeInput,
  rightsController.getAllRights
);

// Create new rights (admin only) (BASE ROUTE - must come first)
router.post(
  "/",
  requireAdmin,
  validateRights,
  sanitizeInput,
  rightsController.createRights
);

// Verify rights (specific route)
router.post("/verify", rightsController.verifyRights);

// Get rights statistics (specific route)
router.get("/stats/overview", rightsController.getRightsStats);

// Get rights by ID (parameterized route - must come last)
router.get("/:id", validateId, rightsController.getRightsById);

// Update rights (admin only) (parameterized route)
router.put(
  "/:id",
  requireAdmin,
  validateId,
  validateRights,
  sanitizeInput,
  rightsController.updateRights
);

// Delete rights (admin only) (parameterized route)
router.delete("/:id", requireAdmin, validateId, rightsController.deleteRights);

export default router;
