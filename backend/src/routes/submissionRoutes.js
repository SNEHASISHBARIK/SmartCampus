
const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const submissionUpload = require("../middleware/submissionUploadMiddleware");

const {
  getAssignmentAnalytics,
  getRecentSubmissions,
  submitAssignment,
  evaluateSubmission,
  deleteSubmission,
} = require("../controllers/submissionController");

const router = express.Router();

// All routes require authentication
router.use(protect);

// Faculty: assignment analysis summary
router.get(
  "/faculty/analytics",
  authorizeRoles("faculty"),
  getAssignmentAnalytics
);

// Faculty: recent student submissions
router.get(
  "/faculty/recent",
  authorizeRoles("faculty"),
  getRecentSubmissions
);

// Faculty: evaluate or remove a submission for their own assignments
router.patch(
  "/:submissionId/evaluate",
  authorizeRoles("faculty"),
  evaluateSubmission
);

router.delete(
  "/:submissionId",
  authorizeRoles("faculty"),
  deleteSubmission
);

// Student: submit an assignment
router.post(
  "/:assignmentId",
  authorizeRoles("student"),
  submissionUpload.single("file"),
  submitAssignment
);

module.exports = router;
