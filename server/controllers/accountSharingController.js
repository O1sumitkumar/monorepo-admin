import accountSharingService from "../services/accountSharingService.js";
import { catchAsync } from "../middleware/errorHandler.js";

class AccountSharingController {
  // Get all account sharing records
  getAllAccountSharing = catchAsync(async (req, res) => {
    const { page = 1, limit = 10, search = "" } = req.query;
    const result = await accountSharingService.getAllAccountSharing(
      parseInt(page),
      parseInt(limit),
      search
    );
    res.status(200).json(result);
  });

  // Get account sharing by ID
  getAccountSharingById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await accountSharingService.getAccountSharingById(id);
    res.status(200).json(result);
  });

  // Create new account sharing
  createAccountSharing = catchAsync(async (req, res) => {
    const accountSharingData = req.body;
    const result = await accountSharingService.createAccountSharing(
      accountSharingData
    );
    res.status(201).json(result);
  });

  // Update account sharing
  updateAccountSharing = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const result = await accountSharingService.updateAccountSharing(
      id,
      updateData
    );
    res.status(200).json(result);
  });

  // Delete account sharing
  deleteAccountSharing = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await accountSharingService.deleteAccountSharing(id);
    res.status(200).json(result);
  });
}

export default new AccountSharingController();
