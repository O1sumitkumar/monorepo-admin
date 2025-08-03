import Rights from "../models/Rights.js";
import Application from "../models/Application.js";
import Account from "../models/Account.js";
import { AppError } from "../middleware/errorHandler.js";

class RightsService {
  // Get all rights with pagination and search
  async getAllRights(page = 1, limit = 10, search = "") {
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { applicationName: { $regex: search, $options: "i" } },
          { accountName: { $regex: search, $options: "i" } },
        ],
      };
    }

    const [rights, total] = await Promise.all([
      Rights.find(query)
        .populate("applicationId", "name status")
        .populate("accountId", "name email status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Rights.countDocuments(query),
    ]);

    // Transform the data to include application and account names
    const transformedRights = rights.map((right) => ({
      id: right._id,
      applicationId: right.applicationId._id,
      applicationName: right.applicationId.name,
      accountId: right.accountId._id,
      accountName: right.accountId.name,
      permissions: right.permissions,
      expiresAt: right.expiresAt,
      status: right.status,
      createdAt: right.createdAt,
      updatedAt: right.updatedAt,
    }));

    return {
      rights: transformedRights,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get rights by ID
  async getRightsById(id) {
    const rights = await Rights.findById(id)
      .populate("applicationId", "name status")
      .populate("accountId", "name email status")
      .lean();

    if (!rights) {
      throw new AppError("Rights not found", 404);
    }

    return {
      id: rights._id,
      applicationId: rights.applicationId._id,
      applicationName: rights.applicationId.name,
      accountId: rights.accountId._id,
      accountName: rights.accountId.name,
      permissions: rights.permissions,
      expiresAt: rights.expiresAt,
      status: rights.status,
      createdAt: rights.createdAt,
      updatedAt: rights.updatedAt,
    };
  }

  // Create new rights
  async createRights(rightsData) {
    const { applicationId, accountId, permissions, expiresAt } = rightsData;

    // Validate application exists
    const application = await Application.findById(applicationId);
    if (!application) {
      throw new AppError("Application not found", 404);
    }

    // Validate account exists
    const account = await Account.findById(accountId);
    if (!account) {
      throw new AppError("Account not found", 404);
    }

    // Validate permissions
    const validPermissions = ["read", "write", "admin", "owner"];
    const invalidPermissions = permissions.filter(
      (p) => !validPermissions.includes(p)
    );
    if (invalidPermissions.length > 0) {
      throw new AppError(
        `Invalid permissions: ${invalidPermissions.join(", ")}`,
        400
      );
    }

    // Check if rights already exist for this application and account combination
    const existingRights = await Rights.findOne({ applicationId, accountId });
    if (existingRights) {
      throw new AppError(
        "Rights already exist for this application and account combination. Each account can have only one rights record per application.",
        400
      );
    }

    // Determine status based on expiration
    let status = "active";
    if (expiresAt && new Date(expiresAt) < new Date()) {
      status = "expired";
    }

    const rights = new Rights({
      applicationId,
      accountId,
      permissions,
      expiresAt: expiresAt || null,
      status,
    });

    await rights.save();

    return this.getRightsById(rights._id);
  }

  // Update rights
  async updateRights(id, updateData) {
    const rights = await Rights.findById(id);
    if (!rights) {
      throw new AppError("Rights not found", 404);
    }

    const { applicationId, accountId, permissions, expiresAt } = updateData;

    // Validate application exists if provided
    if (applicationId) {
      const application = await Application.findById(applicationId);
      if (!application) {
        throw new AppError("Application not found", 404);
      }
    }

    // Validate account exists if provided
    if (accountId) {
      const account = await Account.findById(accountId);
      if (!account) {
        throw new AppError("Account not found", 404);
      }
    }

    // Determine status based on expiration
    let status = rights.status;
    if (expiresAt !== undefined) {
      if (expiresAt && new Date(expiresAt) < new Date()) {
        status = "expired";
      } else if (
        rights.status === "expired" &&
        expiresAt &&
        new Date(expiresAt) > new Date()
      ) {
        status = "active";
      }
    }

    const updatedRights = await Rights.findByIdAndUpdate(
      id,
      {
        ...updateData,
        status,
        updatedAt: new Date(),
      },
      { new: true }
    );

    return this.getRightsById(updatedRights._id);
  }

  // Delete rights
  async deleteRights(id) {
    const rights = await Rights.findById(id);
    if (!rights) {
      throw new AppError("Rights not found", 404);
    }

    await Rights.findByIdAndDelete(id);
  }

  // Verify rights
  async verifyRights(applicationId, accountId, permissions) {
    const rights = await Rights.findOne({
      applicationId,
      accountId,
      status: "active",
    });

    if (!rights) {
      return {
        hasAccess: false,
        message: "No rights found for this application and account",
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

  // Get rights statistics
  async getRightsStats() {
    const [totalRights, activeRights, expiredRights, rightsByApplication] =
      await Promise.all([
        Rights.countDocuments(),
        Rights.countDocuments({ status: "active" }),
        Rights.countDocuments({ status: "expired" }),
        Rights.aggregate([
          {
            $lookup: {
              from: "applications",
              localField: "applicationId",
              foreignField: "_id",
              as: "application",
            },
          },
          {
            $group: {
              _id: "$applicationId",
              count: { $sum: 1 },
              applicationName: { $first: "$application.name" },
            },
          },
          { $sort: { count: -1 } },
        ]),
      ]);

    return {
      total: totalRights,
      active: activeRights,
      expired: expiredRights,
      byApplication: rightsByApplication,
    };
  }
}

export default new RightsService();
