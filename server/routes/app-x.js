import express from "express";
import { Rights, Application, Account, User } from "../database/init.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Multi-Application: Auto-create user, account, and rights for new users
router.post("/auto-create-user", async (req, res) => {
  try {
    const {
      userId,
      applicationId,
      userData = {},
      defaultPermissions = ["read"],
    } = req.body;

    if (!userId || !applicationId) {
      return res.status(400).json({
        error: "User ID and application ID are required",
      });
    }

    // Check if application exists and is active
    const application = await Application.findOne({
      id: applicationId,
      status: "active",
    });

    if (!application) {
      return res.status(404).json({
        error: "Application not found or inactive",
      });
    }

    // Check if user already exists in our system
    let existingUser = await User.findOne({ id: userId });
    let existingAccount = await Account.findOne({ id: userId });

    // If user doesn't exist, create them
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash("defaultPassword123", 10);
      const now = new Date();

      const newUser = new User({
        id: userId,
        username: userData.username || `user_${userId}`,
        email: userData.email || `${userId}@external-app.com`,
        password: hashedPassword,
        role: "user",
        status: "active",
        createdAt: now,
        updatedAt: now,
      });

      await newUser.save();
      existingUser = newUser;
      console.log(`✅ Created new user: ${userId}`);
    }

    // If account doesn't exist, create it
    if (!existingAccount) {
      const now = new Date();

      const newAccount = new Account({
        id: userId,
        name: userData.name || `User ${userId}`,
        accountId: userData.accountId || userId,
        accountType: userData.accountType || "individual",
        status: "active",
        sharedWith: [],
        createdAt: now,
        updatedAt: now,
      });

      await newAccount.save();
      existingAccount = newAccount;
      console.log(`✅ Created new account: ${userId}`);
    }

    // Check if rights already exist for this user and application
    const existingRights = await Rights.findOne({
      accountId: userId,
      applicationId,
    });

    // If rights don't exist, create them
    if (!existingRights) {
      const now = new Date();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Expires in 1 year

      const newRights = new Rights({
        id: `right-${userId}-${applicationId}`,
        applicationId,
        applicationName: application.name,
        accountId: userId,
        accountName: existingAccount.name,
        permissions: defaultPermissions,
        expiresAt,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });

      await newRights.save();
      console.log(
        `✅ Created new rights for user ${userId} in application ${applicationId}`
      );
    }

    // Return the complete user data
    const userResponse = await User.findOne({ id: userId }).select("-password");
    const accountResponse = await Account.findOne({ id: userId });
    const rightsResponse = await Rights.findOne({
      accountId: userId,
      applicationId,
    });

    res.json({
      success: true,
      message: "User, account, and rights created/verified successfully",
      user: userResponse,
      account: accountResponse,
      rights: rightsResponse,
      application: application,
    });
  } catch (error) {
    console.error("Error auto-creating user:", error);
    res.status(500).json({
      error: "Failed to auto-create user",
      details: error.message,
    });
  }
});

// Multi-Application: Check if user exists for any application
router.post("/check-user", async (req, res) => {
  try {
    const { userId, applicationId } = req.body;

    if (!userId || !applicationId) {
      return res.status(400).json({
        error: "User ID and application ID are required",
      });
    }

    // Check if user exists in APP-ADMIN system
    const account = await Account.findOne({ id: userId });

    if (!account) {
      return res.status(404).json({
        exists: false,
        error: "User not found in APP-ADMIN system",
      });
    }

    // Check if application exists and is active
    const application = await Application.findOne({
      id: applicationId,
      status: "active",
    });

    if (!application) {
      return res.status(404).json({
        exists: false,
        error: "Application not found or inactive",
      });
    }

    res.json({
      exists: true,
      user: {
        id: account.id,
        name: account.name,
        accountId: account.accountId,
        accountType: account.accountType,
      },
      application: {
        id: application.id,
        name: application.name,
        applicationId: application.applicationId,
        status: application.status,
      },
    });
  } catch (error) {
    console.error("Error checking user:", error);
    res.status(500).json({
      exists: false,
      error: "Failed to check user",
    });
  }
});

// Multi-Application: Validate user rights for any application
router.post("/validate-rights", async (req, res) => {
  try {
    const { userId, applicationId, requiredPermissions } = req.body;

    if (!userId || !applicationId) {
      return res.status(400).json({
        error: "User ID and application ID are required",
      });
    }

    // Find rights for this user and application
    const rights = await Rights.aggregate([
      {
        $match: {
          accountId: userId,
          applicationId,
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "accountId",
          foreignField: "id",
          as: "account",
        },
      },
      {
        $lookup: {
          from: "applications",
          localField: "applicationId",
          foreignField: "id",
          as: "application",
        },
      },
      {
        $unwind: "$account",
      },
      {
        $unwind: "$application",
      },
    ]);

    if (!rights[0]) {
      return res.status(404).json({
        valid: false,
        hasAccess: false,
        error: "No rights found for this user and application",
      });
    }

    const right = rights[0];
    const userPermissions = JSON.parse(right.permissions);

    // Check if expired
    if (right.expiresAt && new Date(right.expiresAt) < new Date()) {
      return res.status(401).json({
        valid: false,
        hasAccess: false,
        error: "Rights have expired",
      });
    }

    // Check if user has required permissions
    const hasRequiredPermissions = requiredPermissions
      ? requiredPermissions.every((permission) =>
          userPermissions.includes(permission)
        )
      : true;

    res.json({
      valid: true,
      hasAccess: hasRequiredPermissions,
      permissions: userPermissions,
      accountName: right.account.name,
      accountType: right.account.accountType,
      expiresAt: right.expiresAt,
      applicationName: right.application.name,
      applicationId: right.application.applicationId,
    });
  } catch (error) {
    console.error("Error validating user rights:", error);
    res.status(500).json({
      valid: false,
      hasAccess: false,
      error: "Failed to validate user rights",
    });
  }
});

