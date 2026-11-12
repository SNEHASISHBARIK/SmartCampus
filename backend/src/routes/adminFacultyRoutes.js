const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createFaculty,
  getFaculty,
  getOneFaculty,
  updateFaculty,
  deactivateFaculty,
  changeFacultyPassword
} = require("../controllers/facultyAdminController");

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("admin"));

router.post("/", createFaculty);

router.get("/", getFaculty);

router.get("/:id", getOneFaculty);

router.put("/:id", updateFaculty);

router.patch("/:id/deactivate", deactivateFaculty);

router.patch("/:id/password", changeFacultyPassword);

module.exports = router;