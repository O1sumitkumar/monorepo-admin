import Rights from "../models/Rights.js";
import Application from "../models/Application.js";
import Account from "../models/Account.js";
import User from "../models/User.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  verifyKeycloakTokenV2,
  extractUserInfoV2,
} from "../middleware/auth-v2.js";

class AutomatedRightsService {
  // Check and create rights for external application request with Keycloak JWT
  async checkAndCreateRightsWithKeycloak(
    keycloakToken,
    applicationId,
    accountId = null
  ) {
    try {
      // Step 1: Verify Keycloak JWT token
      const decodedToken = await verifyKeycloakTokenV2(keycloakToken);
      const keycloakUserInfo = extractUserInfoV2(decodedToken);

      console.log("🔍 [AUTOMATED] Keycloak user info:", {
        userId: keycloakUserInfo.userId,
        username: keycloakUserInfo.username,
        email: keycloakUserInfo.email,
      });

      // Step 2: Validate application exists
      const application = await Application.findById(applicationId);
      if (!application) {
        throw new AppError("Application not found", 404);
      }

      // Step 3: Find or create user in admin system based on Keycloak user
      let user = await User.findOne({
        $or: [
          { email: keycloakUserInfo.email },
          { username: keycloakUserInfo.username },
          { keycloakId: keycloakUserInfo.userId },
        ],
      });

      if (!user) {
        // Create new user in admin system
        console.log("👤 [AUTOMATED] Creating new user from Keycloak");

        // Get or create account for the user
        let account = await Account.findOne({ email: keycloakUserInfo.email });
        if (!account) {
          account = await Account.create({
            name:
              `${keycloakUserInfo.firstName || ""} ${
                keycloakUserInfo.lastName || ""
              }`.trim() || keycloakUserInfo.username,
            accountId: `keycloak-${keycloakUserInfo.userId}`,
            email: keycloakUserInfo.email,
            description: `Account created from Keycloak for ${keycloakUserInfo.username}`,
            accountType: "Personal",
            status: "active",
            sharedAccounts: [],
          });
        }

        // Create user
        user = await User.create({
          username: keycloakUserInfo.username,
          email: keycloakUserInfo.email,
          password: "keycloak-user", // Placeholder, not used for Keycloak users
          role: "user",
          status: "active",
          accountId: account._id,
          keycloakId: keycloakUserInfo.userId, // Store Keycloak ID for future reference
        });

        console.log("✅ [AUTOMATED] Created new user:", user.username);
      }

      // Use provided accountId or user's accountId
      const targetAccountId = accountId || user.accountId;

      // Step 4: Check if rights already exist
      const existingRights = await Rights.findOne({
        applicationId,
        accountId: targetAccountId,
      });

      if (existingRights) {
        // Rights exist, return them
        console.log("✅ [AUTOMATED] Existing rights found for user");
        return {
          success: true,
          data: {
            rightsCode: existingRights.rightsCode,
            permissions: existingRights.permissions,
            status: existingRights.status,
            expiresAt: existingRights.expiresAt,
            applicationName: application.name,
            accountName: user.accountId.name || user.username,
            keycloakUserId: keycloakUserInfo.userId,
          },
          message: "Existing rights found",
        };
      }

      // Step 5: Create new rights with empty permissions
      console.log("🆕 [AUTOMATED] Creating new rights with empty permissions");
      const newRights = new Rights({
        applicationId,
        accountId: targetAccountId,
        permissions: [], // Empty permissions array
        status: "active",
      });

      await newRights.save();

      // Step 6: Return the new rights
      return {
        success: true,
        data: {
          rightsCode: newRights.rightsCode,
          permissions: newRights.permissions,
          status: newRights.status,
          expiresAt: newRights.expiresAt,
          applicationName: application.name,
          accountName: user.accountId.name || user.username,
          keycloakUserId: keycloakUserInfo.userId,
        },
        message: "New rights created with no permissions",
      };
    } catch (error) {
      console.error("❌ [AUTOMATED] Rights check failed:", error.message);
      throw new AppError(
        `Automated rights check failed: ${error.message}`,
        error.statusCode || 500
      );
    }
  }

