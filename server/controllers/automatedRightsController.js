import automatedRightsService from "../services/automatedRightsService.js";
import { catchAsync } from "../middleware/errorHandler.js";
import { keycloakAuth } from "../middleware/keycloakAuth.js";

class AutomatedRightsController {
  // Check and create rights for external application with Keycloak JWT
  checkAndCreateRightsWithKeycloak = catchAsync(async (req, res) => {
    const { applicationId, accountId } = req.body;
    const keycloakToken = req.headers.authorization?.substring(7); // Remove "Bearer "

    if (!keycloakToken) {
      return res.status(400).json({
        success: false,
        message: "Keycloak JWT token is required",
      });
    }

    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: "applicationId is required",
      });
    }

    const result =
      await automatedRightsService.checkAndCreateRightsWithKeycloak(
        keycloakToken,
        applicationId,
        accountId
      );

    res.status(200).json(result);
  });

  // Check user permissions for specific application with Keycloak JWT
  checkUserPermissionsWithKeycloak = catchAsync(async (req, res) => {
    const { applicationId } = req.body;
    const keycloakToken = req.headers.authorization?.substring(7);

    if (!keycloakToken) {
      return res.status(400).json({
        success: false,
        message: "Keycloak JWT token is required",
      });
    }

    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: "applicationId is required",
      });
    }

    const result =
      await automatedRightsService.checkUserPermissionsWithKeycloak(
        keycloakToken,
        applicationId
      );

    res.status(200).json(result);
  });

  // Update permissions for existing rights with Keycloak JWT
  updatePermissionsWithKeycloak = catchAsync(async (req, res) => {
    const { applicationId, permissions } = req.body;
    const keycloakToken = req.headers.authorization?.substring(7);

    if (!keycloakToken) {
      return res.status(400).json({
        success: false,
        message: "Keycloak JWT token is required",
      });
    }

    if (!applicationId || !permissions) {
      return res.status(400).json({
        success: false,
        message: "applicationId and permissions are required",
      });
    }

    const result = await automatedRightsService.updatePermissionsWithKeycloak(
      keycloakToken,
      applicationId,
      permissions
    );

    res.status(200).json(result);
  });

  // Get all applications for a user with Keycloak JWT
  getUserApplicationsWithKeycloak = catchAsync(async (req, res) => {
    const keycloakToken = req.headers.authorization?.substring(7);

    if (!keycloakToken) {
      return res.status(400).json({
        success: false,
        message: "Keycloak JWT token is required",
      });
    }

    const result = await automatedRightsService.getUserApplicationsWithKeycloak(
      keycloakToken
    );

    res.status(200).json(result);
  });

  // Legacy methods for backward compatibility
  checkAndCreateRights = catchAsync(async (req, res) => {
    const { userId, applicationId, accountId } = req.body;

    if (!userId || !applicationId) {
      return res.status(400).json({
        success: false,
        message: "userId and applicationId are required",
      });
    }

    const result = await automatedRightsService.checkAndCreateRights(
      userId,
      applicationId,
      accountId
    );

    res.status(200).json(result);
  });

  checkUserPermissions = catchAsync(async (req, res) => {
    const { userId, applicationId } = req.body;

    if (!userId || !applicationId) {
      return res.status(400).json({
        success: false,
        message: "userId and applicationId are required",
      });
    }

    const result = await automatedRightsService.checkUserPermissions(
      userId,
      applicationId
    );

    res.status(200).json(result);
  });

  updatePermissions = catchAsync(async (req, res) => {
    const { userId, applicationId, permissions } = req.body;

    if (!userId || !applicationId || !permissions) {
      return res.status(400).json({
        success: false,
        message: "userId, applicationId, and permissions are required",
      });
    }

    const result = await automatedRightsService.updatePermissions(
      userId,
      applicationId,
      permissions
    );

    res.status(200).json(result);
  });

  getUserApplications = catchAsync(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const result = await automatedRightsService.getUserApplications(userId);

    res.status(200).json(result);
  });
}

export default new AutomatedRightsController();
