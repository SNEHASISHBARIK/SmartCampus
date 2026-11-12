const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createDepartment,
  getDepartments,
  getDepartment,
  updateDepartment,
  deactivateDepartment,
} = require("../controllers/departmentAdminController");

const router = express.Router();

// All department admin routes require authentication
router.use(protect);

// Only admin can access these routes
router.use(authorizeRoles("admin"));

// Create department
router.post("/", createDepartment);

// Get all departments
router.get("/", getDepartments);

// Get single department
router.get("/:id", getDepartment);

// Update department
router.put("/:id", updateDepartment);

// Deactivate department
router.patch("/:id/deactivate", deactivateDepartment);

module.exports = router;