  // Check user permissions for specific application using Keycloak JWT
  async checkUserPermissionsWithKeycloak(keycloakToken, applicationId) {
    try {
      // Verify Keycloak JWT token
      const decodedToken = await verifyKeycloakTokenV2(keycloakToken);
      const keycloakUserInfo = extractUserInfoV2(decodedToken);

      // Find user in admin system
      const user = await User.findOne({
        $or: [
          { email: keycloakUserInfo.email },
          { username: keycloakUserInfo.username },
          { keycloakId: keycloakUserInfo.userId },
        ],
      }).populate("accountId");

      if (!user) {
        return {
          success: true,
          data: {
            hasAccess: false,
            permissions: [],
            message: "User not found in admin system",
            keycloakUserId: keycloakUserInfo.userId,
          },
        };
      }

      // Check if rights exist
      const rights = await Rights.findOne({
        applicationId,
        accountId: user.accountId._id,
      }).populate("applicationId");

      if (!rights) {
        return {
          success: true,
          data: {
            hasAccess: false,
            permissions: [],
            message: "No rights found for this user and application",
            keycloakUserId: keycloakUserInfo.userId,
          },
        };
      }

      return {
        success: true,
        data: {
          hasAccess: rights.status === "active",
          permissions: rights.permissions,
          rightsCode: rights.rightsCode,
          status: rights.status,
          expiresAt: rights.expiresAt,
          applicationName: rights.applicationId.name,
          accountName: user.accountId.name || user.username,
          keycloakUserId: keycloakUserInfo.userId,
        },
      };
    } catch (error) {
      console.error("❌ [AUTOMATED] Permission check failed:", error.message);
      throw new AppError(
        `Permission check failed: ${error.message}`,
        error.statusCode || 500
      );
    }
  }

  // Update permissions for existing rights using Keycloak JWT
  async updatePermissionsWithKeycloak(
    keycloakToken,
    applicationId,
    permissions
  ) {
    try {
      // Verify Keycloak JWT token
      const decodedToken = await verifyKeycloakTokenV2(keycloakToken);
      const keycloakUserInfo = extractUserInfoV2(decodedToken);

      // Find user in admin system
      const user = await User.findOne({
        $or: [
          { email: keycloakUserInfo.email },
          { username: keycloakUserInfo.username },
          { keycloakId: keycloakUserInfo.userId },
        ],
      }).populate("accountId");

      if (!user) {
        throw new AppError("User not found in admin system", 404);
      }

      // Find existing rights
      const rights = await Rights.findOne({
        applicationId,
        accountId: user.accountId._id,
      });

      if (!rights) {
        throw new AppError(
          "Rights not found for this user and application",
          404
        );
      }

      // Update permissions
      rights.permissions = permissions;
      await rights.save();

      console.log(
        "✅ [AUTOMATED] Permissions updated for user:",
        user.username
      );

      return {
        success: true,
        data: {
          rightsCode: rights.rightsCode,
          permissions: rights.permissions,
          status: rights.status,
          message: "Permissions updated successfully",
          keycloakUserId: keycloakUserInfo.userId,
        },
      };
    } catch (error) {
      console.error("❌ [AUTOMATED] Permission update failed:", error.message);
      throw new AppError(
        `Permission update failed: ${error.message}`,
        error.statusCode || 500
      );
    }
  }

  // Get all applications for a user using Keycloak JWT
  async getUserApplicationsWithKeycloak(keycloakToken) {
    try {
      // Verify Keycloak JWT token
      const decodedToken = await verifyKeycloakTokenV2(keycloakToken);
      const keycloakUserInfo = extractUserInfoV2(decodedToken);

      // Find user in admin system
      const user = await User.findOne({
        $or: [
          { email: keycloakUserInfo.email },
          { username: keycloakUserInfo.username },
          { keycloakId: keycloakUserInfo.userId },
        ],
      }).populate("accountId");

      if (!user) {
        return {
          success: true,
          data: [],
          message: "User not found in admin system",
          keycloakUserId: keycloakUserInfo.userId,
        };
      }

      // Get all rights for this user's account
      const rights = await Rights.find({
        accountId: user.accountId._id,
      }).populate("applicationId");

      const applications = rights.map((right) => ({
        applicationId: right.applicationId._id,
        applicationName: right.applicationId.name,
        permissions: right.permissions,
        status: right.status,
        rightsCode: right.rightsCode,
        expiresAt: right.expiresAt,
      }));

      return {
        success: true,
        data: applications,
        message: `Found ${applications.length} applications for user`,
        keycloakUserId: keycloakUserInfo.userId,
      };
    } catch (error) {
      console.error(
        "❌ [AUTOMATED] Failed to get user applications:",
        error.message
      );
      throw new AppError(
        `Failed to get user applications: ${error.message}`,
        error.statusCode || 500
      );
    }
  }

