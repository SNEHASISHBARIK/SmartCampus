const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: [
        "academic",
        "hostel",
        "library",
        "transport",
        "fees",
        "technical",
        "other",
      ],
      default: "other",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "in-progress",
        "resolved",
        "rejected",
      ],
      default: "pending",
    },

    response: {
      type: String,
      default: "",
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Complaint", complaintSchema);