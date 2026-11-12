const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createExam,
  getExams,
  updateExam,
  deleteExam,
} = require("../controllers/examController");

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("faculty"));

router.post("/", createExam);

router.get("/", getExams);

router.put("/:id", updateExam);

router.delete("/:id", deleteExam);

module.exports = router;