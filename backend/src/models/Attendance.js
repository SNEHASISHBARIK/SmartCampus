const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
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

    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    period: {
     type: String,
     trim: true,
     default: "",
    },

    status: {
      type: String,
      enum: ["present", "absent", "late", "leave"],
      required: true,
    },

    remarks: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({
  student: 1,
  subject: 1,
  date: 1,
  period: 1,
});

module.exports = mongoose.model("Attendance", attendanceSchema);