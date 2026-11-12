
const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
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
      validate: {
        validator: Number.isInteger,
        message: "Semester must be a whole number",
      },
    },

    examType: {
      type: String,
      enum: [
        "internal",
        "midterm",
        "end-semester",
        "practical",
        "assignment",
      ],
      required: true,
    },

    marksObtained: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function (value) {
          return value <= this.totalMarks;
        },
        message: "Marks obtained cannot exceed total marks",
      },
    },

    totalMarks: {
      type: Number,
      required: true,
      min: 1,
    },

    grade: {
      type: String,
      trim: true,
    },

    gradePoint: {
      type: Number,
      min: 0,
      max: 10,
    },

    published: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Result", resultSchema);
