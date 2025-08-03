import Account from "../models/Account.js";
import AccountSharing from "../models/AccountSharing.js";
import { AppError } from "../middleware/errorHandler.js";

class AccountsService {
  // Get all accounts with pagination and search
  async getAllAccounts(page = 1, limit = 10, search = "") {
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      };
    }

    const [accounts, total] = await Promise.all([
      Account.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Account.countDocuments(query),
    ]);

    // Transform the data
    const transformedAccounts = accounts.map((account) => ({
      id: account._id,
      name: account.name,
      accountId: account.accountId,
      email: account.email,
      description: account.description,
      accountType: account.accountType || "Personal", // Updated default
      status: account.status || "active",
      sharedAccounts: account.sharedAccounts || [], // Updated field name
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    }));

    return {
      accounts: transformedAccounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get account by ID
  async getAccountById(id) {
    const account = await Account.findById(id).lean();

    if (!account) {
      throw new AppError("Account not found", 404);
    }

    return {
      id: account._id,
      name: account.name,
      accountId: account.accountId,
      email: account.email,
      description: account.description,
      accountType: account.accountType || "Personal", // Updated default
      status: account.status || "active",
      sharedAccounts: account.sharedAccounts || [], // Updated field name
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  // Create new account
  async createAccount(accountData) {
    const {
      name,
      email,
      description,
      accountType = "Personal", // Updated default
    } = accountData;

    // Validate account type
    const validAccountTypes = ["Temporary", "Personal", "Business"];
    if (!validAccountTypes.includes(accountType)) {
      throw new AppError(
        `Invalid account type. Must be one of: ${validAccountTypes.join(", ")}`,
        400
      );
    }

    // Check if account with same email already exists
    if (email) {
      const existingAccount = await Account.findOne({ email });
      if (existingAccount) {
        throw new AppError("Account with this email already exists", 400);
      }
    }

    // Generate accountId if not provided
    const accountId = `${name
      .toLowerCase()
      .replace(/\s+/g, "-")}-${Date.now()}`;

    const account = new Account({
      name,
      accountId,
      email,
      description,
      accountType, // Use provided account type
      status: "active",
      sharedAccounts: [], // Updated field name
    });

    await account.save();

    return this.getAccountById(account._id);
  }

  // Update account
  async updateAccount(id, updateData) {
    const account = await Account.findById(id);
    if (!account) {
      throw new AppError("Account not found", 404);
    }

    const { name, email, description, status } = updateData;

    // Check if email is being changed and if it already exists
    if (email && email !== account.email) {
      const existingAccount = await Account.findOne({ email });
      if (existingAccount) {
        throw new AppError("Account with this email already exists", 400);
      }
    }

    const updatedAccount = await Account.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updatedAt: new Date(),
      },
      { new: true }
    );

    return this.getAccountById(updatedAccount._id);
  }

  // Delete account
  async deleteAccount(id) {
    const account = await Account.findById(id);
    if (!account) {
      throw new AppError("Account not found", 404);
    }

    // Delete associated account sharing records
    await AccountSharing.deleteMany({ accountId: id });

    await Account.findByIdAndDelete(id);
  }

  // Share account
  async shareAccount(id, shareData) {
    const account = await Account.findById(id);
    if (!account) {
      throw new AppError("Account not found", 404);
    }

    const { sharedWith, permissions, expiresAt } = shareData;

    // Create or update account sharing record
    const sharingRecord = await AccountSharing.findOneAndUpdate(
      { accountId: id },
      {
        accountId: id,
        sharedWith,
        permissions,
        expiresAt: expiresAt || null,
        status: "active",
      },
      { upsert: true, new: true }
    );

    // Update account's sharedWith field
    await Account.findByIdAndUpdate(id, {
      sharedWith: sharedWith,
      updatedAt: new Date(),
    });

    return this.getAccountById(id);
  }

  // Get account statistics
  async getAccountStats() {
    const [totalAccounts, activeAccounts, inactiveAccounts, sharedAccounts] =
      await Promise.all([
        Account.countDocuments(),
        Account.countDocuments({ status: "active" }),
        Account.countDocuments({ status: "inactive" }),
        Account.countDocuments({ "sharedWith.0": { $exists: true } }),
      ]);

    return {
      total: totalAccounts,
      active: activeAccounts,
      inactive: inactiveAccounts,
      shared: sharedAccounts,
    };
  }
}

export default new AccountsService();