  // Legacy methods for backward compatibility
  async checkAndCreateRights(userId, applicationId, accountId = null) {
    try {
      // Step 1: Validate application exists
      const application = await Application.findById(applicationId);
      if (!application) {
        throw new AppError("Application not found", 404);
      }

      // Step 2: Find user and get their account
      const user = await User.findById(userId).populate("accountId");
      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Use provided accountId or user's accountId
      const targetAccountId = accountId || user.accountId._id;

      // Step 3: Check if rights already exist
      const existingRights = await Rights.findOne({
        applicationId,
        accountId: targetAccountId,
      });

      if (existingRights) {
        // Rights exist, return them
        return {
          success: true,
          data: {
            rightsCode: existingRights.rightsCode,
            permissions: existingRights.permissions,
            status: existingRights.status,
            expiresAt: existingRights.expiresAt,
            applicationName: application.name,
            accountName: user.accountId.name,
          },
          message: "Existing rights found",
        };
      }

      // Step 4: Create new rights with empty permissions
      const newRights = new Rights({
        applicationId,
        accountId: targetAccountId,
        permissions: [], // Empty permissions array
        status: "active",
      });

      await newRights.save();

      // Step 5: Return the new rights
      return {
        success: true,
        data: {
          rightsCode: newRights.rightsCode,
          permissions: newRights.permissions,
          status: newRights.status,
          expiresAt: newRights.expiresAt,
          applicationName: application.name,
          accountName: user.accountId.name,
        },
        message: "New rights created with no permissions",
      };
    } catch (error) {
      throw new AppError(
        `Automated rights check failed: ${error.message}`,
        error.statusCode || 500
      );
    }
  }

  // Check user permissions for specific application
  async checkUserPermissions(userId, applicationId) {
    try {
      // Find user and get their account
      const user = await User.findById(userId).populate("accountId");
      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Check if rights exist
      const rights = await Rights.findOne({
        applicationId,
        accountId: user.accountId._id,
      }).populate("applicationId");

      if (!rights) {
        return {
          success: true,
          data: {
            hasAccess: false,
            permissions: [],
            message: "No rights found for this user and application",
          },
        };
      }

      return {
        success: true,
        data: {
          hasAccess: rights.status === "active",
          permissions: rights.permissions,
          rightsCode: rights.rightsCode,
          status: rights.status,
          expiresAt: rights.expiresAt,
          applicationName: rights.applicationId.name,
          accountName: user.accountId.name,
        },
      };
    } catch (error) {
      throw new AppError(
        `Permission check failed: ${error.message}`,
        error.statusCode || 500
      );
    }
  }

  // Update permissions for existing rights
  async updatePermissions(userId, applicationId, permissions) {
    try {
      // Find user and get their account
      const user = await User.findById(userId).populate("accountId");
      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Find existing rights
      const rights = await Rights.findOne({
        applicationId,
        accountId: user.accountId._id,
      });

      if (!rights) {
        throw new AppError(
          "Rights not found for this user and application",
          404
        );
      }

      // Update permissions
      rights.permissions = permissions;
      await rights.save();

      return {
        success: true,
        data: {
          rightsCode: rights.rightsCode,
          permissions: rights.permissions,
          status: rights.status,
          message: "Permissions updated successfully",
        },
      };
    } catch (error) {
      throw new AppError(
        `Permission update failed: ${error.message}`,
        error.statusCode || 500
      );
    }
  }

  // Get all applications for a user
  async getUserApplications(userId) {
    try {
      // Find user and get their account
      const user = await User.findById(userId).populate("accountId");
      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Get all rights for this user's account
      const rights = await Rights.find({
        accountId: user.accountId._id,
      }).populate("applicationId");

      const applications = rights.map((right) => ({
        applicationId: right.applicationId._id,
        applicationName: right.applicationId.name,
        permissions: right.permissions,
        status: right.status,
        rightsCode: right.rightsCode,
        expiresAt: right.expiresAt,
      }));

      return {
        success: true,
        data: applications,
        message: `Found ${applications.length} applications for user`,
      };
    } catch (error) {
      throw new AppError(
        `Failed to get user applications: ${error.message}`,
        error.statusCode || 500
      );
    }
  }
}

export default new AutomatedRightsService();
