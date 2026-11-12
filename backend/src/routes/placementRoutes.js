const express = require("express");
const Placement = require("../models/Placement");

const router = express.Router();


const protect = require("../middleware/authMiddleware");
const StudentPlacementActivity = require("../models/StudentPlacementActivity");
const mongoose = require("mongoose");


// GET /api/placements
router.get("/", async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 12, 1),
      50
    );

    const search = String(req.query.search || "").trim();
    const filter = { isActive: true };

    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { company: { $regex: safeSearch, $options: "i" } },
        { location: { $regex: safeSearch, $options: "i" } },
        { category: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const [jobs, total] = await Promise.all([
      Placement.find(filter)
        .sort({ postedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Placement.countDocuments(filter),
    ]);

    res.json({
      success: true,
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Fetch placements error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to load placement listings",
    });
  }
});



/* GET /api/placements/saved
   Return the current user's saved jobs. */
router.get("/saved", protect, async (req, res) => {
  try {
    const records = await StudentPlacementActivity.find({
      user: req.user._id,
      isSaved: true,
    })
      .populate("placement")
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      jobs: records
        .filter((record) => record.placement && record.placement.isActive)
        .map((record) => ({
          ...record.placement,
          isSaved: true,
          applicationStatus: record.applicationStatus,
        })),
    });
  } catch (error) {
    console.error("Saved jobs error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to load saved jobs",
    });
  }
});

/* POST /api/placements/:jobId/save
   Save a job or remove it from saved jobs. */
router.post("/:jobId/save", protect, async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID",
      });
    }

    const job = await Placement.findOne({
      _id: jobId,
      isActive: true,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const existing = await StudentPlacementActivity.findOne({
      user: req.user._id,
      placement: job._id,
    });

    if (existing?.isSaved) {
      existing.isSaved = false;

      // Keep the record if application tracking data exists.
      if (existing.applicationStatus || existing.notes) {
        await existing.save();
      } else {
        await existing.deleteOne();
      }

      return res.json({
        success: true,
        isSaved: false,
        message: "Job removed from saved jobs",
      });
    }

    const activity =
      existing ||
      new StudentPlacementActivity({
        user: req.user._id,
        placement: job._id,
      });

    activity.isSaved = true;
    await activity.save();

    res.json({
      success: true,
      isSaved: true,
      message: "Job saved successfully",
    });
  } catch (error) {
    console.error("Save job error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to update saved job",
    });
  }
});

/* GET /api/placements/applications
   Return the current user's tracked applications. */
router.get("/applications", protect, async (req, res) => {
  try {
    const records = await StudentPlacementActivity.find({
      user: req.user._id,
      applicationStatus: { $ne: null },
    })
      .populate("placement")
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      applications: records
        .filter((record) => record.placement)
        .map((record) => ({
          ...record.placement,
          applicationStatus: record.applicationStatus,
          appliedAt: record.appliedAt,
          notes: record.notes,
        })),
    });
  } catch (error) {
    console.error("Applications error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to load applications",
    });
  }
});

/* PUT /api/placements/:jobId/application
   Create or update the current user's application tracking record. */
router.put("/:jobId/application", protect, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status, notes, appliedAt } = req.body;

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID",
      });
    }

    const allowedStatuses = [
      "Applied",
      "Assessment",
      "Interview",
      "Selected",
      "Rejected",
      "Withdrawn",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application status",
      });
    }

    if (notes !== undefined && (
      typeof notes !== "string" || notes.length > 2000
    )) {
      return res.status(400).json({
        success: false,
        message: "Notes must be text up to 2000 characters",
      });
    }

    if (appliedAt !== undefined && (
      typeof appliedAt !== "string" || Number.isNaN(Date.parse(appliedAt))
    )) {
      return res.status(400).json({
        success: false,
        message: "Invalid application date",
      });
    }

    const job = await Placement.findOne({
      _id: jobId,
      isActive: true,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const update = {
      applicationStatus: status,
    };

    if (notes !== undefined) {
      update.notes = notes.trim();
    }

    if (appliedAt !== undefined) {
      update.appliedAt = new Date(appliedAt);
    } else if (status === "Applied") {
      update.appliedAt = new Date();
    }

    const activity = await StudentPlacementActivity.findOneAndUpdate(
      {
        user: req.user._id,
        placement: job._id,
      },
      {
        $set: update,
        $setOnInsert: {
          user: req.user._id,
          placement: job._id,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json({
      success: true,
      application: {
        jobId: job._id,
        status: activity.applicationStatus,
        appliedAt: activity.appliedAt,
        notes: activity.notes,
      },
    });
  } catch (error) {
    console.error("Update application error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to update application",
    });
  }
});


module.exports = router;