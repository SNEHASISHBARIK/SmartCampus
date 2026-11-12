const Notice = require("../models/Notice");
const Department = require("../models/Department");

// ==========================================
// CREATE NOTICE
// ==========================================
const createNotice = async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      audience,
      targetRoles,
      department,
      priority,
      attachmentUrl,
      published,
      expiresAt,
    } = req.body || {};

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }

    // Validate category
    const allowedCategories = [
      "academic",
      "exam",
      "event",
      "placement",
      "holiday",
      "general",
    ];

    if (category && !allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notice category",
      });
    }

    // Validate priority
    const allowedPriorities = ["High", "Medium", "Low"];

    if (priority && !allowedPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority",
      });
    }

    // Validate department
    let departmentId = null;

    if (department) {
      const departmentData = await Department.findById(department);

      if (!departmentData) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      departmentId = departmentData._id;
    }

    // Validate target roles
    if (targetRoles !== undefined) {
      if (!Array.isArray(targetRoles)) {
        return res.status(400).json({
          success: false,
          message: "targetRoles must be an array",
        });
      }

      const allowedRoles = ["student", "faculty", "admin"];

      const invalidRoles = targetRoles.filter(
        (role) => !allowedRoles.includes(role)
      );

      if (invalidRoles.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid target role(s): ${invalidRoles.join(", ")}`,
        });
      }
    }

    const notice = await Notice.create({
      title: title.trim(),
      content: content.trim(),
      category: category || "general",

      audience: audience || "All Users",

      targetRoles: targetRoles || [],

      department: departmentId,

      priority: priority || "Medium",

      createdBy: req.user._id,

      attachmentUrl: attachmentUrl || "",

      published:
        published !== undefined ? Boolean(published) : true,

      expiresAt: expiresAt || null,
    });

    const populatedNotice = await Notice.findById(notice._id)
      .populate("createdBy", "name email role")
      .populate("department", "name code");

    return res.status(201).json({
      success: true,
      message: "Notice created successfully",
      notice: populatedNotice,
    });
  } catch (error) {
    console.error("Create Notice Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL NOTICES
// ==========================================
const getNotices = async (req, res) => {
  try {
    const notices = await Notice.find()
      .populate("createdBy", "name email role")
      .populate("department", "name code")
      .sort({ createdAt: -1 });

    const formattedNotices = notices.map((notice) => ({
      ...notice.toObject(),

      // Frontend-friendly values
      id: notice.noticeId,
      status: notice.published ? "Published" : "Draft",
      date: notice.createdAt,

      audience: notice.audience || "All Users",
      priority: notice.priority || "Medium",
    }));

    return res.status(200).json({
      success: true,
      count: formattedNotices.length,
      statistics: {
        total: formattedNotices.length,

        published: formattedNotices.filter(
          (notice) => notice.published
        ).length,

        draft: formattedNotices.filter(
          (notice) => !notice.published
        ).length,

        high: formattedNotices.filter(
          (notice) => notice.priority === "High"
        ).length,
      },
      notices: formattedNotices,
    });
  } catch (error) {
    console.error("Get Notices Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// GET SINGLE NOTICE
// ==========================================
const getNotice = async (req, res) => {
  try {
    const { id } = req.params;

    const notice = await Notice.findById(id)
      .populate("createdBy", "name email role")
      .populate("department", "name code");

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found",
      });
    }

    return res.status(200).json({
      success: true,
      notice: {
        ...notice.toObject(),
        id: notice.noticeId,
        status: notice.published ? "Published" : "Draft",
        date: notice.createdAt,
      },
    });
  } catch (error) {
    console.error("Get Notice Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE NOTICE
// ==========================================
const updateNotice = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      content,
      category,
      audience,
      targetRoles,
      department,
      priority,
      attachmentUrl,
      published,
      expiresAt,
    } = req.body || {};

    const notice = await Notice.findById(id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found",
      });
    }

    if (title !== undefined) {
      notice.title = title.trim();
    }

    if (content !== undefined) {
      notice.content = content.trim();
    }

    if (category !== undefined) {
      notice.category = category;
    }

    if (audience !== undefined) {
      notice.audience = audience;
    }

    if (priority !== undefined) {
      const allowedPriorities = [
        "High",
        "Medium",
        "Low",
      ];

      if (!allowedPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: "Invalid priority",
        });
      }

      notice.priority = priority;
    }

    if (targetRoles !== undefined) {
      if (!Array.isArray(targetRoles)) {
        return res.status(400).json({
          success: false,
          message: "targetRoles must be an array",
        });
      }

      const allowedRoles = [
        "student",
        "faculty",
        "admin",
      ];

      const invalidRoles = targetRoles.filter(
        (role) => !allowedRoles.includes(role)
      );

      if (invalidRoles.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid target role(s): ${invalidRoles.join(", ")}`,
        });
      }

      notice.targetRoles = targetRoles;
    }

    if (department !== undefined) {
      if (department === null || department === "") {
        notice.department = null;
      } else {
        const departmentData =
          await Department.findById(department);

        if (!departmentData) {
          return res.status(404).json({
            success: false,
            message: "Department not found",
          });
        }

        notice.department = departmentData._id;
      }
    }

    if (attachmentUrl !== undefined) {
      notice.attachmentUrl = attachmentUrl.trim();
    }

    if (published !== undefined) {
      notice.published = Boolean(published);
    }

    if (expiresAt !== undefined) {
      notice.expiresAt = expiresAt || null;
    }

    await notice.save();

    const updatedNotice = await Notice.findById(notice._id)
      .populate("createdBy", "name email role")
      .populate("department", "name code");

    return res.status(200).json({
      success: true,
      message: "Notice updated successfully",

      notice: {
        ...updatedNotice.toObject(),
        id: updatedNotice.noticeId,
        status: updatedNotice.published
          ? "Published"
          : "Draft",
        date: updatedNotice.createdAt,
      },
    });
  } catch (error) {
    console.error("Update Notice Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE NOTICE
// ==========================================
const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;

    const notice = await Notice.findById(id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found",
      });
    }

    await Notice.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Notice deleted successfully",
    });
  } catch (error) {
    console.error("Delete Notice Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createNotice,
  getNotices,
  getNotice,
  updateNotice,
  deleteNotice,
};