import express from "express";
import applicationController from "../../controllers/applicationController.js";
import { authenticateToken, requireAdmin } from "../../middleware/auth.js";
import {
  validateApplication,
  validateId,
  validatePagination,
  sanitizeInput,
} from "../../middleware/validation.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all applications with pagination and search
router.get(
  "/",
  validatePagination,
  sanitizeInput,
  applicationController.getAllApplications
);

// Get application by ID
router.get("/:id", validateId, applicationController.getApplicationById);

// Create new application (admin only)
router.post(
  "/",
  requireAdmin,
  validateApplication,
  sanitizeInput,
  applicationController.createApplication
);

// Update application (admin only)
router.put(
  "/:id",
  requireAdmin,
  validateId,
  validateApplication,
  sanitizeInput,
  applicationController.updateApplication
);

// Delete application (admin only)
router.delete(
  "/:id",
  requireAdmin,
  validateId,
  applicationController.deleteApplication
);

// Toggle application status (admin only)
router.patch(
  "/:id/toggle-status",
  requireAdmin,
  validateId,
  applicationController.toggleApplicationStatus
);

// Get application statistics
router.get("/stats/overview", applicationController.getApplicationStats);

// Get applications with rights count
router.get(
  "/stats/with-rights",
  applicationController.getApplicationsWithRightsCount
);

// Get active applications only
router.get("/active/list", applicationController.getActiveApplications);

export default router;
