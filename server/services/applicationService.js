import Application from "../models/Application.js";
import Rights from "../models/Rights.js";
import { AppError } from "../middleware/errorHandler.js";

class ApplicationService {
  // Get all applications with pagination and search
  async getAllApplications(page = 1, limit = 10, search = "") {
    try {
      const skip = (page - 1) * limit;
      const query = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { applicationId: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      const [applications, total] = await Promise.all([
        Application.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Application.countDocuments(query),
      ]);

      // Transform the data to include id field
      const transformedApplications = applications.map((app) => ({
        id: app._id,
        name: app.name,
        applicationId: app.applicationId,
        description: app.description,
        status: app.status,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        applications: transformedApplications,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new AppError("Failed to fetch applications", 500);
    }
  }

  // Get application by ID
  async getApplicationById(id) {
    try {
      const application = await Application.findById(id).lean();
      if (!application) {
        throw new AppError("Application not found", 404);
      }

      return {
        id: application._id,
        name: application.name,
        applicationId: application.applicationId,
        description: application.description,
        status: application.status,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to fetch application", 500);
    }
  }

  // Create new application
  async createApplication(applicationData) {
    try {
      // Check if application with same applicationId already exists
      const existingApplication = await Application.findOne({
        applicationId: applicationData.applicationId,
      });

      if (existingApplication) {
        throw new AppError("Application with this ID already exists", 400);
      }

      const application = new Application(applicationData);
      await application.save();

      return this.getApplicationById(application._id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to create application", 500);
    }
  }

  // Update application
  async updateApplication(id, updateData) {
    try {
      const application = await Application.findById(id);
      if (!application) {
        throw new AppError("Application not found", 404);
      }

      // Check if new applicationId conflicts with existing one
      if (
        updateData.applicationId &&
        updateData.applicationId !== application.applicationId
      ) {
        const existingApplication = await Application.findOne({
          applicationId: updateData.applicationId,
        });

        if (existingApplication) {
          throw new AppError("Application with this ID already exists", 400);
        }
      }

      const updatedApplication = await Application.findByIdAndUpdate(
        id,
        {
          ...updateData,
          updatedAt: new Date(),
        },
        { new: true }
      );

      return this.getApplicationById(updatedApplication._id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to update application", 500);
    }
  }

  // Delete application
  async deleteApplication(id) {
    try {
      const application = await Application.findById(id);
      if (!application) {
        throw new AppError("Application not found", 404);
      }

      // Check if application has associated rights
      const rightsCount = await Rights.countDocuments({ applicationId: id });
      if (rightsCount > 0) {
        throw new AppError(
          "Cannot delete application with associated rights",
          400
        );
      }

      await Application.findByIdAndDelete(id);
      return { message: "Application deleted successfully" };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to delete application", 500);
    }
  }

  // Toggle application status
  async toggleApplicationStatus(id) {
    try {
      const application = await Application.findById(id);
      if (!application) {
        throw new AppError("Application not found", 404);
      }

      await application.toggleStatus();
      return this.getApplicationById(application._id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to toggle application status", 500);
    }
  }

  // Get application statistics
  async getApplicationStats() {
    try {
      const [totalApplications, activeApplications, inactiveApplications] =
        await Promise.all([
          Application.countDocuments(),
          Application.countDocuments({ status: "active" }),
          Application.countDocuments({ status: "inactive" }),
        ]);

      return {
        total: totalApplications,
        active: activeApplications,
        inactive: inactiveApplications,
      };
    } catch (error) {
      throw new AppError("Failed to fetch application statistics", 500);
    }
  }

  // Get applications with rights count
  async getApplicationsWithRightsCount() {
    try {
      const applications = await Application.aggregate([
        {
          $lookup: {
            from: "rights",
            localField: "id",
            foreignField: "applicationId",
            as: "rights",
          },
        },
        {
          $addFields: {
            rightsCount: { $size: "$rights" },
          },
        },
        {
          $project: {
            rights: 0,
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ]);

      return applications;
    } catch (error) {
      throw new AppError("Failed to fetch applications with rights count", 500);
    }
  }

  // Get active applications only
  async getActiveApplications() {
    try {
      return await Application.getActiveApplications();
    } catch (error) {
      throw new AppError("Failed to fetch active applications", 500);
    }
  }
}

export default new ApplicationService();
