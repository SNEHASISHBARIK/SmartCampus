const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/protected", protect, (req, res) => {
  res.json({
    success: true,
    message: "You can access this protected route",
    user: req.user,
  });
});

router.get(
  "/student-only",
  protect,
  authorizeRoles("student"),
  (req, res) => {
    res.json({
      success: true,
      message: "Student access granted",
      user: req.user,
    });
  }
);

router.get(
  "/faculty-only",
  protect,
  authorizeRoles("faculty"),
  (req, res) => {
    res.json({
      success: true,
      message: "Faculty access granted",
      user: req.user,
    });
  }
);

router.get(
  "/admin-only",
  protect,
  authorizeRoles("admin"),
  (req, res) => {
    res.json({
      success: true,
      message: "Admin access granted",
      user: req.user,
    });
  }
);

module.exports = router;