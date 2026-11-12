const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createExam,
  getExams,
  getExam,
  updateExam,
  deleteExam,
} = require("../controllers/examAdminController");

const router = express.Router();

// Authentication
router.use(protect);

// Admin only
router.use(authorizeRoles("admin"));

// Create exam
router.post("/", createExam);

// Get all exams
router.get("/", getExams);

// Get single exam
router.get("/:id", getExam);

// Update exam
router.put("/:id", updateExam);

// Delete exam
router.delete("/:id", deleteExam);

module.exports = router;