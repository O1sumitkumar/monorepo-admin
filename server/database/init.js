import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// MongoDB connection
let db;

export const getDatabase = () => db;

export const initializeDatabase = async () => {
  try {
    // Connect to MongoDB - try cloud instance first, then local
    let mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      // Try local MongoDB first
      mongoUri = "mongodb://localhost:27017/app-admin";
      console.log("🔗 Attempting to connect to local MongoDB...");
    } else {
      console.log("🔗 Connecting to cloud MongoDB...");
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000, // 45 second timeout
    });

    db = mongoose.connection;

    console.log("✅ Connected to MongoDB successfully");

    // Create models
    await createModels();

    // Insert sample data
    await insertSampleData();

    console.log("✅ Database models created successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.log(
      "💡 To use this application, you need MongoDB installed and running."
    );
    console.log("💡 Options:");
    console.log(
      "   1. Install MongoDB locally: https://docs.mongodb.com/manual/installation/"
    );
    console.log(
      "   2. Use MongoDB Atlas (cloud): https://www.mongodb.com/atlas"
    );
    console.log("   3. Set MONGODB_URI environment variable");
    console.log(
      "   4. Use Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest"
    );
    throw error;
  }
};

// Define schemas
const applicationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  applicationId: { type: String, required: true, unique: true },
  description: String,
  status: { type: String, default: "active", enum: ["active", "inactive"] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user", enum: ["admin", "user"] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const accountSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  accountId: { type: String, required: true, unique: true },
  accountType: {
    type: String,
    required: true,
    enum: ["Temporary", "Personal", "Business"],
  },
  sharedAccounts: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const rightsSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  applicationId: { type: String, required: true },
  accountId: { type: String, required: true },
  rightsCode: { type: String, required: true },
  permissions: { type: String, required: true },
  expiresAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const accountSharingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sourceAccountId: { type: String, required: true },
  targetAccountId: { type: String, required: true },
  status: {
    type: String,
    default: "pending",
    enum: ["pending", "active", "revoked"],
  },
  invitedBy: { type: String, required: true },
  invitedAt: { type: Date, default: Date.now },
  expiresAt: Date,
});

// Create models
const Application = mongoose.model("Application", applicationSchema);
const User = mongoose.model("User", userSchema);
const Account = mongoose.model("Account", accountSchema);
const Rights = mongoose.model("Rights", rightsSchema);
const AccountSharing = mongoose.model("AccountSharing", accountSharingSchema);

// Export models
export { Application, User, Account, Rights, AccountSharing };

const createModels = async () => {
  // Models are created automatically when defined
  console.log("✅ MongoDB models created");
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
        id: "app-001",
        name: "APP-X",
        applicationId: "app-x",
        description: "Main application for user management",
        status: "active",
      },
      {
        id: "app-002",
        name: "APP-Y",
        applicationId: "app-y",
        description: "Analytics and reporting application",
        status: "active",
      },
      {
        id: "app-003",
        name: "APP-Z",
        applicationId: "app-z",
        description: "Communication and messaging platform",
        status: "inactive",
      },
    ];

    await Application.insertMany(sampleApplications);

    // Insert sample users
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await User.create({
      id: "user-001",
      username: "admin",
      email: "admin@app-admin.com",
      password: hashedPassword,
      role: "admin",
    });

    // Insert sample accounts
    const sampleAccounts = [
      {
        id: "acc-001",
        name: "John Doe",
        accountId: "john.doe@company.com",
        accountType: "Personal",
        sharedAccounts: [],
      },
      {
        id: "acc-002",
        name: "Acme Corp",
        accountId: "admin@acme.com",
        accountType: "Business",
        sharedAccounts: ["acc-001"],
      },
      {
        id: "acc-003",
        name: "Temporary User",
        accountId: "temp@company.com",
        accountType: "Temporary",
        sharedAccounts: [],
      },
    ];

    await Account.insertMany(sampleAccounts);

    // Insert sample rights
    const sampleRights = [
      {
        id: "right-001",
        applicationId: "app-001",
        accountId: "acc-001",
        rightsCode: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sample-jwt-token-1",
        permissions: JSON.stringify(["read", "write"]),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      {
        id: "right-002",
        applicationId: "app-002",
        accountId: "acc-002",
        rightsCode: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sample-jwt-token-2",
        permissions: JSON.stringify(["read", "write", "admin"]),
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      },
    ];

    await Rights.insertMany(sampleRights);

    // Insert sample account sharing
    await AccountSharing.create({
      id: "share-001",
      sourceAccountId: "acc-002",
      targetAccountId: "acc-001",
      status: "active",
      invitedBy: "admin",
    });

    console.log("✅ Sample data inserted successfully");
  } catch (error) {
    console.error("❌ Failed to insert sample data:", error);
  }
};
