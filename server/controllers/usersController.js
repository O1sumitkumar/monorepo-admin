import usersService from "../services/usersService.js";
import { catchAsync } from "../middleware/errorHandler.js";

class UsersController {
  // Get all users with pagination and search
  getAllUsers = catchAsync(async (req, res) => {
    const { page = 1, limit = 10, search = "" } = req.query;

    const result = await usersService.getAllUsers(
      parseInt(page),
      parseInt(limit),
      search
    );

    res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    });
  });

  // Get user by ID
  getUserById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const user = await usersService.getUserById(id);

    res.status(200).json({
      success: true,
      data: user,
    });
  });

  // Create new user
  createUser = catchAsync(async (req, res) => {
    const userData = req.body;

    const user = await usersService.createUser(userData);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  });

  // Update user
  updateUser = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const user = await usersService.updateUser(id, updateData);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  });

  // Delete user
  deleteUser = catchAsync(async (req, res) => {
    const { id } = req.params;

    await usersService.deleteUser(id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  });

  // Get user statistics
  getUserStats = catchAsync(async (req, res) => {
    const stats = await usersService.getUserStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  });
}

export default new UsersController();
