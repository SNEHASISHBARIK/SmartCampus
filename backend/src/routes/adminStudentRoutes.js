const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deactivateStudent,
  activateStudent,
  changeStudentPassword,
} = require("../controllers/studentAdminController");

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("admin"));

router.post("/", createStudent);

router.get("/", getStudents);

router.get("/:id", getStudent);

router.put("/:id", updateStudent);

router.patch("/:id/password", changeStudentPassword);

router.patch("/:id/deactivate", deactivateStudent);

router.patch("/:id/activate", activateStudent);
 

module.exports = router;