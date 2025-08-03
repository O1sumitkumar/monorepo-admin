import express from "express";
import automatedRightsController from "../../controllers/automatedRightsController.js";
import { validateAutomatedRights } from "../../middleware/validation.js";
import { authV2 } from "../../middleware/auth-v2.js";
import { authV1 } from "../../middleware/auth-v1.js";

const router = express.Router();

// V2 Keycloak endpoints (for external applications)
router.post(
  "/keycloak/check-and-create",
  authV2,
  automatedRightsController.checkAndCreateRightsWithKeycloak
);
router.post(
  "/keycloak/check-permissions",
  authV2,
  automatedRightsController.checkUserPermissionsWithKeycloak
);
router.put(
  "/keycloak/update-permissions",
  authV2,
  automatedRightsController.updatePermissionsWithKeycloak
);
router.get(
  "/keycloak/user/applications",
  authV2,
  automatedRightsController.getUserApplicationsWithKeycloak
);

// V1 Legacy endpoints (for admin panel)
router.post(
  "/check-and-create",
  authV1,
  validateAutomatedRights,
  automatedRightsController.checkAndCreateRights
);
router.post(
  "/check-permissions",
  authV1,
  validateAutomatedRights,
  automatedRightsController.checkUserPermissions
);
router.put(
  "/update-permissions",
  authV1,
  validateAutomatedRights,
  automatedRightsController.updatePermissions
);
router.get(
  "/user/applications",
  authV1,
  automatedRightsController.getUserApplications
);

export default router;
