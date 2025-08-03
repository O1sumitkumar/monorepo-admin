import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  applicationId: { type: String, required: true, unique: true },
  description: String,
  status: { type: String, default: "active", enum: ["active", "inactive"] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Pre-save middleware to update the updatedAt field
applicationSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get active applications
applicationSchema.statics.getActiveApplications = function () {
  return this.find({ status: "active" });
};

// Instance method to toggle status
applicationSchema.methods.toggleStatus = function () {
  this.status = this.status === "active" ? "inactive" : "active";
  return this.save();
};

// Virtual for formatted creation date
applicationSchema.virtual("formattedCreatedAt").get(function () {
  return this.createdAt.toLocaleDateString();
});

// Virtual for formatted updated date
applicationSchema.virtual("formattedUpdatedAt").get(function () {
  return this.updatedAt.toLocaleDateString();
});

// Ensure virtuals are included in JSON output
applicationSchema.set("toJSON", { virtuals: true });

const Application = mongoose.model("Application", applicationSchema);

export default Application;
