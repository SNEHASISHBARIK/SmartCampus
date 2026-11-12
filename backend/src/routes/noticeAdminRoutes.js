const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createNotice,
  getNotices,
  getNotice,
  updateNotice,
  deleteNotice,
} = require("../controllers/noticeAdminController");

const router = express.Router();

// Authentication
router.use(protect);

// Admin only
router.use(authorizeRoles("admin"));


// Create notice
router.post("/", createNotice);

// Get all notices
router.get("/", getNotices);

// Get single notice
router.get("/:id", getNotice);

// Update notice / publish / unpublish
router.put("/:id", updateNotice);

// Delete notice
router.delete("/:id", deleteNotice);


module.exports = router;