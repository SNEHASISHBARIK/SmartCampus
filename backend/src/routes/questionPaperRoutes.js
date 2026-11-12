
const express = require("express");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  uploadQuestionPaper,
  getQuestionPapers,
} = require("../controllers/questionPaperController");

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("faculty"));

router.post(
  "/upload",
  upload.single("file"),
  uploadQuestionPaper
);

router.get("/", getQuestionPapers);

module.exports = router;
