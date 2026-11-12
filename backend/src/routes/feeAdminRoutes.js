const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createFee,
  getFees,
  getFee,
  updateFee,
  deleteFee,
} = require("../controllers/feeAdminController");

const router = express.Router();

// Authentication
router.use(protect);

// Admin only
router.use(authorizeRoles("admin"));

// Create fee
router.post("/", createFee);

// Get all fees
router.get("/", getFees);

// Get single fee
router.get("/:id", getFee);

// Update fee
router.put("/:id", updateFee);

// Delete fee
router.delete("/:id", deleteFee);

module.exports = router;