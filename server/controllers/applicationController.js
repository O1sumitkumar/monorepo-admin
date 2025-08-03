import applicationService from "../services/applicationService.js";
import { catchAsync } from "../middleware/errorHandler.js";

class ApplicationController {
  // Get all applications
  getAllApplications = catchAsync(async (req, res) => {
    const { page = 1, limit = 10, search = "" } = req.query;

    const result = await applicationService.getAllApplications(
      parseInt(page),
      parseInt(limit),
      search
    );

    res.status(200).json({
      success: true,
      data: result.applications,
      pagination: result.pagination,
    });
  });

  // Get application by ID
  getApplicationById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const application = await applicationService.getApplicationById(id);

    res.status(200).json({
      success: true,
      data: application,
    });
  });

  // Create new application
  createApplication = catchAsync(async (req, res) => {
    const applicationData = req.body;

    const application = await applicationService.createApplication(
      applicationData
    );

    res.status(201).json({
      success: true,
      message: "Application created successfully",
      data: application,
    });
  });

  // Update application
  updateApplication = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const application = await applicationService.updateApplication(
      id,
      updateData
    );

    res.status(200).json({
      success: true,
      message: "Application updated successfully",
      data: application,
    });
  });

  // Delete application
  deleteApplication = catchAsync(async (req, res) => {
    const { id } = req.params;

    await applicationService.deleteApplication(id);

    res.status(200).json({
      success: true,
      message: "Application deleted successfully",
    });
  });

  // Toggle application status
  toggleApplicationStatus = catchAsync(async (req, res) => {
    const { id } = req.params;

    const application = await applicationService.toggleApplicationStatus(id);

    res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      data: application,
    });
  });

  // Get application statistics
  getApplicationStats = catchAsync(async (req, res) => {
    const stats = await applicationService.getApplicationStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  });

  // Get applications with rights count
  getApplicationsWithRightsCount = catchAsync(async (req, res) => {
    const applications =
      await applicationService.getApplicationsWithRightsCount();

    res.status(200).json({
      success: true,
      data: applications,
    });
  });

  // Get active applications
  getActiveApplications = catchAsync(async (req, res) => {
    const applications = await applicationService.getActiveApplications();

    res.status(200).json({
      success: true,
      data: applications,
    });
  });
}

export default new ApplicationController();
