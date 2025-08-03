import express from "express";
import { v4 as uuidv4 } from "uuid";
import { Application } from "../database/init.js";

const router = express.Router();

// Get all applications with statistics
router.get("/", async (req, res) => {
  try {
    // Get applications with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { applicationId: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      };
    }

    // Get total count
    const total = await Application.countDocuments(query);

    // Get applications
    const applications = await Application.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get statistics
    const stats = await Application.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          inactive: {
            $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] },
          },
        },
      },
    ]);

    const statistics = stats[0] || { total: 0, active: 0, inactive: 0 };

    res.json({
      applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      statistics,
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

// Get single application
router.get("/:id", async (req, res) => {
  try {
    const application = await Application.findOne({ id: req.params.id });

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json(application);
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({ error: "Failed to fetch application" });
  }
});

// Create new application
router.post("/", async (req, res) => {
  try {
    const { name, applicationId, description, status = "active" } = req.body;

    if (!name || !applicationId) {
      return res
        .status(400)
        .json({ error: "Name and applicationId are required" });
    }

    // Check if applicationId already exists
    const existing = await Application.findOne({ applicationId });

    if (existing) {
      return res.status(409).json({ error: "Application ID already exists" });
    }

    const id = uuidv4();
    const now = new Date();

    const newApplication = new Application({
      id,
      name,
      applicationId,
      description,
      status,
      createdAt: now,
      updatedAt: now,
    });

    await newApplication.save();

    res.status(201).json(newApplication);
  } catch (error) {
    console.error("Error creating application:", error);
    res.status(500).json({ error: "Failed to create application" });
  }
});

// Update application
router.put("/:id", async (req, res) => {
  try {
    const { name, applicationId, description, status } = req.body;

    // Check if application exists
    const existing = await Application.findOne({ id: req.params.id });

    if (!existing) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Check if new applicationId conflicts with existing
    if (applicationId) {
      const conflict = await Application.findOne({
        applicationId,
        id: { $ne: req.params.id },
      });

      if (conflict) {
        return res.status(409).json({ error: "Application ID already exists" });
      }
    }

    const updateData = {
      ...(name && { name }),
      ...(applicationId && { applicationId }),
      ...(description !== undefined && { description }),
      ...(status && { status }),
      updatedAt: new Date(),
    };

    const updatedApplication = await Application.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true }
    );

    res.json(updatedApplication);
  } catch (error) {
    console.error("Error updating application:", error);
    res.status(500).json({ error: "Failed to update application" });
  }
});

// Delete application
router.delete("/:id", async (req, res) => {
  try {
    // Check if application exists
    const existing = await Application.findOne({ id: req.params.id });

    if (!existing) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Check if application has associated rights
    const { Rights } = await import("../database/init.js");
    const rightsCount = await Rights.countDocuments({
      applicationId: req.params.id,
    });

    if (rightsCount > 0) {
      return res.status(400).json({
        error:
          "Cannot delete application with associated rights. Please remove all rights first.",
      });
    }

    await Application.findOneAndDelete({ id: req.params.id });

    res.json({ message: "Application deleted successfully" });
  } catch (error) {
    console.error("Error deleting application:", error);
    res.status(500).json({ error: "Failed to delete application" });
  }
});

// Get application statistics
router.get("/stats/overview", async (req, res) => {
  try {
    const stats = await Application.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          inactive: {
            $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] },
          },
        },
      },
    ]);

    const statistics = stats[0] || { total: 0, active: 0, inactive: 0 };

    // Get recent applications
    const recentApplications = await Application.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("id name applicationId status createdAt");

    res.json({
      statistics,
      recentApplications,
    });
  } catch (error) {
    console.error("Error fetching application statistics:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

export default router;
