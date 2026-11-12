const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createPracticeTest,
  submitPracticeTest,
} = require("../controllers/placementPracticeController");

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("student"));

router.post("/generate", createPracticeTest);
router.post("/submit", submitPracticeTest);

module.exports = router;
