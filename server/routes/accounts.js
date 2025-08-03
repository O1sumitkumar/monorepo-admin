import express from "express";
import { v4 as uuidv4 } from "uuid";
import { Account, AccountSharing } from "../database/init.js";

const router = express.Router();

// Get all accounts with pagination and filtering
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const accountType = req.query.accountType;

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { accountId: { $regex: search, $options: "i" } },
      ];
    }

    if (accountType) {
      query.accountType = accountType;
    }

    // Get total count
    const total = await Account.countDocuments(query);

    // Get accounts
    const accounts = await Account.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get statistics
    const stats = await Account.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          personal: {
            $sum: { $cond: [{ $eq: ["$accountType", "Personal"] }, 1, 0] },
          },
          business: {
            $sum: { $cond: [{ $eq: ["$accountType", "Business"] }, 1, 0] },
          },
          temporary: {
            $sum: { $cond: [{ $eq: ["$accountType", "Temporary"] }, 1, 0] },
          },
        },
      },
    ]);

    const statistics = stats[0] || {
      total: 0,
      personal: 0,
      business: 0,
      temporary: 0,
    };

    res.json({
      accounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      statistics,
    });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
});

// Get single account with sharing information
router.get("/:id", async (req, res) => {
  try {
    const account = await Account.findOne({ id: req.params.id });

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Get sharing relationships
    const sharingRelationships = await AccountSharing.aggregate([
      {
        $match: {
          $or: [
            { sourceAccountId: req.params.id },
            { targetAccountId: req.params.id },
          ],
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "sourceAccountId",
          foreignField: "id",
          as: "sourceAccount",
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "targetAccountId",
          foreignField: "id",
          as: "targetAccount",
        },
      },
      {
        $unwind: "$sourceAccount",
      },
      {
        $unwind: "$targetAccount",
      },
      {
        $addFields: {
          sourceAccountName: "$sourceAccount.name",
          targetAccountName: "$targetAccount.name",
          targetAccountType: "$targetAccount.accountType",
        },
      },
      {
        $project: {
          sourceAccount: 0,
          targetAccount: 0,
        },
      },
    ]);

    res.json({
      ...account.toObject(),
      sharingRelationships,
    });
  } catch (error) {
    console.error("Error fetching account:", error);
    res.status(500).json({ error: "Failed to fetch account" });
  }
});

// Create new account
router.post("/", async (req, res) => {
  try {
    const { name, accountId, accountType } = req.body;

    if (!name || !accountId || !accountType) {
      return res
        .status(400)
        .json({ error: "Name, accountId, and accountType are required" });
    }

    if (!["Personal", "Business", "Temporary"].includes(accountType)) {
      return res.status(400).json({
        error: "Account type must be Personal, Business, or Temporary",
      });
    }

    // Check if accountId already exists
    const existing = await Account.findOne({ accountId });

    if (existing) {
      return res.status(409).json({ error: "Account ID already exists" });
    }

    const id = uuidv4();
    const now = new Date();

    const newAccount = new Account({
      id,
      name,
      accountId,
      accountType,
      sharedAccounts: [],
      createdAt: now,
      updatedAt: now,
    });

    await newAccount.save();

    res.status(201).json(newAccount);
  } catch (error) {
    console.error("Error creating account:", error);
    res.status(500).json({ error: "Failed to create account" });
  }
});

// Update account
router.put("/:id", async (req, res) => {
  try {
    const { name, accountId, accountType, sharedAccounts } = req.body;

    // Check if account exists
    const existing = await Account.findOne({ id: req.params.id });

    if (!existing) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Check if new accountId conflicts with existing
    if (accountId) {
      const conflict = await Account.findOne({
        accountId,
        id: { $ne: req.params.id },
      });

      if (conflict) {
        return res.status(409).json({ error: "Account ID already exists" });
      }
    }

    const updateData = {
      ...(name && { name }),
      ...(accountId && { accountId }),
      ...(accountType && { accountType }),
      ...(sharedAccounts !== undefined && { sharedAccounts }),
      updatedAt: new Date(),
    };

    const updatedAccount = await Account.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true }
    );

    res.json(updatedAccount);
  } catch (error) {
    console.error("Error updating account:", error);
    res.status(500).json({ error: "Failed to update account" });
  }
});

