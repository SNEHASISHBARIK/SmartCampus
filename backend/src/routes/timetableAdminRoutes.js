const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const {
  createTimetableEntry,
  deleteTimetableEntry,
  getAdminTimetable,
  updateTimetableEntry,
} = require("../controllers/timetableController");

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("admin"));

router.route("/")
  .get(getAdminTimetable)
  .post(createTimetableEntry);

router.route("/:id")
  .put(updateTimetableEntry)
  .delete(deleteTimetableEntry);

module.exports = router;
