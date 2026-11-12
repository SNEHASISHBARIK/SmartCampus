const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createSubject,
  getSubjects,
  getSubject,
  updateSubject,
  deactivateSubject,
} = require("../controllers/subjectAdminController");

const router = express.Router();

// Authentication
router.use(protect);

// Admin only
router.use(authorizeRoles("admin"));

// Create subject
router.post("/", createSubject);

// Get all subjects
router.get("/", getSubjects);

// Get single subject
router.get("/:id", getSubject);

// Update subject
router.put("/:id", updateSubject);

// Deactivate subject
router.patch("/:id/deactivate", deactivateSubject);

module.exports = router;