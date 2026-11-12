const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  getAdminDashboard,
} = require("../controllers/analyticsController");

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("admin"));

router.get("/dashboard", getAdminDashboard);

module.exports = router;