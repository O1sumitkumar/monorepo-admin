import rightsService from "../services/rightsService.js";
import { catchAsync } from "../middleware/errorHandler.js";

class RightsController {
  // Get all rights with pagination and search
  getAllRights = catchAsync(async (req, res) => {
    console.log("🎯 [RIGHTS CONTROLLER] getAllRights called with:", {
      query: req.query,
      params: req.params,
      path: req.path,
      method: req.method,
    });

    const { page = 1, limit = 10, search = "" } = req.query;

    console.log(
      "📊 [RIGHTS CONTROLLER] Calling rightsService.getAllRights with:",
      {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
      }
    );

    const result = await rightsService.getAllRights(
      parseInt(page),
      parseInt(limit),
      search
    );

    console.log("✅ [RIGHTS CONTROLLER] rightsService.getAllRights returned:", {
      rightsCount: result.rights?.length || 0,
      pagination: result.pagination,
    });

    res.status(200).json({
      success: true,
      data: result.rights,
      pagination: result.pagination,
    });
  });

  // Get rights by ID
  getRightsById = catchAsync(async (req, res) => {
    console.log(
      "🎯 [RIGHTS CONTROLLER] getRightsById called with ID:",
      req.params.id
    );

    const { id } = req.params;

    const rights = await rightsService.getRightsById(id);

    res.status(200).json({
      success: true,
      data: rights,
    });
  });

  // Create new rights
  createRights = catchAsync(async (req, res) => {
    console.log(
      "🎯 [RIGHTS CONTROLLER] createRights called with data:",
      req.body
    );

    const rightsData = req.body;

    const rights = await rightsService.createRights(rightsData);

    res.status(201).json({
      success: true,
      message: "Rights created successfully",
      data: rights,
    });
  });

  // Update rights
  updateRights = catchAsync(async (req, res) => {
    console.log(
      "🎯 [RIGHTS CONTROLLER] updateRights called with ID:",
      req.params.id
    );

    const { id } = req.params;
    const updateData = req.body;

    const rights = await rightsService.updateRights(id, updateData);

    res.status(200).json({
      success: true,
      message: "Rights updated successfully",
      data: rights,
    });
  });

  // Delete rights
  deleteRights = catchAsync(async (req, res) => {
    console.log(
      "🎯 [RIGHTS CONTROLLER] deleteRights called with ID:",
      req.params.id
    );

    const { id } = req.params;

    await rightsService.deleteRights(id);

    res.status(200).json({
      success: true,
      message: "Rights deleted successfully",
    });
  });

  // Verify rights
  verifyRights = catchAsync(async (req, res) => {
    console.log("🎯 [RIGHTS CONTROLLER] verifyRights called with:", req.body);

    const { applicationId, accountId, permissions } = req.body;

    const result = await rightsService.verifyRights(
      applicationId,
      accountId,
      permissions
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  // Get rights statistics
  getRightsStats = catchAsync(async (req, res) => {
    console.log("🎯 [RIGHTS CONTROLLER] getRightsStats called");

    const stats = await rightsService.getRightsStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  });
}

export default new RightsController();
