const mongoose = require("mongoose");

const categorySkillSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
    },
    matched: {
      type: [String],
      default: [],
    },
    missing: {
      type: [String],
      default: [],
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { _id: false }
);

const resumeAnalysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    placement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Placement",
      required: true,
      index: true,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      default: "Company not specified",
      trim: true,
    },
    resumeFileName: {
      type: String,
      default: "resume.pdf",
    },
    resumeHash: {
      type: String,
      required: true,
      index: true,
    },
    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    technicalScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    experienceScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    seniorityDetected: {
      type: String,
      default: "Entry-Level / Student",
    },
    seniorityRequired: {
      type: String,
      default: "Entry-Level",
    },
    summary: {
      type: String,
      default: "",
    },
    matchedSkills: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    criticalMissingSkills: {
      type: [String],
      default: [],
    },
    secondaryMissingSkills: {
      type: [String],
      default: [],
    },
    learningRoadmap: [
      {
        phase: { type: String, required: true },
        focus: { type: String, required: true },
        actionItems: { type: [String], default: [] },
      },
    ],
    categoryComparison: {
      type: [categorySkillSchema],
      default: [],
    },
    tailoredRecommendations: {
      type: [String],
      default: [],
    },
    suggestions: {
      type: [String],
      default: [],
    },
    interviewQuestions: {
      type: [String],
      default: [],
    },
    method: {
      type: String,
      enum: [
        "gemini-llm",
        "rule-based",
        "cached",
        "heuristic",
        "local-heuristic-analyzer",
        "heuristic-fallback",
      ],
      default: "gemini-llm",
    },
    disclaimer: {
      type: String,
      default:
        "A match score is an estimate of alignment with the job requirements, not a guarantee of selection.",
    },
  },
  { timestamps: true }
);

resumeAnalysisSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("ResumeAnalysis", resumeAnalysisSchema);
