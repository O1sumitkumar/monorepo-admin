import AccountSharing from "../models/AccountSharing.js";
import Account from "../models/Account.js";
import { AppError } from "../middleware/errorHandler.js";

class AccountSharingService {
  // Get all account sharing records with pagination and search
  async getAllAccountSharing(page = 1, limit = 10, search = "") {
    try {
      const skip = (page - 1) * limit;
      let query = {};

      // Add search functionality
      if (search) {
        query = {
          $or: [
            { sourceAccountId: { $regex: search, $options: "i" } },
            { targetAccountId: { $regex: search, $options: "i" } },
          ],
        };
      }

      const [accountSharing, total] = await Promise.all([
        AccountSharing.find(query)
          .populate("sourceAccountId", "name accountId")
          .populate("targetAccountId", "name accountId")
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        AccountSharing.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: accountSharing,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
        message: `Found ${accountSharing.length} account sharing records`,
      };
    } catch (error) {
      throw new AppError(
        `Failed to get account sharing records: ${error.message}`,
        error.statusCode || 500
      );
    }
  }

  // Get account sharing by ID
  async getAccountSharingById(id) {
    try {
      const accountSharing = await AccountSharing.findById(id)
        .populate("sourceAccountId", "name accountId email")
        .populate("targetAccountId", "name accountId email");

      if (!accountSharing) {
        throw new AppError("Account sharing record not found", 404);
      }

      return {
        success: true,
        data: accountSharing,
        message: "Account sharing record found",
      };
    } catch (error) {
      throw new AppError(
        `Failed to get account sharing record: ${error.message}`,
        error.statusCode || 500
      );
    }
  }

  // Create new account sharing
  async createAccountSharing(accountSharingData) {
    try {
      // Validate that both accounts exist
      const [sourceAccount, targetAccount] = await Promise.all([
        Account.findById(accountSharingData.sourceAccountId),
        Account.findById(accountSharingData.targetAccountId),
      ]);

      if (!sourceAccount) {
        throw new AppError("Source account not found", 404);
      }

      if (!targetAccount) {
        throw new AppError("Target account not found", 404);
      }

      // Check if sharing already exists
      const existingSharing = await AccountSharing.findOne({
        sourceAccountId: accountSharingData.sourceAccountId,
        targetAccountId: accountSharingData.targetAccountId,
      });

      if (existingSharing) {
        throw new AppError(
          "Account sharing already exists between these accounts",
          400
        );
      }

      const accountSharing = new AccountSharing(accountSharingData);
      await accountSharing.save();

      // Populate the created record
      const populatedAccountSharing = await AccountSharing.findById(
        accountSharing._id
      )
        .populate("sourceAccountId", "name accountId")
        .populate("targetAccountId", "name accountId");

      return {
        success: true,
        data: populatedAccountSharing,
        message: "Account sharing created successfully",
      };
    } catch (error) {
      throw new AppError(
        `Failed to create account sharing: ${error.message}`,
        error.statusCode || 500
      );
    }
  }

  // Update account sharing
  async updateAccountSharing(id, updateData) {
    try {
      const accountSharing = await AccountSharing.findById(id);

      if (!accountSharing) {
        throw new AppError("Account sharing record not found", 404);
      }

      // Update the record
      Object.assign(accountSharing, updateData);
      await accountSharing.save();

      // Populate the updated record
      const updatedAccountSharing = await AccountSharing.findById(id)
        .populate("sourceAccountId", "name accountId")
        .populate("targetAccountId", "name accountId");

      return {
        success: true,
        data: updatedAccountSharing,
        message: "Account sharing updated successfully",
      };
    } catch (error) {
      throw new AppError(
        `Failed to update account sharing: ${error.message}`,
        error.statusCode || 500
      );
    }
  }

  // Delete account sharing
  async deleteAccountSharing(id) {
    try {
      const accountSharing = await AccountSharing.findByIdAndDelete(id);

      if (!accountSharing) {
        throw new AppError("Account sharing record not found", 404);
      }

      return {
        success: true,
        message: "Account sharing deleted successfully",
      };
    } catch (error) {
      throw new AppError(
        `Failed to delete account sharing: ${error.message}`,
        error.statusCode || 500
      );
    }
  }
}

export default new AccountSharingService();
