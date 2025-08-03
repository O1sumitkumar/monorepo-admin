import express from "express";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { Rights, Application, Account } from "../database/init.js";

const router = express.Router();

// Get all rights with pagination and filtering
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const applicationId = req.query.applicationId;
    const accountId = req.query.accountId;
    const status = req.query.status; // 'active', 'expired', 'expiring'

    let query = {};

    if (search) {
      query.$or = [{ rightsCode: { $regex: search, $options: "i" } }];
    }

    if (applicationId) {
      query.applicationId = applicationId;
    }

    if (accountId) {
      query.accountId = accountId;
    }

    if (status) {
      const now = new Date();
      if (status === "expired") {
        query.expiresAt = { $lt: now };
      } else if (status === "expiring") {
        const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        query.expiresAt = { $gte: now, $lte: weekFromNow };
      } else if (status === "active") {
        query.expiresAt = { $gt: now };
      }
    }

    // Get total count
    const total = await Rights.countDocuments(query);

    // Get rights with related data
    const rights = await Rights.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "applications",
          localField: "applicationId",
          foreignField: "id",
          as: "application",
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
        $unwind: "$application",
      },
      {
        $unwind: "$account",
      },
      {
        $addFields: {
          applicationName: "$application.name",
          applicationIdentifier: "$application.applicationId",
          accountName: "$account.name",
          accountIdentifier: "$account.accountId",
          accountType: "$account.accountType",
          status: {
            $cond: {
              if: { $lt: ["$expiresAt", new Date()] },
              then: "expired",
              else: {
                $cond: {
                  if: {
                    $lt: [
                      "$expiresAt",
                      { $add: [new Date(), 7 * 24 * 60 * 60 * 1000] },
                    ],
                  },
                  then: "expiring",
                  else: "active",
                },
              },
            },
          },
        },
      },
      {
        $project: {
          application: 0,
          account: 0,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    // Get statistics
    const stats = await Rights.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $gt: ["$expiresAt", new Date()] }, 1, 0] },
          },
          expired: {
            $sum: { $cond: [{ $lt: ["$expiresAt", new Date()] }, 1, 0] },
          },
          expiring: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$expiresAt", new Date()] },
                    {
                      $lte: [
                        "$expiresAt",
                        { $add: [new Date(), 7 * 24 * 60 * 60 * 1000] },
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const statistics = stats[0] || {
      total: 0,
      active: 0,
      expired: 0,
      expiring: 0,
    };

    res.json({
      rights,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      statistics,
    });
  } catch (error) {
    console.error("Error fetching rights:", error);
    res.status(500).json({ error: "Failed to fetch rights" });
  }
});

