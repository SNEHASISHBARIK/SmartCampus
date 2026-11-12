const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createAssignment,
  getAssignments,
  updateAssignment,
  deleteAssignment,
} = require("../controllers/assignmentController");

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("faculty"));

router.post("/", createAssignment);

router.get("/", getAssignments);

router.put("/:id", updateAssignment);

router.delete("/:id", deleteAssignment);

module.exports = router;