import { body, param, query, validationResult } from "express-validator";
import mongoose from "mongoose";

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("❌ [VALIDATION] Validation failed:", {
      path: req.path,
      method: req.method,
      errors: errors.array(),
      params: req.params,
      query: req.query,
      body: req.body,
    });
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      })),
    });
  }
  console.log("✅ [VALIDATION] Validation passed for:", req.method, req.path);
  next();
};

// Custom validator for MongoDB ObjectId
const isValidObjectId = (value) => {
  const isValid = mongoose.Types.ObjectId.isValid(value);
  console.log("🔍 [VALIDATION] ObjectId validation:", { value, isValid });
  return isValid;
};

// Validation rules for user registration
export const validateUserRegistration = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),

  body("role")
    .optional()
    .isIn(["admin", "user"])
    .withMessage("Role must be either 'admin' or 'user'"),

  handleValidationErrors,
];

// Validation rules for user login
export const validateUserLogin = [
  body("username").trim().notEmpty().withMessage("Username is required"),

  body("password").notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];

// Validation rules for application creation/update
export const validateApplication = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Application name must be between 2 and 100 characters"),

  body("applicationId")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Application ID must be between 2 and 50 characters")
    .matches(/^[a-z0-9-]+$/)
    .withMessage(
      "Application ID can only contain lowercase letters, numbers, and hyphens"
    ),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be either 'active' or 'inactive'"),

  handleValidationErrors,
];

// Validation rules for account creation/update
export const validateAccount = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Account name must be between 2 and 100 characters"),

  body("accountId")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Account ID must be between 3 and 100 characters"),

  body("accountType")
    .isIn(["Temporary", "Personal", "Business"]) // Updated to match frontend
    .withMessage("Account type must be 'Temporary', 'Personal', or 'Business'"),

  handleValidationErrors,
];

// Validation rules for rights creation/update
export const validateRights = [
  body("applicationId")
    .trim()
    .notEmpty()
    .withMessage("Application ID is required")
    .custom((value) => {
      const isValid = isValidObjectId(value);
      return isValid;
    })
    .withMessage("Invalid Application ID format"),

  body("accountId")
    .trim()
    .notEmpty()
    .withMessage("Account ID is required")
    .custom((value) => {
      const isValid = isValidObjectId(value);
      return isValid;
    })
    .withMessage("Invalid Account ID format"),

  body("permissions")
    .isArray({ min: 1 })
    .withMessage("At least one permission is required")
    .custom((value) => {
      const validPermissions = ["read", "write", "admin", "owner"]; // Updated permission levels
      return value.every((permission) => validPermissions.includes(permission));
    })
    .withMessage(
      "Invalid permissions. Must be one of: read, write, admin, owner"
    ),

  body("expiresAt")
    .optional()
    .isISO8601()
    .withMessage("Expiration date must be a valid ISO 8601 date"),

  handleValidationErrors,
];

// Validation rules for ID parameters
export const validateId = [
  (req, res, next) => {
    console.log(
      "🔍 [VALIDATION] validateId middleware called for:",
      req.method,
      req.path,
      "with params:",
      req.params
    );
    next();
  },
  param("id")
    .trim()
    .notEmpty()
    .withMessage("ID parameter is required")
    .custom(isValidObjectId)
    .withMessage("Invalid ID format"),

  handleValidationErrors,
];

// Validation rules for pagination
export const validatePagination = [
  (req, res, next) => {
    console.log(
      "🔍 [VALIDATION] validatePagination middleware called for:",
      req.method,
      req.path,
      "with query:",
      req.query
    );
    next();
  },
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search term must not exceed 100 characters"),

  handleValidationErrors,
];

// Validation rules for account sharing
export const validateAccountSharing = [
  body("sourceAccountId")
    .trim()
    .notEmpty()
    .withMessage("Source account ID is required"),

  body("targetAccountId")
    .trim()
    .notEmpty()
    .withMessage("Target account ID is required"),

  body("expiresAt")
    .optional()
    .isISO8601()
    .withMessage("Expiration date must be a valid date"),

  handleValidationErrors,
];

// Validation for automated rights
export const validateAutomatedRights = [
  body("userId")
    .notEmpty()
    .withMessage("userId is required")
    .isMongoId()
    .withMessage("userId must be a valid MongoDB ObjectId"),
  body("applicationId")
    .notEmpty()
    .withMessage("applicationId is required")
    .isMongoId()
    .withMessage("applicationId must be a valid MongoDB ObjectId"),
  body("accountId")
    .optional()
    .isMongoId()
    .withMessage("accountId must be a valid MongoDB ObjectId"),
  body("permissions")
    .optional()
    .isArray()
    .withMessage("permissions must be an array"),
  handleValidationErrors,
];

// Sanitization middleware
export const sanitizeInput = (req, res, next) => {
  // Sanitize string inputs
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim();
      }
    });
  }

  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === "string") {
        req.query[key] = req.query[key].trim();
      }
    });
  }

  next();
};

export default {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateApplication,
  validateAccount,
  validateRights,
  validateId,
  validatePagination,
  validateAccountSharing,
  validateAutomatedRights,
  sanitizeInput,
};
