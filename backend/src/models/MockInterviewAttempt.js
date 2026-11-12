const mongoose = require("mongoose");

const mockInterviewAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Placement",
      default: null,
      index: true,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    company: {
      type: String,
      default: "Placement Opportunity",
      trim: true,
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
      default: 0,
    },
    categories: {
      technical: {
        score: { type: Number, default: 0 },
        recommendation: { type: String, default: "" },
      },
      communication: {
        score: { type: Number, default: 0 },
        recommendation: { type: String, default: "" },
      },
      problemSolving: {
        score: { type: Number, default: 0 },
        recommendation: { type: String, default: "" },
      },
      relevance: {
        score: { type: Number, default: 0 },
        recommendation: { type: String, default: "" },
      },
      confidence: {
        score: { type: Number, default: 0 },
        recommendation: { type: String, default: "" },
      },
    },
    feedback: {
      summary: { type: String, default: "" },
      strengths: { type: [String], default: [] },
      weaknesses: { type: [String], default: [] },
    },
    skillGaps: [
      {
        skill: { type: String, required: true },
        assessment: {
          type: String,
          enum: ["Good", "Moderate", "Needs Improvement", "Not Assessed"],
          default: "Not Assessed",
        },
        recommendedAction: { type: String, default: "" },
      },
    ],
    learningRoadmap: [
      {
        day: { type: Number, required: true },
        activity: { type: String, required: true },
        goal: { type: String, required: true },
      },
    ],
    recommendedPriorities: [
      {
        priority: { type: Number, required: true },
        area: { type: String, required: true },
        tasks: { type: [String], default: [] },
      },
    ],
    questionsAndAnswers: [
      {
        question: { type: String, required: true },
        studentAnswer: { type: String, default: "" },
        whatToImprove: { type: String, default: "" },
        strongerAnswer: { type: String, default: "" },
      },
    ],
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "MockInterviewAttempt",
  mockInterviewAttemptSchema
);
