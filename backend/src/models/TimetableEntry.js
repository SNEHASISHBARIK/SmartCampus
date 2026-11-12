const mongoose = require("mongoose");

const timetableEntrySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },

    section: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      required: true,
    },

    startTime: {
      type: String,
      required: true,
      match: /^(?:[01]\d|2[0-3]):[0-5]\d$/,
    },

    endTime: {
      type: String,
      required: true,
      match: /^(?:[01]\d|2[0-3]):[0-5]\d$/,
    },

    room: {
      type: String,
      trim: true,
      default: "",
    },

    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      default: null,
    },

    sessionType: {
      type: String,
      enum: ["class", "lab", "break", "activity", "study"],
      default: "class",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

timetableEntrySchema.index({
  department: 1,
  semester: 1,
  section: 1,
  day: 1,
  startTime: 1,
});

module.exports =
  mongoose.models.TimetableEntry ||
  mongoose.model("TimetableEntry", timetableEntrySchema);
