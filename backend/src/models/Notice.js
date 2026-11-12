const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    // Notice ID shown in Admin UI
    noticeId: {
      type: String,
      unique: true,
      trim: true,
    },

    // Notice title
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Notice content
    content: {
      type: String,
      required: true,
      trim: true,
    },

    // Notice category
    category: {
      type: String,
      enum: [
        "academic",
        "exam",
        "event",
        "placement",
        "holiday",
        "general",
      ],
      default: "general",
    },

    // Frontend audience
    audience: {
      type: String,
      default: "All Users",
      trim: true,
    },

    // Roles that can see the notice
    targetRoles: {
      type: [String],
      enum: ["student", "faculty", "admin"],
      default: [],
    },

    // Optional department
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    // Notice priority
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },

    // User who created the notice
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },

    // Optional attachment
    attachmentUrl: {
      type: String,
      default: "",
      trim: true,
    },

    // Published or draft
    published: {
      type: Boolean,
      default: true,
    },

    // Optional expiry date
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// AUTO GENERATE NOTICE ID
// NOT001, NOT002, NOT003...
// ==========================================

noticeSchema.pre("save", async function () {
  if (!this.isNew || this.noticeId) {
    return;
  }

  const Notice =
    mongoose.models.Notice ||
    mongoose.model("Notice", noticeSchema);

  const lastNotice = await Notice.findOne({})
    .sort({ createdAt: -1 })
    .select("noticeId");

  let nextNumber = 1;

  if (lastNotice?.noticeId) {
    const match = lastNotice.noticeId.match(/^NOT(\d+)$/);

    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  this.noticeId = `NOT${String(nextNumber).padStart(3, "0")}`;
});

// ==========================================
// SAFE MODEL EXPORT
// ==========================================

module.exports =
  mongoose.models.Notice ||
  mongoose.model("Notice", noticeSchema);