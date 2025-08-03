import appXService from "../services/appXService.js";
import { catchAsync } from "../middleware/errorHandler.js";

class AppXController {
  // Check if user exists
  checkUser = catchAsync(async (req, res) => {
    const { userId } = req.body;

    const result = await appXService.checkUser(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  // Validate rights for an application
  validateRights = catchAsync(async (req, res) => {
    const { userId, applicationId, permissions } = req.body;

    const result = await appXService.validateRights(
      userId,
      applicationId,
      permissions
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  // Get user permissions for an application
  getUserPermissions = catchAsync(async (req, res) => {
    const { userId, applicationId } = req.params;

    const result = await appXService.getUserPermissions(userId, applicationId);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  // Get user applications
  getUserApplications = catchAsync(async (req, res) => {
    const { userId } = req.params;

    const result = await appXService.getUserApplications(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  // Bulk validate rights
  bulkValidateRights = catchAsync(async (req, res) => {
    const { requests } = req.body;

    const result = await appXService.bulkValidateRights(requests);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  // Register application
  registerApplication = catchAsync(async (req, res) => {
    const applicationData = req.body;

    const result = await appXService.registerApplication(applicationData);

    res.status(201).json({
      success: true,
      message: "Application registered successfully",
      data: result,
    });
  });

  // Get all registered applications
  getAllApplications = catchAsync(async (req, res) => {
    const result = await appXService.getAllApplications();

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  // Health check
  healthCheck = catchAsync(async (req, res) => {
    const result = await appXService.healthCheck();

    res.status(200).json({
      success: true,
      data: result,
    });
  });
}

export default new AppXController();
