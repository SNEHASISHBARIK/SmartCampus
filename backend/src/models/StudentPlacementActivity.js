const mongoose = require("mongoose");

const studentPlacementActivitySchema = new mongoose.Schema(
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
    },
    isSaved: {
      type: Boolean,
      default: false,
    },
    applicationStatus: {
      type: String,
      enum: [
        "Applied",
        "Assessment",
        "Interview",
        "Selected",
        "Rejected",
        "Withdrawn",
      ],
      default: null,
    },
    appliedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: "",
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

studentPlacementActivitySchema.index(
  { user: 1, placement: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "StudentPlacementActivity",
  studentPlacementActivitySchema
);