const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createComplaint,
  getComplaints,
  getComplaint,
  updateComplaint,
  deleteComplaint,
} = require("../controllers/complaintAdminController");

const router = express.Router();

// Admin authentication
router.use(protect);

// Only admin can access these routes
router.use(authorizeRoles("admin"));


// Create complaint
router.post("/", createComplaint);

// Get all complaints
router.get("/", getComplaints);

// Get single complaint
router.get("/:id", getComplaint);

// Update complaint
router.put("/:id", updateComplaint);

// Delete complaint
router.delete("/:id", deleteComplaint);


module.exports = router;