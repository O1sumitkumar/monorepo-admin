import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user", enum: ["admin", "user", "manager"] },
  status: { type: String, default: "active", enum: ["active", "inactive"] },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  keycloakId: { type: String, sparse: true }, // Keycloak user ID for external auth
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Pre-save middleware to hash password and update updatedAt
userSchema.pre("save", async function (next) {
  this.updatedAt = new Date();

  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    // Hash password with salt rounds of 10
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to change password
userSchema.methods.changePassword = async function (newPassword) {
  this.password = newPassword;
  return this.save();
};

// Static method to find by username
userSchema.statics.findByUsername = function (username) {
  return this.findOne({ username });
};

// Static method to find by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email });
};

// Virtual for formatted creation date
userSchema.virtual("formattedCreatedAt").get(function () {
  return this.createdAt.toLocaleDateString();
});

// Virtual for formatted updated date
userSchema.virtual("formattedUpdatedAt").get(function () {
  return this.updatedAt.toLocaleDateString();
});

// Ensure virtuals are included in JSON output
userSchema.set("toJSON", { virtuals: true });

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.model("User", userSchema);

export default User;
