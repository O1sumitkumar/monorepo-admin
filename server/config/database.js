import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Application from "../models/Application.js";
import User from "../models/User.js";
import Account from "../models/Account.js";
import Rights from "../models/Rights.js";

let db;

// MongoDB connection URI
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/app-admin";

export const getDatabase = () => db;

export const initializeDatabase = async () => {
  try {
    console.log("🔗 Attempting to connect to local MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB successfully");

    // Check if sample data already exists
    const existingData = await Application.countDocuments();
    if (existingData > 0) {
      console.log("📊 Sample data already exists, skipping...");

      // Clean up any invalid data
      await cleanupInvalidData();

      return;
    }

    console.log("📊 Sample data not found, inserting...");
    await insertSampleData();
    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize database:", error);
    throw error;
  }
};

const insertSampleData = async () => {
  try {
    // Check if sample data already exists
    const appCount = await Application.countDocuments();
    if (appCount > 0) {
      console.log("📊 Sample data already exists, skipping...");
      return;
    }

    // Insert sample applications
    const sampleApplications = [
      {
        name: "APP-X",
        applicationId: "app-x",
        description: "Main application for user management",
        status: "active",
      },
      {
        name: "APP-Y",
        applicationId: "app-y",
        description: "Analytics and reporting application",
        status: "active",
      },
      {
        name: "APP-Z",
        applicationId: "app-z",
        description: "Communication and messaging platform",
        status: "inactive",
      },
    ];

    await Application.insertMany(sampleApplications);

    // Insert sample users
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Get the first account to assign to the admin user
    const firstAccount = await Account.findOne();
    if (!firstAccount) {
      throw new Error("No accounts found to assign to admin user");
    }

    await User.create({
      username: "admin",
      email: "admin@app-admin.com",
      password: hashedPassword,
      role: "admin",
      status: "active",
      accountId: firstAccount._id,
    });

    // Insert sample accounts
    const sampleAccounts = [
      {
        name: "John Doe",
        accountId: "john-doe-001",
        email: "john@example.com",
        description: "Personal account for John Doe",
        accountType: "Personal", // Updated to match frontend
        status: "active",
        sharedAccounts: [],
      },
      {
        name: "Acme Corp",
        accountId: "acme-corp-001",
        email: "admin@acme.com",
        description: "Business account for Acme Corporation",
        accountType: "Business", // Updated to match frontend
        status: "active",
        sharedAccounts: [],
      },
      {
        name: "Jane Smith",
        accountId: "jane-smith-001",
        email: "jane@example.com",
        description: "Personal account for Jane Smith",
        accountType: "Personal", // Updated to match frontend
        status: "active",
        sharedAccounts: [],
      },
      {
        name: "Temp User",
        accountId: "temp-user-001",
        email: "temp@example.com",
        description: "Temporary account for testing",
        accountType: "Temporary", // Added temporary account type
        status: "active",
        sharedAccounts: [],
      },
    ];

    await Account.insertMany(sampleAccounts);

    // Get the created applications and accounts for rights creation
    const apps = await Application.find();
    const accounts = await Account.find();

    if (apps.length > 0 && accounts.length > 0) {
      // Insert sample rights
      const sampleRights = [
        {
          applicationId: apps[0]._id, // APP-X
          accountId: accounts[0]._id, // John Doe
          permissions: ["read", "write"],
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          status: "active",
        },
        {
          applicationId: apps[1]._id, // APP-Y
          accountId: accounts[1]._id, // Acme Corp
          permissions: ["read", "write", "admin"],
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          status: "active",
        },
      ];

      await Rights.insertMany(sampleRights);
    }

    console.log("✅ Sample data inserted successfully");
  } catch (error) {
    console.error("❌ Failed to insert sample data:", error);
  }
};

// Clean up old data with invalid ObjectIds
const cleanupInvalidData = async () => {
  try {
    console.log("🧹 Cleaning up invalid data...");

    // Drop any unique constraints on Rights collection
    try {
      await mongoose.connection.db.collection("rights").dropIndexes();
      console.log("🗑️ Dropped all indexes on Rights collection");
    } catch (error) {
      console.log("ℹ️ No indexes to drop on Rights collection");
    }

    // Remove any rights with invalid ObjectIds
    const invalidRights = await Rights.find({
      $or: [
        { applicationId: { $type: "string" } },
        { accountId: { $type: "string" } },
      ],
    });

    if (invalidRights.length > 0) {
      console.log(
        `🗑️ Removing ${invalidRights.length} rights with invalid ObjectIds`
      );
      await Rights.deleteMany({
        $or: [
          { applicationId: { $type: "string" } },
          { accountId: { $type: "string" } },
        ],
      });
    }

    // Remove any applications with invalid ObjectIds
    const invalidApplications = await Application.find({
      _id: { $type: "string" },
    });

    if (invalidApplications.length > 0) {
      console.log(
        `🗑️ Removing ${invalidApplications.length} applications with invalid ObjectIds`
      );
      await Application.deleteMany({
        _id: { $type: "string" },
      });
    }

    // Remove any accounts with invalid ObjectIds
    const invalidAccounts = await Account.find({
      _id: { $type: "string" },
    });

    if (invalidAccounts.length > 0) {
      console.log(
        `🗑️ Removing ${invalidAccounts.length} accounts with invalid ObjectIds`
      );
      await Account.deleteMany({
        _id: { $type: "string" },
      });
    }

    console.log("✅ Data cleanup completed");
  } catch (error) {
    console.error("❌ Failed to cleanup data:", error);
  }
};

export default {
  initializeDatabase,
  getDatabase,
};
