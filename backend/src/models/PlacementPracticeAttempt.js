const mongoose = require("mongoose");

const placementPracticeAttemptSchema = new mongoose.Schema(
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

    jobRole: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    questions: {
      type: [mongoose.Schema.Types.Mixed],
      required: true,
    },

    answers: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    score: {
      type: Number,
      min: 0,
      max: 60,
      default: 0,
    },

    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
    },

    submittedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "PlacementPracticeAttempt",
  placementPracticeAttemptSchema
);