// Get single right
router.get("/:id", async (req, res) => {
  try {
    const right = await Rights.aggregate([
      { $match: { id: req.params.id } },
      {
        $lookup: {
          from: "applications",
          localField: "applicationId",
          foreignField: "id",
          as: "application",
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
        $unwind: "$application",
      },
      {
        $unwind: "$account",
      },
      {
        $addFields: {
          applicationName: "$application.name",
          applicationIdentifier: "$application.applicationId",
          accountName: "$account.name",
          accountIdentifier: "$account.accountId",
          accountType: "$account.accountType",
          status: {
            $cond: {
              if: { $lt: ["$expiresAt", new Date()] },
              then: "expired",
              else: {
                $cond: {
                  if: {
                    $lt: [
                      "$expiresAt",
                      { $add: [new Date(), 7 * 24 * 60 * 60 * 1000] },
                    ],
                  },
                  then: "expiring",
                  else: "active",
                },
              },
            },
          },
        },
      },
      {
        $project: {
          application: 0,
          account: 0,
        },
      },
    ]);

    if (!right[0]) {
      return res.status(404).json({ error: "Right not found" });
    }

    res.json(right[0]);
  } catch (error) {
    console.error("Error fetching right:", error);
    res.status(500).json({ error: "Failed to fetch right" });
  }
});

// Create new rights
router.post("/", async (req, res) => {
  try {
    const { applicationId, accountId, permissions, expiresAt } = req.body;

    if (!applicationId || !accountId || !permissions) {
      return res.status(400).json({
        error: "ApplicationId, accountId, and permissions are required",
      });
    }

    // Check if application exists
    const application = await Application.findOne({ id: applicationId });
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Check if account exists
    const account = await Account.findOne({ id: accountId });
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Check if rights already exist for this application-account pair
    const existing = await Rights.findOne({ applicationId, accountId });

    if (existing) {
      return res.status(409).json({
        error: "Rights already exist for this application-account pair",
      });
    }

    const id = uuidv4();
    const now = new Date();

    // Generate JWT rights code
    const rightsCode = jwt.sign(
      {
        id,
        applicationId,
        accountId,
        permissions,
        expiresAt,
        iat: Math.floor(Date.now() / 1000),
      },
      process.env.JWT_SECRET || "your-secret-key",
      {
        expiresIn: expiresAt
          ? Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
          : "1y",
      }
    );

    const newRight = new Rights({
      id,
      applicationId,
      accountId,
      rightsCode,
      permissions: JSON.stringify(permissions),
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    await newRight.save();

    // Get the created right with related data
    const createdRight = await Rights.aggregate([
      { $match: { id } },
      {
        $lookup: {
          from: "applications",
          localField: "applicationId",
          foreignField: "id",
          as: "application",
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
        $unwind: "$application",
      },
      {
        $unwind: "$account",
      },
      {
        $addFields: {
          applicationName: "$application.name",
          applicationIdentifier: "$application.applicationId",
          accountName: "$account.name",
          accountIdentifier: "$account.accountId",
          accountType: "$account.accountType",
        },
      },
      {
        $project: {
          application: 0,
          account: 0,
        },
      },
    ]);

    res.status(201).json(createdRight[0]);
  } catch (error) {
    console.error("Error creating rights:", error);
    res.status(500).json({ error: "Failed to create rights" });
  }
});

// Update rights
router.put("/:id", async (req, res) => {
  try {
    const { permissions, expiresAt } = req.body;

    // Check if right exists
    const existing = await Rights.findOne({ id: req.params.id });
    if (!existing) {
      return res.status(404).json({ error: "Right not found" });
    }

    const now = new Date();

    // Generate new JWT rights code if permissions changed
    let rightsCode = existing.rightsCode;
    if (permissions && JSON.stringify(permissions) !== existing.permissions) {
      rightsCode = jwt.sign(
        {
          id: req.params.id,
          applicationId: existing.applicationId,
          accountId: existing.accountId,
          permissions,
          expiresAt: expiresAt || existing.expiresAt,
          iat: Math.floor(Date.now() / 1000),
        },
        process.env.JWT_SECRET || "your-secret-key",
        {
          expiresIn: expiresAt
            ? Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
            : "1y",
        }
      );
    }

    const updateData = {
      ...(permissions && { permissions: JSON.stringify(permissions) }),
      rightsCode,
      ...(expiresAt && { expiresAt }),
      updatedAt: now,
    };

    const updatedRight = await Rights.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true }
    );

    // Get updated right with related data
    const rightWithData = await Rights.aggregate([
      { $match: { id: req.params.id } },
      {
        $lookup: {
          from: "applications",
          localField: "applicationId",
          foreignField: "id",
          as: "application",
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
        $unwind: "$application",
      },
      {
        $unwind: "$account",
      },
      {
        $addFields: {
          applicationName: "$application.name",
          applicationIdentifier: "$application.applicationId",
          accountName: "$account.name",
          accountIdentifier: "$account.accountId",
          accountType: "$account.accountType",
        },
      },
      {
        $project: {
          application: 0,
          account: 0,
        },
      },
    ]);

    res.json(rightWithData[0]);
  } catch (error) {
    console.error("Error updating rights:", error);
    res.status(500).json({ error: "Failed to update rights" });
  }
});

// Delete rights
router.delete("/:id", async (req, res) => {
  try {
    const existing = await Rights.findOne({ id: req.params.id });
    if (!existing) {
      return res.status(404).json({ error: "Right not found" });
    }

    await Rights.findOneAndDelete({ id: req.params.id });

    res.json({ message: "Rights deleted successfully" });
  } catch (error) {
    console.error("Error deleting rights:", error);
    res.status(500).json({ error: "Failed to delete rights" });
  }
});

// Get rights statistics
router.get("/stats/overview", async (req, res) => {
  try {
    const stats = await Rights.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $gt: ["$expiresAt", new Date()] }, 1, 0] },
          },
          expired: {
            $sum: { $cond: [{ $lt: ["$expiresAt", new Date()] }, 1, 0] },
          },
          expiring: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$expiresAt", new Date()] },
                    {
                      $lte: [
                        "$expiresAt",
                        { $add: [new Date(), 7 * 24 * 60 * 60 * 1000] },
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const statistics = stats[0] || {
      total: 0,
      active: 0,
      expired: 0,
      expiring: 0,
    };

    // Get expiring rights
    const expiringRights = await Rights.aggregate([
      {
        $match: {
          expiresAt: {
            $gte: new Date(),
            $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
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
        $lookup: {
          from: "accounts",
          localField: "accountId",
          foreignField: "id",
          as: "account",
        },
      },
      {
        $unwind: "$application",
      },
      {
        $unwind: "$account",
      },
      {
        $project: {
          id: 1,
          rightsCode: 1,
          expiresAt: 1,
          applicationName: "$application.name",
          accountName: "$account.name",
        },
      },
      { $sort: { expiresAt: 1 } },
      { $limit: 10 },
    ]);

    res.json({
      statistics,
      expiringRights,
    });
  } catch (error) {
    console.error("Error fetching rights statistics:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Verify rights code (for APP-X applications) - FOLLOWS THE SEQUENCE DIAGRAM
router.post("/verify", async (req, res) => {
  try {
    const { rightsCode, applicationId } = req.body;

    if (!rightsCode || !applicationId) {
      return res
        .status(400)
        .json({ error: "Rights code and application ID are required" });
    }

    // Verify JWT token
    try {
      const decoded = jwt.verify(
        rightsCode,
        process.env.JWT_SECRET || "your-secret-key"
      );

      // Check if rights exist in database
      const right = await Rights.aggregate([
        { $match: { id: decoded.id, applicationId } },
        {
          $lookup: {
            from: "applications",
            localField: "applicationId",
            foreignField: "id",
            as: "application",
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
          $unwind: "$application",
        },
        {
          $unwind: "$account",
        },
        {
          $addFields: {
            accountName: "$account.name",
            accountType: "$account.accountType",
          },
        },
        {
          $project: {
            application: 0,
            account: 0,
          },
        },
      ]);

      if (!right[0]) {
        return res.status(404).json({ error: "Rights not found" });
      }

      // Check if expired
      if (right[0].expiresAt && new Date(right[0].expiresAt) < new Date()) {
        return res.status(401).json({ error: "Rights have expired" });
      }

      res.json({
        valid: true,
        permissions: JSON.parse(right[0].permissions),
        accountName: right[0].accountName,
        accountType: right[0].accountType,
        expiresAt: right[0].expiresAt,
      });
    } catch (jwtError) {
      res.status(401).json({ error: "Invalid rights code" });
    }
  } catch (error) {
    console.error("Error verifying rights:", error);
    res.status(500).json({ error: "Failed to verify rights" });
  }
});

// Validate user rights for APP-X applications - NEW ENDPOINT FOR SEQUENCE DIAGRAM
router.post("/validate-user", async (req, res) => {
  try {
    const { userId, applicationId, requiredPermissions } = req.body;

    if (!userId || !applicationId) {
      return res
        .status(400)
        .json({ error: "User ID and application ID are required" });
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
        error: "No rights found for this user and application",
      });
    }

    const right = rights[0];
    const userPermissions = JSON.parse(right.permissions);

    // Check if expired
    if (right.expiresAt && new Date(right.expiresAt) < new Date()) {
      return res.status(401).json({
        valid: false,
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
    });
  } catch (error) {
    console.error("Error validating user rights:", error);
    res.status(500).json({
      valid: false,
      error: "Failed to validate user rights",
    });
  }
});

export default router;
