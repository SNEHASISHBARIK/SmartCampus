const express = require("express");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const {
  evaluateInterview,
  getInterviewHistory,
  getInterviewAttempt,
} = require("../controllers/mockInterviewController");

const router = express.Router();

// Require logged-in student authentication
router.use(protect);
router.use(authorizeRoles("student"));

router.post("/evaluate", evaluateInterview);
router.get("/history", getInterviewHistory);
router.get("/attempt/:id", getInterviewAttempt);

module.exports = router;