// Multi-Application: Get user permissions for specific application
router.get(
  "/user/:userId/application/:applicationId/permissions",
  async (req, res) => {
    try {
      const { userId, applicationId } = req.params;

      // Find rights for this user and application
      const rights = await Rights.aggregate([
        {
          $match: {
            accountId: userId,
            applicationId,
          },
        },
        {
          $lookup: {
            from: "accounts",
            localField: "accountId",
            foreignField: "id",
            as: "account",
          },
        },
        {
          $lookup: {
            from: "applications",
            localField: "applicationId",
            foreignField: "id",
            as: "application",
          },
        },
        {
          $unwind: "$account",
        },
        {
          $unwind: "$application",
        },
      ]);

      if (!rights[0]) {
        return res.status(404).json({
          error: "No rights found for this user and application",
        });
      }

      const right = rights[0];

      // Check if expired
      if (right.expiresAt && new Date(right.expiresAt) < new Date()) {
        return res.status(401).json({
          error: "Rights have expired",
        });
      }

      res.json({
        permissions: JSON.parse(right.permissions),
        expiresAt: right.expiresAt,
        accountName: right.account.name,
        applicationName: right.application.name,
        applicationId: right.application.applicationId,
      });
    } catch (error) {
      console.error("Error getting user permissions:", error);
      res.status(500).json({
        error: "Failed to get user permissions",
      });
    }
  }
);

// Multi-Application: Get all applications that a user has access to
router.get("/user/:userId/applications", async (req, res) => {
  try {
    const { userId } = req.params;

    // Find all rights for this user
    const userRights = await Rights.aggregate([
      {
        $match: {
          accountId: userId,
        },
      },
      {
        $lookup: {
          from: "applications",
          localField: "applicationId",
          foreignField: "id",
          as: "application",
        },
      },
      {
        $unwind: "$application",
      },
      {
        $match: {
          "application.status": "active",
        },
      },
      {
        $group: {
          _id: "$applicationId",
          application: { $first: "$application" },
          permissions: { $first: "$permissions" },
          expiresAt: { $first: "$expiresAt" },
        },
      },
    ]);

    // Filter out expired rights
    const activeApplications = userRights.filter((right) => {
      if (!right.expiresAt) return true;
      return new Date(right.expiresAt) > new Date();
    });

    res.json({
      applications: activeApplications.map((right) => ({
        id: right.application.id,
        name: right.application.name,
        applicationId: right.application.applicationId,
        permissions: JSON.parse(right.permissions),
        expiresAt: right.expiresAt,
      })),
    });
  } catch (error) {
    console.error("Error getting user applications:", error);
    res.status(500).json({
      error: "Failed to get user applications",
    });
  }
});

// Multi-Application: Bulk validate rights for multiple applications
router.post("/bulk-validate", async (req, res) => {
  try {
    const { userId, applications } = req.body;

    if (!userId || !applications || !Array.isArray(applications)) {
      return res.status(400).json({
        error: "User ID and applications array are required",
      });
    }

    const results = [];

    for (const app of applications) {
      const { applicationId, requiredPermissions } = app;

      try {
        // Find rights for this user and application
        const rights = await Rights.aggregate([
          {
            $match: {
              accountId: userId,
              applicationId,
            },
          },
          {
            $lookup: {
              from: "applications",
              localField: "applicationId",
              foreignField: "id",
              as: "application",
            },
          },
          {
            $unwind: "$application",
          },
        ]);

        if (!rights[0]) {
          results.push({
            applicationId,
            valid: false,
            hasAccess: false,
            error: "No rights found",
          });
          continue;
        }

        const right = rights[0];
        const userPermissions = JSON.parse(right.permissions);

        // Check if expired
        if (right.expiresAt && new Date(right.expiresAt) < new Date()) {
          results.push({
            applicationId,
            valid: false,
            hasAccess: false,
            error: "Rights have expired",
          });
          continue;
        }

        // Check if user has required permissions
        const hasRequiredPermissions = requiredPermissions
          ? requiredPermissions.every((permission) =>
              userPermissions.includes(permission)
            )
          : true;

        results.push({
          applicationId,
          valid: true,
          hasAccess: hasRequiredPermissions,
          permissions: userPermissions,
          applicationName: right.application.name,
          expiresAt: right.expiresAt,
        });
      } catch (error) {
        results.push({
          applicationId,
          valid: false,
          hasAccess: false,
          error: "Validation failed",
        });
      }
    }

    res.json({
      userId,
      results,
    });
  } catch (error) {
    console.error("Error bulk validating rights:", error);
    res.status(500).json({
      error: "Failed to bulk validate rights",
    });
  }
});

