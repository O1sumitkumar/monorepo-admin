import accountsService from "../services/accountsService.js";
import { catchAsync } from "../middleware/errorHandler.js";

class AccountsController {
  // Get all accounts with pagination and search
  getAllAccounts = catchAsync(async (req, res) => {
    const { page = 1, limit = 10, search = "" } = req.query;

    const result = await accountsService.getAllAccounts(
      parseInt(page),
      parseInt(limit),
      search
    );

    res.status(200).json({
      success: true,
      data: result.accounts,
      pagination: result.pagination,
    });
  });

  // Get account by ID
  getAccountById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const account = await accountsService.getAccountById(id);

    res.status(200).json({
      success: true,
      data: account,
    });
  });

  // Create new account
  createAccount = catchAsync(async (req, res) => {
    const accountData = req.body;

    const account = await accountsService.createAccount(accountData);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: account,
    });
  });

  // Update account
  updateAccount = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const account = await accountsService.updateAccount(id, updateData);

    res.status(200).json({
      success: true,
      message: "Account updated successfully",
      data: account,
    });
  });

  // Delete account
  deleteAccount = catchAsync(async (req, res) => {
    const { id } = req.params;

    await accountsService.deleteAccount(id);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  });

  // Share account
  shareAccount = catchAsync(async (req, res) => {
    const { id } = req.params;
    const shareData = req.body;

    const account = await accountsService.shareAccount(id, shareData);

    res.status(200).json({
      success: true,
      message: "Account shared successfully",
      data: account,
    });
  });

  // Get account statistics
  getAccountStats = catchAsync(async (req, res) => {
    const stats = await accountsService.getAccountStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  });
}

export default new AccountsController();
