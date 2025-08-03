import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const rightsSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Application",
    required: true,
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  rightsCode: { type: String, unique: true }, // Made optional, will be auto-generated
  permissions: {
    type: [String],
    required: true,
    default: [],
    enum: ["read", "write", "admin", "owner"], // Updated permission levels
  },
  expiresAt: Date,
  status: {
    type: String,
    default: "active",
    enum: ["active", "inactive", "expired"],
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Ensure unique constraint for applicationId + accountId combination
rightsSchema.index({ applicationId: 1, accountId: 1 }, { unique: true });

// Pre-save middleware to update the updatedAt field and generate rightsCode
rightsSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Generate JWT rightsCode if not exists
  if (!this.rightsCode) {
    this.rightsCode = this.generateRightsCode();
  }

  // Determine status based on expiration
  if (this.expiresAt && new Date(this.expiresAt) < new Date()) {
    this.status = "expired";
  } else if (
    this.status === "expired" &&
    this.expiresAt &&
    new Date(this.expiresAt) > new Date()
  ) {
    this.status = "active";
  }

  next();
});

// Instance method to generate JWT rights code
rightsSchema.methods.generateRightsCode = function () {
  const payload = {
    applicationId: this.applicationId,
    accountId: this.accountId,
    permissions: this.permissions,
    expiresAt: this.expiresAt,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: this.expiresAt
      ? Math.floor((new Date(this.expiresAt) - new Date()) / 1000)
      : "1y",
  });
};

// Instance method to verify JWT rights code
rightsSchema.methods.verifyRightsCode = function (token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
  } catch (error) {
    return null;
  }
};

// Instance method to check if rights are expired
rightsSchema.methods.isExpired = function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Instance method to check if user has specific permission
rightsSchema.methods.hasPermission = function (permission) {
  return this.permissions.includes(permission);
};

// Instance method to add permission
rightsSchema.methods.addPermission = function (permission) {
  if (!this.permissions.includes(permission)) {
    this.permissions.push(permission);
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to remove permission
rightsSchema.methods.removePermission = function (permission) {
  this.permissions = this.permissions.filter((p) => p !== permission);
  return this.save();
};

// Static method to find rights by application and account
rightsSchema.statics.findByApplicationAndAccount = function (
  applicationId,
  accountId
) {
  return this.findOne({ applicationId, accountId });
};

// Static method to find active rights (not expired)
rightsSchema.statics.findActiveRights = function () {
  return this.find({
    status: "active",
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ],
  });
};

// Static method to find expired rights
rightsSchema.statics.findExpiredRights = function () {
  return this.find({
    status: "expired",
    expiresAt: { $exists: true, $lt: new Date() },
  });
};

// Static method to verify rights code
rightsSchema.statics.verifyRightsCode = function (rightsCode) {
  try {
    const decoded = jwt.verify(
      rightsCode,
      process.env.JWT_SECRET || "your-secret-key"
    );
    return this.findById(decoded.id);
  } catch (error) {
    return null;
  }
};

// Virtual for formatted creation date
rightsSchema.virtual("formattedCreatedAt").get(function () {
  return this.createdAt.toLocaleDateString();
});

// Virtual for formatted updated date
rightsSchema.virtual("formattedUpdatedAt").get(function () {
  return this.updatedAt.toLocaleDateString();
});

// Virtual for formatted expiration date
rightsSchema.virtual("formattedExpiresAt").get(function () {
  return this.expiresAt ? this.expiresAt.toLocaleDateString() : "Never";
});

// Ensure virtuals are included in JSON output
rightsSchema.set("toJSON", { virtuals: true });

const Rights = mongoose.model("Rights", rightsSchema);

export default Rights;
