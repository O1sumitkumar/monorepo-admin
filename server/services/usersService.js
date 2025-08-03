import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { AppError } from "../middleware/errorHandler.js";

class UsersService {
  // Get all users with pagination and search
  async getAllUsers(page = 1, limit = 10, search = "") {
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    // Transform the data
    const transformedUsers = users.map((user) => ({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return {
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get user by ID
  async getUserById(id) {
    const user = await User.findById(id).select("-password").lean();

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // Create new user
  async createUser(userData) {
    const { username, email, password, role = "user" } = userData;

    // Check if user with same username or email already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      throw new AppError(
        "User with this username or email already exists",
        400
      );
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      role,
      status: "active",
    });

    await user.save();

    return this.getUserById(user._id);
  }

  // Update user
  async updateUser(id, updateData) {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const { username, email, password, role, status } = updateData;

    // Check if username or email is being changed and if it already exists
    if (username || email) {
      const query = {};
      if (username) query.username = username;
      if (email) query.email = email;

      const existingUser = await User.findOne({
        ...query,
        _id: { $ne: id },
      });

      if (existingUser) {
        throw new AppError(
          "User with this username or email already exists",
          400
        );
      }
    }

    // Hash password if provided
    let updateFields = { ...updateData };
    if (password) {
      const saltRounds = 10;
      updateFields.password = await bcrypt.hash(password, saltRounds);
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        ...updateFields,
        updatedAt: new Date(),
      },
      { new: true }
    );

    return this.getUserById(updatedUser._id);
  }

  // Delete user
  async deleteUser(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Prevent deletion of the last admin user
    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        throw new AppError("Cannot delete the last admin user", 400);
      }
    }

    await User.findByIdAndDelete(id);
  }

  // Get user statistics
  async getUserStats() {
    const [totalUsers, activeUsers, inactiveUsers, adminUsers, regularUsers] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ status: "active" }),
        User.countDocuments({ status: "inactive" }),
        User.countDocuments({ role: "admin" }),
        User.countDocuments({ role: "user" }),
      ]);

    return {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      admins: adminUsers,
      regular: regularUsers,
    };
  }
}

export default new UsersService();
