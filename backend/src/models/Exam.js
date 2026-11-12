const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    examId: {
      type: String,
      unique: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },

    examType: {
      type: String,
      enum: [
        "internal",
        "midterm",
        "end-semester",
        "practical",
      ],
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    room: {
      type: String,
      trim: true,
      default: "",
    },

    totalMarks: {
      type: Number,
      default: 100,
      min: 0,
    },

    instructions: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Scheduled", "Upcoming", "Completed", "Closed", "Cancelled"],
      default: "Upcoming",
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Exam ||
  mongoose.model("Exam", examSchema);