// Delete account
router.delete("/:id", async (req, res) => {
  try {
    // Check if account exists
    const existing = await Account.findOne({ id: req.params.id });

    if (!existing) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Check if account has associated rights
    const { Rights } = await import("../database/init.js");
    const rightsCount = await Rights.countDocuments({
      accountId: req.params.id,
    });

    if (rightsCount > 0) {
      return res.status(400).json({
        error:
          "Cannot delete account with associated rights. Please remove all rights first.",
      });
    }

    // Check if account has sharing relationships
    const sharingCount = await AccountSharing.countDocuments({
      $or: [
        { sourceAccountId: req.params.id },
        { targetAccountId: req.params.id },
      ],
    });

    if (sharingCount > 0) {
      return res.status(400).json({
        error:
          "Cannot delete account with sharing relationships. Please remove all sharing first.",
      });
    }

    await Account.findOneAndDelete({ id: req.params.id });

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

// Account sharing routes
router.post("/:id/share", async (req, res) => {
  try {
    const { targetAccountId, expiresAt } = req.body;
    const sourceAccountId = req.params.id;

    if (!targetAccountId) {
      return res.status(400).json({ error: "Target account ID is required" });
    }

    // Check if source account exists and is Business type
    const sourceAccount = await Account.findOne({ id: sourceAccountId });

    if (!sourceAccount) {
      return res.status(404).json({ error: "Source account not found" });
    }

    if (sourceAccount.accountType !== "Business") {
      return res
        .status(400)
        .json({ error: "Only Business accounts can share rights" });
    }

    // Check if target account exists
    const targetAccount = await Account.findOne({ id: targetAccountId });

    if (!targetAccount) {
      return res.status(404).json({ error: "Target account not found" });
    }

    // Check if sharing relationship already exists
    const existingSharing = await AccountSharing.findOne({
      sourceAccountId,
      targetAccountId,
    });

    if (existingSharing) {
      return res
        .status(409)
        .json({ error: "Sharing relationship already exists" });
    }

    const sharingId = uuidv4();
    const now = new Date();

    const newSharing = new AccountSharing({
      id: sharingId,
      sourceAccountId,
      targetAccountId,
      status: "pending",
      invitedBy: "admin",
      invitedAt: now,
      expiresAt,
    });

    await newSharing.save();

    // Update source account's sharedAccounts array
    const currentShared = sourceAccount.sharedAccounts || [];
    if (!currentShared.includes(targetAccountId)) {
      currentShared.push(targetAccountId);
      await Account.findOneAndUpdate(
        { id: sourceAccountId },
        { sharedAccounts: currentShared, updatedAt: now }
      );
    }

    // Get the created sharing with related data
    const sharingWithData = await AccountSharing.aggregate([
      { $match: { id: sharingId } },
      {
        $lookup: {
          from: "accounts",
          localField: "sourceAccountId",
          foreignField: "id",
          as: "sourceAccount",
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "targetAccountId",
          foreignField: "id",
          as: "targetAccount",
        },
      },
      {
        $unwind: "$sourceAccount",
      },
      {
        $unwind: "$targetAccount",
      },
      {
        $addFields: {
          sourceAccountName: "$sourceAccount.name",
          targetAccountName: "$targetAccount.name",
          targetAccountType: "$targetAccount.accountType",
        },
      },
      {
        $project: {
          sourceAccount: 0,
          targetAccount: 0,
        },
      },
    ]);

    res.status(201).json(sharingWithData[0]);
  } catch (error) {
    console.error("Error creating sharing relationship:", error);
    res.status(500).json({ error: "Failed to create sharing relationship" });
  }
});

// Update sharing status
router.put("/share/:sharingId", async (req, res) => {
  try {
    const { status } = req.body;
    const sharingId = req.params.sharingId;

    if (!["pending", "active", "revoked"].includes(status)) {
      return res
        .status(400)
        .json({ error: "Invalid status. Must be pending, active, or revoked" });
    }

    const existing = await AccountSharing.findOne({ id: sharingId });

    if (!existing) {
      return res.status(404).json({ error: "Sharing relationship not found" });
    }

    const now = new Date();

    const updatedSharing = await AccountSharing.findOneAndUpdate(
      { id: sharingId },
      { status, updatedAt: now },
      { new: true }
    );

    // Get updated sharing with related data
    const sharingWithData = await AccountSharing.aggregate([
      { $match: { id: sharingId } },
      {
        $lookup: {
          from: "accounts",
          localField: "sourceAccountId",
          foreignField: "id",
          as: "sourceAccount",
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "targetAccountId",
          foreignField: "id",
          as: "targetAccount",
        },
      },
      {
        $unwind: "$sourceAccount",
      },
      {
        $unwind: "$targetAccount",
      },
      {
        $addFields: {
          sourceAccountName: "$sourceAccount.name",
          targetAccountName: "$targetAccount.name",
          targetAccountType: "$targetAccount.accountType",
        },
      },
      {
        $project: {
          sourceAccount: 0,
          targetAccount: 0,
        },
      },
    ]);

    res.json(sharingWithData[0]);
  } catch (error) {
    console.error("Error updating sharing status:", error);
    res.status(500).json({ error: "Failed to update sharing status" });
  }
});

// Delete sharing relationship
router.delete("/share/:sharingId", async (req, res) => {
  try {
    const sharingId = req.params.sharingId;

    const existing = await AccountSharing.findOne({ id: sharingId });

    if (!existing) {
      return res.status(404).json({ error: "Sharing relationship not found" });
    }

    await AccountSharing.findOneAndDelete({ id: sharingId });

    // Update source account's sharedAccounts array
    const sourceAccount = await Account.findOne({
      id: existing.sourceAccountId,
    });

    if (sourceAccount) {
      const currentShared = sourceAccount.sharedAccounts || [];
      const updatedShared = currentShared.filter(
        (id) => id !== existing.targetAccountId
      );

      await Account.findOneAndUpdate(
        { id: existing.sourceAccountId },
        { sharedAccounts: updatedShared, updatedAt: new Date() }
      );
    }

    res.json({ message: "Sharing relationship deleted successfully" });
  } catch (error) {
    console.error("Error deleting sharing relationship:", error);
    res.status(500).json({ error: "Failed to delete sharing relationship" });
  }
});

// Get account statistics
router.get("/stats/overview", async (req, res) => {
  try {
    const stats = await Account.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          personal: {
            $sum: { $cond: [{ $eq: ["$accountType", "Personal"] }, 1, 0] },
          },
          business: {
            $sum: { $cond: [{ $eq: ["$accountType", "Business"] }, 1, 0] },
          },
          temporary: {
            $sum: { $cond: [{ $eq: ["$accountType", "Temporary"] }, 1, 0] },
          },
        },
      },
    ]);

    const statistics = stats[0] || {
      total: 0,
      personal: 0,
      business: 0,
      temporary: 0,
    };

    // Get pending invitations
    const pendingInvitations = await AccountSharing.aggregate([
      { $match: { status: "pending" } },
      {
        $lookup: {
          from: "accounts",
          localField: "sourceAccountId",
          foreignField: "id",
          as: "sourceAccount",
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "targetAccountId",
          foreignField: "id",
          as: "targetAccount",
        },
      },
      {
        $unwind: "$sourceAccount",
      },
      {
        $unwind: "$targetAccount",
      },
      {
        $addFields: {
          sourceAccountName: "$sourceAccount.name",
          targetAccountName: "$targetAccount.name",
          targetAccountType: "$targetAccount.accountType",
        },
      },
      {
        $project: {
          sourceAccount: 0,
          targetAccount: 0,
        },
      },
      { $sort: { invitedAt: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      statistics,
      pendingInvitations,
    });
  } catch (error) {
    console.error("Error fetching account statistics:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

export default router;
