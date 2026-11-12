const mongoose = require("mongoose");

const placementSchema = new mongoose.Schema(
  {
    source: { type: String, required: true, default: "devglobaljobs" },
    sourceId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    company: { type: String, default: "Company not specified" },
    location: { type: String, default: "Location not specified" },
    category: { type: String, default: "Other" },
    description: { type: String, default: "" },
    jobType: { type: String, default: "Not specified" },
    sourceUrl: { type: String, required: true },
    applyUrl: { type: String, default: "" },
    postedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

placementSchema.index({ source: 1, sourceId: 1 }, { unique: true });
placementSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model("Placement", placementSchema);
