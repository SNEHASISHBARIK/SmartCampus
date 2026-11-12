const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createProfile,
  getProfile,
  updateProfile,
  getDashboard,
  getFacultySubjects,
  getAttendanceStudents,
} = require("../controllers/facultyController");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Faculty Authentication
|--------------------------------------------------------------------------
| Every faculty route requires:
| 1. Valid JWT
| 2. Faculty role
|--------------------------------------------------------------------------
*/

router.use(protect);
router.use(authorizeRoles("faculty"));

/*
|--------------------------------------------------------------------------
| Faculty Dashboard & Subjects
|--------------------------------------------------------------------------
*/

router.get("/dashboard", getDashboard);
router.get("/subjects", getFacultySubjects);
router.get("/attendance/students", getAttendanceStudents);

/*
|--------------------------------------------------------------------------
| Faculty Profile
|--------------------------------------------------------------------------
*/

router.post("/profile", createProfile);

router.get("/profile", getProfile);

router.put("/profile", updateProfile);

module.exports = router;