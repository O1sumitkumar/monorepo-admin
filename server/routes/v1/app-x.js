import express from "express";
import appXController from "../../controllers/appXController.js";

const router = express.Router();

// Check if user exists
router.post("/check-user", appXController.checkUser);

// Validate rights for an application
router.post("/validate-rights", appXController.validateRights);

// Get user permissions for an application
router.get(
  "/user/:userId/application/:applicationId/permissions",
  appXController.getUserPermissions
);

// Get user applications
router.get("/user/:userId/applications", appXController.getUserApplications);

// Bulk validate rights
router.post("/bulk-validate", appXController.bulkValidateRights);

// Register application
router.post("/register-application", appXController.registerApplication);

// Get all registered applications
router.get("/applications", appXController.getAllApplications);

// Health check
router.get("/health", appXController.healthCheck);

export default router;
