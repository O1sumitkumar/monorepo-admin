import express from "express";
import accountSharingController from "../../controllers/accountSharingController.js";
import {
  validateAccountSharing,
  validateId,
} from "../../middleware/validation.js";
import { authV1 } from "../../middleware/auth-v1.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authV1);

// Get all account sharing records
router.get("/", accountSharingController.getAllAccountSharing);

// Get account sharing by ID
router.get("/:id", validateId, accountSharingController.getAccountSharingById);

// Create new account sharing
router.post(
  "/",
  validateAccountSharing,
  accountSharingController.createAccountSharing
);

// Update account sharing
router.put(
  "/:id",
  validateId,
  validateAccountSharing,
  accountSharingController.updateAccountSharing
);

// Delete account sharing
router.delete(
  "/:id",
  validateId,
  accountSharingController.deleteAccountSharing
);

export default router;