// Multi-Application: Register a new external application
router.post("/register-application", async (req, res) => {
  try {
    const { name, applicationId, description } = req.body;

    if (!name || !applicationId) {
      return res.status(400).json({
        error: "Application name and ID are required",
      });
    }

    // Check if application already exists
    const existing = await Application.findOne({ applicationId });

    if (existing) {
      return res.status(409).json({
        error: "Application already exists",
      });
    }

    // Create new application
    const newApplication = new Application({
      id: uuidv4(),
      name,
      applicationId,
      description: description || `External application: ${name}`,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newApplication.save();

    res.status(201).json({
      message: "Application registered successfully",
      application: newApplication,
    });
  } catch (error) {
    console.error("Error registering application:", error);
    res.status(500).json({
      error: "Failed to register application",
    });
  }
});

// Multi-Application: Get all registered applications
router.get("/applications", async (req, res) => {
  try {
    const applications = await Application.find({ status: "active" })
      .select("id name applicationId description status createdAt")
      .sort({ createdAt: -1 });

    res.json({
      applications,
      total: applications.length,
    });
  } catch (error) {
    console.error("Error getting applications:", error);
    res.status(500).json({
      error: "Failed to get applications",
    });
  }
});

// Multi-Application: Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "APP-ADMIN Multi-Application Integration",
    timestamp: new Date().toISOString(),
    features: [
      "Multi-application support",
      "User rights validation",
      "Bulk validation",
      "Application registration",
      "Permission management",
    ],
  });
});

// Multi-Application: Get rights for a specific user and application
router.get("/user/:userId/rights/:applicationId", async (req, res) => {
  try {
    const { userId, applicationId } = req.params;

    // Find rights for this user and application
    const rights = await Rights.findOne({
      accountId: userId,
      applicationId,
    });

    if (!rights) {
      return res.status(404).json({
        error: "No rights found for this user and application",
      });
    }

    // Check if expired
    if (rights.expiresAt && new Date(rights.expiresAt) < new Date()) {
      return res.status(401).json({
        error: "Rights have expired",
        expiresAt: rights.expiresAt,
      });
    }

    // Get application details
    const application = await Application.findOne({ id: applicationId });
    const account = await Account.findOne({ id: userId });

    res.json({
      success: true,
      rights: {
        id: rights.id,
        applicationId: rights.applicationId,
        applicationName: rights.applicationName,
        accountId: rights.accountId,
        accountName: rights.accountName,
        permissions: rights.permissions,
        expiresAt: rights.expiresAt,
        status: rights.status,
        createdAt: rights.createdAt,
        updatedAt: rights.updatedAt,
      },
      application: application
        ? {
            id: application.id,
            name: application.name,
            applicationId: application.applicationId,
            status: application.status,
          }
        : null,
      account: account
        ? {
            id: account.id,
            name: account.name,
            accountId: account.accountId,
            accountType: account.accountType,
            status: account.status,
          }
        : null,
    });
  } catch (error) {
    console.error("Error getting user rights:", error);
    res.status(500).json({
      error: "Failed to get user rights",
      details: error.message,
    });
  }
});

// Multi-Application: Get all rights for a user across all applications
router.get("/user/:userId/rights", async (req, res) => {
  try {
    const { userId } = req.params;

    // Find all rights for this user
    const rights = await Rights.find({ accountId: userId });

    if (!rights || rights.length === 0) {
      return res.status(404).json({
        error: "No rights found for this user",
      });
    }

    // Get application details for each right
    const rightsWithDetails = await Promise.all(
      rights.map(async (right) => {
        const application = await Application.findOne({
          id: right.applicationId,
        });
        const account = await Account.findOne({ id: userId });

        return {
          id: right.id,
          applicationId: right.applicationId,
          applicationName: right.applicationName,
          accountId: right.accountId,
          accountName: right.accountName,
          permissions: right.permissions,
          expiresAt: right.expiresAt,
          status: right.status,
          createdAt: right.createdAt,
          updatedAt: right.updatedAt,
          application: application
            ? {
                id: application.id,
                name: application.name,
                applicationId: application.applicationId,
                status: application.status,
              }
            : null,
          account: account
            ? {
                id: account.id,
                name: account.name,
                accountId: account.accountId,
                accountType: account.accountType,
                status: account.status,
              }
            : null,
        };
      })
    );

    res.json({
      success: true,
      userId,
      rights: rightsWithDetails,
      total: rightsWithDetails.length,
    });
  } catch (error) {
    console.error("Error getting all user rights:", error);
    res.status(500).json({
      error: "Failed to get all user rights",
      details: error.message,
    });
  }
});

export default router;
