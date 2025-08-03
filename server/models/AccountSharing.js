import mongoose from "mongoose";

const accountSharingSchema = new mongoose.Schema({
  sourceAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  targetAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  permissions: {
    type: [String],
    enum: ["read", "write", "admin"],
    default: ["read"],
  },
  status: {
    type: String,
    enum: ["active", "inactive", "pending"],
    default: "active",
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  description: {
    type: String,
    maxlength: 500,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
accountSharingSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Create a compound index to ensure unique sharing relationships
accountSharingSchema.index(
  { sourceAccountId: 1, targetAccountId: 1 },
  { unique: true }
);

// Virtual for formatted creation date
accountSharingSchema.virtual("formattedCreatedAt").get(function () {
  return this.createdAt.toLocaleDateString();
});

// Virtual for formatted updated date
accountSharingSchema.virtual("formattedUpdatedAt").get(function () {
  return this.updatedAt.toLocaleDateString();
});

// Virtual for checking if sharing is expired
accountSharingSchema.virtual("isExpired").get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Ensure virtuals are included in JSON output
accountSharingSchema.set("toJSON", { virtuals: true });

const AccountSharing = mongoose.model("AccountSharing", accountSharingSchema);

export default AccountSharing;
