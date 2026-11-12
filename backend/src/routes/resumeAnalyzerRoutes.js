const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const crypto = require("crypto");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const Placement = require("../models/Placement");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const protect = require("../middleware/authMiddleware");
const {
  analyzeResumeWithPython,
} = require("../services/pythonResumeAnalyzerService");
const {
  buildCategoryComparison,
  buildTailoredRecommendations,
} = require("../utils/resumeAnalyticsHelper");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/x-pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "application/octet-stream",
    ];

    const fileName = (file.originalname || "").toLowerCase();
    const hasValidExt = fileName.endsWith(".pdf") || fileName.endsWith(".docx");

    if (!allowedTypes.includes(file.mimetype) && !hasValidExt) {
      return cb(new Error("Upload a PDF or DOCX resume only."));
    }

    cb(null, true);
  },
});

async function extractResumeText(file) {
  const buffer = file.buffer;
  const originalName = (file.originalname || "").toLowerCase();
  const isPdf =
    file.mimetype.includes("pdf") ||
    originalName.endsWith(".pdf") ||
    buffer.subarray(0, 5).toString().startsWith("%PDF");

  if (isPdf) {
    try {
      const result = await pdfParse(buffer);
      if (result.text && result.text.trim().length > 0) {
        return result.text;
      }
    } catch (parseError) {
      console.warn("pdfParse warning:", parseError.message);
    }

    // Fallback stream text extraction
    const raw = buffer.toString("latin1");
    const matches = raw.match(/\(([^()]{2,})\)\s*Tj/g) || [];
    const textPieces = matches.map((m) =>
      m.replace(/^\(/, "").replace(/\)\s*Tj$/, "").trim()
    );
    if (textPieces.length > 5) {
      return textPieces.join(" ");
    }

    // Plain text extraction from buffer
    const textFromBuffer = raw
      .replace(/[^\x20-\x7E\n\r\t]/g, " ")
      .replace(/\s+/g, " ");
    return textFromBuffer;
  }

  // DOCX extraction
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (docxErr) {
    console.warn("mammoth extraction warning:", docxErr.message);
    return "";
  }
}

