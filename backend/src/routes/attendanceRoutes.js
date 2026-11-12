const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  markAttendance,
  getAttendance,
  updateAttendance,
} = require("../controllers/attendanceController");

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("faculty"));

router.post("/", markAttendance);

router.get("/", getAttendance);

router.put("/:id", updateAttendance);

module.exports = router;