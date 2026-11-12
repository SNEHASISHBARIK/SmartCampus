const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    // ==========================================
    // STUDENT
    // ==========================================
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    // ==========================================
    // LEAVE DATES
    // ==========================================
    fromDate: {
      type: Date,
      required: true,
    },

    toDate: {
      type: Date,
      required: true,
    },

    // ==========================================
    // REASON
    // ==========================================
    reason: {
      type: String,
      required: true,
      trim: true,
    },

    // ==========================================
    // LEAVE TYPE
    // ==========================================
    leaveType: {
      type: String,
      enum: [
        "medical",
        "personal",
        "family",
        "academic",
        "other",
      ],
      default: "personal",
    },

    // ==========================================
    // DOCUMENT
    // ==========================================
    documentUrl: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // STATUS
    // ==========================================
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
      ],
      default: "pending",
    },

    // ==========================================
    // REVIEWED BY
    // ==========================================
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ==========================================
    // REVIEW COMMENT
    // ==========================================
    reviewComment: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // REVIEW DATE
    // ==========================================
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Leave",
  leaveSchema
);