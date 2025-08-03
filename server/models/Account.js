import mongoose from "mongoose";

const accountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  accountId: { type: String, required: true, unique: true },
  email: { type: String },
  description: { type: String },
  accountType: {
    type: String,
    required: true,
    enum: ["Temporary", "Personal", "Business"], // Updated to match frontend
    default: "Personal",
  },
  status: {
    type: String,
    required: true,
    enum: ["active", "inactive"],
    default: "active",
  },
  sharedAccounts: { type: [String], default: [] }, // Renamed to match frontend
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Pre-save middleware to update the updatedAt field
accountSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to add shared account
accountSchema.methods.addSharedAccount = function (accountId) {
  if (!this.sharedAccounts.includes(accountId)) {
    this.sharedAccounts.push(accountId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to remove shared account
accountSchema.methods.removeSharedAccount = function (accountId) {
  this.sharedAccounts = this.sharedAccounts.filter((id) => id !== accountId);
  return this.save();
};

// Instance method to check if account is shared with another account
accountSchema.methods.isSharedWith = function (accountId) {
  return this.sharedAccounts.includes(accountId);
};

// Static method to get accounts by type
accountSchema.statics.getByType = function (accountType) {
  return this.find({ accountType });
};

// Static method to get accounts with shared access
accountSchema.statics.getWithSharedAccess = function () {
  return this.find({ sharedAccounts: { $exists: true, $ne: [] } });
};

// Virtual for formatted creation date
accountSchema.virtual("formattedCreatedAt").get(function () {
  return this.createdAt.toLocaleDateString();
});

// Virtual for formatted updated date
accountSchema.virtual("formattedUpdatedAt").get(function () {
  return this.updatedAt.toLocaleDateString();
});

// Virtual for shared accounts count
accountSchema.virtual("sharedAccountsCount").get(function () {
  return this.sharedAccounts.length;
});

// Ensure virtuals are included in JSON output
accountSchema.set("toJSON", { virtuals: true });

const Account = mongoose.model("Account", accountSchema);

export default Account;
