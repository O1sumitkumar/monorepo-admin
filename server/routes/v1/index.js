import express from "express";
import authRoutes from "./auth.js";
import applicationsRoutes from "./applications.js";
import rightsRoutes from "./rights.js";
import accountsRoutes from "./accounts.js";
import usersRoutes from "./users.js";
import accountSharingRoutes from "./accountSharing.js";
import automatedRightsRoutes from "./automatedRights.js";

const router = express.Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    version: "v1",
  });
});

// Mount routes
router.use("/auth", authRoutes);
router.use("/applications", applicationsRoutes);
router.use("/rights", rightsRoutes);
router.use("/accounts", accountsRoutes);
router.use("/users", usersRoutes);
router.use("/account-sharing", accountSharingRoutes);
router.use("/automated-rights", automatedRightsRoutes);

export default router;
