const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createLeave,
  getLeaves,
  getLeave,
  updateLeave,
  deleteLeave,
  bulkUpdateLeaves,
  bulkDeleteLeaves,
} = require("../controllers/leaveAdminController");

const router = express.Router();

// ==========================================
// AUTHENTICATION
// ==========================================
router.use(protect);

// ==========================================
// ADMIN ONLY
// ==========================================
router.use(authorizeRoles("admin"));

// ==========================================
// BULK OPERATIONS
// ==========================================

// Bulk approve / reject / pending
router.put("/bulk/status", bulkUpdateLeaves);

// Bulk delete
router.delete("/bulk", bulkDeleteLeaves);

// ==========================================
// CREATE
// ==========================================
router.post("/", createLeave);

// ==========================================
// GET ALL
// ==========================================
router.get("/", getLeaves);

// ==========================================
// GET SINGLE
// ==========================================
router.get("/:id", getLeave);

// ==========================================
// UPDATE / APPROVE / REJECT
// ==========================================
router.put("/:id", updateLeave);

// ==========================================
// DELETE
// ==========================================
router.delete("/:id", deleteLeave);

module.exports = router;