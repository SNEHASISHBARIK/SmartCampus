const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createProfile,
  getProfile,
  updateProfile,
  getAttendance,
  getSubjects,
  getAssignments,
  getResults,
  getNotices,
  getComplaints,
  createComplaint,
  getLeaves,
  createLeave,
  getFees,
  getExams,
  getNotes,
  getDashboard,
} = require("../controllers/studentController");
const { getStudentTimetable } = require("../controllers/timetableController");
const {
  getStudentSubjectResources,
} = require("../controllers/studentSubjectResourceController");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Student Authentication
|--------------------------------------------------------------------------
| Every route below requires:
| 1. Valid JWT token
| 2. Student role
|--------------------------------------------------------------------------
*/

router.use(protect);
router.use(authorizeRoles("student"));


router.get("/notes", getNotes);

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

router.get("/dashboard", getDashboard);

/*
|--------------------------------------------------------------------------
| Student Profile
|--------------------------------------------------------------------------
*/

// Create student profile
router.post("/profile", createProfile);

// Get student profile
router.get("/profile", getProfile);

// Update student profile
router.put("/profile", updateProfile);

/*
|--------------------------------------------------------------------------
| Academic
|--------------------------------------------------------------------------
*/

// Attendance
router.get("/attendance", getAttendance);

// Subjects
router.get("/subjects", getSubjects);
router.get("/subjects/:subjectId/resources", getStudentSubjectResources);

// Assignments
router.get("/assignments", getAssignments);

// Results
router.get("/results", getResults);

// Exams
router.get("/exams", getExams);

// Timetable
router.get("/timetable", getStudentTimetable);

/*
|--------------------------------------------------------------------------
| Notices
|--------------------------------------------------------------------------
*/

router.get("/notices", getNotices);

/*
|--------------------------------------------------------------------------
| Complaints
|--------------------------------------------------------------------------
*/

// Get complaints
router.get("/complaints", getComplaints);

// Create complaint
router.post("/complaints", createComplaint);

/*
|--------------------------------------------------------------------------
| Leave
|--------------------------------------------------------------------------
*/

// Get leaves
router.get("/leaves", getLeaves);

// Apply for leave
router.post("/leaves", createLeave);

/*
|--------------------------------------------------------------------------
| Fees
|--------------------------------------------------------------------------
*/

router.get("/fees", getFees);

module.exports = router;