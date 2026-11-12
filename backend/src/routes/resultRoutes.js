
const express = require("express");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createResult,
  getResults,
  updateResult,
} = require("../controllers/resultController");

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("faculty"));

router.get("/", getResults);
router.post("/", createResult);
router.put("/:id", updateResult);

module.exports = router;