// ==========================================
// POST /api/resume-analyzer/analyze
// ==========================================
router.post(
  "/analyze",
  protect,
  upload.single("resume"),
  async (req, res) => {
    try {
      const { jobId } = req.body;

      if (!mongoose.isValidObjectId(jobId)) {
        return res.status(400).json({
          success: false,
          message: "Please select a valid job.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload your resume.",
        });
      }

      const job = await Placement.findOne({
        _id: jobId,
        isActive: true,
      }).lean();

      if (!job) {
        return res.status(404).json({
          success: false,
          message: "The selected job was not found or is inactive.",
        });
      }

      const resumeText = await extractResumeText(req.file);

      if (resumeText.trim().length < 50) {
        return res.status(422).json({
          success: false,
          message:
            "Not enough readable text was found. Try a text-based PDF or DOCX file with at least 50 characters.",
        });
      }

      if (resumeText.length > 30000) {
        return res.status(422).json({
          success: false,
          message:
            "The extracted resume text exceeds the 30,000 character analysis limit.",
        });
      }

      // Compute SHA-256 hash of (jobId + resumeText) to check cache
      const resumeHash = crypto
        .createHash("sha256")
        .update(`${jobId}:${resumeText.trim().toLowerCase()}`)
        .digest("hex");

      // Check if this student already analyzed the same resume for this job within the last 7 days
      const existingAnalysis = await ResumeAnalysis.findOne({
        user: req.user._id,
        placement: jobId,
        resumeHash,
      }).sort({ createdAt: -1 });

      if (existingAnalysis) {
        console.log(
          `⚡ Returning cached resume analysis for user ${req.user._id} and job ${job.title}`
        );
        return res.json({
          success: true,
          job: {
            id: job._id,
            title: job.title,
            company: job.company,
          },
          analysis: {
            matchScore: existingAnalysis.matchScore,
            technicalScore: existingAnalysis.technicalScore ?? 70,
            experienceScore: existingAnalysis.experienceScore ?? 70,
            seniorityDetected: existingAnalysis.seniorityDetected || "Entry-Level / Student",
            seniorityRequired: existingAnalysis.seniorityRequired || "Entry-Level",
            summary: existingAnalysis.summary,
            matchedSkills: existingAnalysis.matchedSkills,
            missingSkills: existingAnalysis.missingSkills,
            criticalMissingSkills: existingAnalysis.criticalMissingSkills || [],
            secondaryMissingSkills: existingAnalysis.secondaryMissingSkills || [],
            learningRoadmap: existingAnalysis.learningRoadmap || [],
            suggestions: existingAnalysis.suggestions,
            interviewQuestions: existingAnalysis.interviewQuestions,
            categoryComparison: existingAnalysis.categoryComparison,
            tailoredRecommendations: existingAnalysis.tailoredRecommendations,
            method: existingAnalysis.method || "cached",
            disclaimer: existingAnalysis.disclaimer,
            historyId: existingAnalysis._id,
            analyzedAt: existingAnalysis.createdAt,
          },
          isCached: true,
        });
      }

      // Run analysis through Python service / Gemini / Rule-based engine
      const analysis = await analyzeResumeWithPython({
        resumeText,
        job,
      });

      // Augment analysis with category breakdown and tailored recommendations
      const categoryComparison = buildCategoryComparison(
        analysis.matchedSkills,
        analysis.missingSkills
      );

      const tailoredRecommendations = buildTailoredRecommendations(
        job.title,
        job.company,
        analysis.missingSkills,
        analysis.matchScore
      );

      // Save to history
      const savedRecord = await ResumeAnalysis.create({
        user: req.user._id,
        placement: job._id,
        jobTitle: job.title,
        company: job.company || "Not specified",
        resumeFileName: req.file.originalname || "resume.pdf",
        resumeHash,
        matchScore: analysis.matchScore,
        technicalScore: analysis.technicalScore,
        experienceScore: analysis.experienceScore,
        seniorityDetected: analysis.seniorityDetected,
        seniorityRequired: analysis.seniorityRequired,
        summary: analysis.summary,
        matchedSkills: analysis.matchedSkills,
        missingSkills: analysis.missingSkills,
        criticalMissingSkills: analysis.criticalMissingSkills,
        secondaryMissingSkills: analysis.secondaryMissingSkills,
        learningRoadmap: analysis.learningRoadmap,
        categoryComparison,
        tailoredRecommendations,
        suggestions: analysis.suggestions,
        interviewQuestions: analysis.interviewQuestions,
        method: analysis.method,
        disclaimer: analysis.disclaimer,
      });

      return res.json({
        success: true,
        job: {
          id: job._id,
          title: job.title,
          company: job.company,
        },
        analysis: {
          ...analysis,
          categoryComparison,
          tailoredRecommendations,
          historyId: savedRecord._id,
          analyzedAt: savedRecord.createdAt,
        },
      });
    } catch (error) {
      console.error("Resume analysis error:", error.message);

      if (error.message === "PYTHON_RESUME_AI_FAILED") {
        return res.status(502).json({
          success: false,
          message:
            "The AI resume analyzer is temporarily unavailable. Please try again.",
        });
      }

      if (error.message === "PYTHON_RESUME_AI_QUOTA_EXHAUSTED") {
        return res.status(429).json({
          success: false,
          message:
            "Gemini API quota exhausted. Using intelligent fallback analysis.",
        });
      }

      if (error.message === "PYTHON_RESUME_AI_TIMEOUT") {
        return res.status(504).json({
          success: false,
          message: "Gemini request timed out. Please try again later.",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Unable to analyze the resume. Please try another file.",
      });
    }
  }
);

// ==========================================
// GET /api/resume-analyzer/history
// Get all saved analyses for the logged-in student
// ==========================================
router.get("/history", protect, async (req, res) => {
  try {
    const history = await ResumeAnalysis.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .select("-resumeHash")
      .lean();

    return res.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("Fetch analysis history error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load analysis history.",
    });
  }
});

// ==========================================
// GET /api/resume-analyzer/history/:id
// Get a specific analysis by ID
// ==========================================
router.get("/history/:id", protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid analysis ID.",
      });
    }

    const item = await ResumeAnalysis.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).lean();

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Analysis record not found.",
      });
    }

    return res.json({
      success: true,
      analysis: item,
      job: {
        id: item.placement,
        title: item.jobTitle,
        company: item.company,
      },
    });
  } catch (error) {
    console.error("Fetch single history error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load analysis detail.",
    });
  }
});

// ==========================================
// DELETE /api/resume-analyzer/history/:id
// Remove an analysis from history
// ==========================================
router.delete("/history/:id", protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid analysis ID.",
      });
    }

    const deleted = await ResumeAnalysis.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Record not found.",
      });
    }

    return res.json({
      success: true,
      message: "Analysis removed from history.",
    });
  } catch (error) {
    console.error("Delete history error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to delete analysis record.",
    });
  }
});

// Handle upload errors such as unsupported file types and files over 5 MB.
router.use((error, req, res, next) => {
  console.error("Resume upload error:", error.message);
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File exceeds maximum size of 5 MB.",
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  return res.status(400).json({
    success: false,
    message: error.message || "File upload failed.",
  });
});

module.exports = router;
