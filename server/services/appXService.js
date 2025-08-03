import User from "../models/User.js";
import Application from "../models/Application.js";
import Rights from "../models/Rights.js";
import { AppError } from "../middleware/errorHandler.js";

class AppXService {
  // Check if user exists
  async checkUser(userId) {
    const user = await User.findById(userId).select("-password").lean();

    if (!user) {
      return {
        exists: false,
        message: "User not found",
      };
    }

    return {
      exists: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    };
  }

  // Validate rights for an application
  async validateRights(userId, applicationId, permissions) {
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return {
        hasAccess: false,
        message: "User not found",
      };
    }

    // Check if application exists
    const application = await Application.findById(applicationId);
    if (!application) {
      return {
        hasAccess: false,
        message: "Application not found",
      };
    }

    // Check if application is active
    if (application.status !== "active") {
      return {
        hasAccess: false,
        message: "Application is not active",
      };
    }

    // Find rights for this user and application
    const rights = await Rights.findOne({
      accountId: userId,
      applicationId,
      status: "active",
    });

    if (!rights) {
      return {
        hasAccess: false,
        message: "No rights found for this user and application",
      };
    }

    // Check if rights are expired
    if (rights.expiresAt && new Date(rights.expiresAt) < new Date()) {
      return {
        hasAccess: false,
        message: "Rights have expired",
      };
    }

    // Check if all required permissions are granted
    const hasAllPermissions = permissions.every((permission) =>
      rights.permissions.includes(permission)
    );

    return {
      hasAccess: hasAllPermissions,
      message: hasAllPermissions
        ? "Access granted"
        : "Insufficient permissions",
      rights: hasAllPermissions ? rights : null,
    };
  }

  // Get user permissions for an application
  async getUserPermissions(userId, applicationId) {
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Check if application exists
    const application = await Application.findById(applicationId);
    if (!application) {
      throw new AppError("Application not found", 404);
    }

    // Find rights for this user and application
    const rights = await Rights.findOne({
      accountId: userId,
      applicationId,
      status: "active",
    });

    if (!rights) {
      return {
        hasAccess: false,
        permissions: [],
        message: "No rights found for this user and application",
      };
    }

    // Check if rights are expired
    if (rights.expiresAt && new Date(rights.expiresAt) < new Date()) {
      return {
        hasAccess: false,
        permissions: [],
        message: "Rights have expired",
      };
    }

    return {
      hasAccess: true,
      permissions: rights.permissions,
      expiresAt: rights.expiresAt,
      message: "Access granted",
    };
  }

  // Get user applications
  async getUserApplications(userId) {
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Find all rights for this user
    const rights = await Rights.find({
      accountId: userId,
      status: "active",
    }).populate("applicationId", "name description status");

    // Filter out expired rights
    const validRights = rights.filter((right) => {
      if (!right.expiresAt) return true;
      return new Date(right.expiresAt) > new Date();
    });

    // Group by application
    const applications = validRights.map((right) => ({
      applicationId: right.applicationId._id,
      applicationName: right.applicationId.name,
      applicationDescription: right.applicationId.description,
      applicationStatus: right.applicationId.status,
      permissions: right.permissions,
      expiresAt: right.expiresAt,
    }));

    return {
      userId,
      applications,
      totalApplications: applications.length,
    };
  }

  // Bulk validate rights
  async bulkValidateRights(requests) {
    const results = [];

    for (const request of requests) {
      const { userId, applicationId, permissions } = request;

      try {
        const result = await this.validateRights(
          userId,
          applicationId,
          permissions
        );
        results.push({
          userId,
          applicationId,
          permissions,
          ...result,
        });
      } catch (error) {
        results.push({
          userId,
          applicationId,
          permissions,
          hasAccess: false,
          message: error.message,
        });
      }
    }

    return {
      results,
      totalRequests: requests.length,
      successfulRequests: results.filter((r) => r.hasAccess).length,
    };
  }

  // Register application
  async registerApplication(applicationData) {
    const { name, description, apiKey } = applicationData;

    // Check if application with same name already exists
    const existingApplication = await Application.findOne({ name });
    if (existingApplication) {
      throw new AppError("Application with this name already exists", 400);
    }

    const application = new Application({
      name,
      description,
      apiKey,
      status: "active",
    });

    await application.save();

    return {
      id: application._id,
      name: application.name,
      description: application.description,
      status: application.status,
      createdAt: application.createdAt,
    };
  }

  // Get all registered applications
  async getAllApplications() {
    const applications = await Application.find({ status: "active" })
      .select("-apiKey")
      .lean();

    return applications.map((app) => ({
      id: app._id,
      name: app.name,
      description: app.description,
      status: app.status,
      createdAt: app.createdAt,
    }));
  }

  // Health check
  async healthCheck() {
    const [userCount, applicationCount, rightsCount] = await Promise.all([
      User.countDocuments(),
      Application.countDocuments(),
      Rights.countDocuments(),
    ]);

    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      stats: {
        users: userCount,
        applications: applicationCount,
        rights: rightsCount,
      },
    };
  }
}

export default new AppXService();
