const mongoose = require("mongoose");
const Leave = require("../models/Leave");
const Student = require("../models/Student");

// ==========================================
// HELPER: POPULATE LEAVE
// ==========================================
const populateLeave = (query) => {
  return query
    .populate({
      path: "student",
      populate: [
        {
          path: "user",
          select: "name email phone",
        },
        {
          path: "department",
          select: "name code",
        },
      ],
    })
    .populate("reviewedBy", "name email role");
};

// ==========================================
// CREATE LEAVE
// ==========================================
const createLeave = async (req, res) => {
  try {
    const {
      student,
      fromDate,
      toDate,
      reason,
      leaveType,
      documentUrl,
    } = req.body;

    if (!student || !fromDate || !toDate || !reason) {
      return res.status(400).json({
        success: false,
        message: "Student, fromDate, toDate and reason are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(student)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const studentData = await Student.findById(student);

    if (!studentData) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (new Date(fromDate) > new Date(toDate)) {
      return res.status(400).json({
        success: false,
        message: "fromDate cannot be after toDate",
      });
    }

    const leave = await Leave.create({
      student,
      fromDate,
      toDate,
      reason: reason.trim(),
      leaveType: leaveType || "personal",
      documentUrl: documentUrl || "",
      status: "pending",
    });

    const populatedLeave = await populateLeave(
      Leave.findById(leave._id)
    );

    return res.status(201).json({
      success: true,
      message: "Leave created successfully",
      leave: populatedLeave,
    });
  } catch (error) {
    console.error("Create Leave Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL LEAVES
// ==========================================
const getLeaves = async (req, res) => {
  try {
    const {
      search = "",
      leaveType = "",
      status = "",
      page = 1,
      limit = 10,
    } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);
    const pageLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const skip = (currentPage - 1) * pageLimit;

    // ------------------------------------------
    // Build filter
    // ------------------------------------------
    const filter = {};

    if (leaveType) {
      filter.leaveType = leaveType;
    }

    if (status) {
      filter.status = status;
    }

    // ------------------------------------------
    // Search by reason
    // Student name/ID search is handled after
    // student population below.
    // ------------------------------------------
    if (search) {
      filter.reason = {
        $regex: search,
        $options: "i",
      };
    }

    const [
      leaves,
      total,
      totalCount,
      pendingCount,
      approvedCount,
      rejectedCount,
    ] = await Promise.all([
      populateLeave(
        Leave.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(pageLimit)
      ),

      Leave.countDocuments(filter),

      Leave.countDocuments(),

      Leave.countDocuments({
        status: "pending",
      }),

      Leave.countDocuments({
        status: "approved",
      }),

      Leave.countDocuments({
        status: "rejected",
      }),
    ]);

    return res.status(200).json({
      success: true,

      count: leaves.length,

      pagination: {
        currentPage,
        totalPages: Math.ceil(total / pageLimit),
        totalItems: total,
        limit: pageLimit,
        hasNextPage: currentPage < Math.ceil(total / pageLimit),
        hasPreviousPage: currentPage > 1,
      },

      statistics: {
        total: totalCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },

      leaves,
    });
  } catch (error) {
    console.error("Get Leaves Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// GET SINGLE LEAVE
// ==========================================
const getLeave = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave ID",
      });
    }

    const leave = await populateLeave(
      Leave.findById(id)
    );

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    return res.status(200).json({
      success: true,
      leave,
    });
  } catch (error) {
    console.error("Get Leave Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE LEAVE
// ==========================================
const updateLeave = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave ID",
      });
    }

    const {
      fromDate,
      toDate,
      reason,
      leaveType,
      documentUrl,
      status,
      reviewComment,
    } = req.body || {};

    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    // ------------------------------------------
    // Update dates
    // ------------------------------------------
    if (fromDate !== undefined) {
      leave.fromDate = fromDate;
    }

    if (toDate !== undefined) {
      leave.toDate = toDate;
    }

    // Validate final dates
    if (
      new Date(leave.fromDate) >
      new Date(leave.toDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "fromDate cannot be after toDate",
      });
    }

    // ------------------------------------------
    // Update other fields
    // ------------------------------------------
    if (reason !== undefined) {
      if (!reason.trim()) {
        return res.status(400).json({
          success: false,
          message: "Reason cannot be empty",
        });
      }

      leave.reason = reason.trim();
    }

    if (leaveType !== undefined) {
      const allowedLeaveTypes = [
        "medical",
        "personal",
        "family",
        "academic",
        "other",
      ];

      if (!allowedLeaveTypes.includes(leaveType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid leave type",
        });
      }

      leave.leaveType = leaveType;
    }

    if (documentUrl !== undefined) {
      leave.documentUrl = documentUrl.trim();
    }

    if (reviewComment !== undefined) {
      leave.reviewComment = reviewComment.trim();
    }

    // ------------------------------------------
    // Handle status
    // ------------------------------------------
    if (status !== undefined) {
      const allowedStatuses = [
        "pending",
        "approved",
        "rejected",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid leave status",
        });
      }

      leave.status = status;

      if (
        status === "approved" ||
        status === "rejected"
      ) {
        leave.reviewedBy = req.user._id;
        leave.reviewedAt = new Date();
      }

      if (status === "pending") {
        leave.reviewedBy = null;
        leave.reviewedAt = null;
        leave.reviewComment = "";
      }
    }

    await leave.save();

    const updatedLeave = await populateLeave(
      Leave.findById(leave._id)
    );

    return res.status(200).json({
      success: true,
      message: "Leave updated successfully",
      leave: updatedLeave,
    });
  } catch (error) {
    console.error("Update Leave Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE LEAVE
// ==========================================
const deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave ID",
      });
    }

    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    await Leave.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Leave deleted successfully",
      deletedId: id,
    });
  } catch (error) {
    console.error("Delete Leave Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// BULK UPDATE LEAVES
// ==========================================
const bulkUpdateLeaves = async (req, res) => {
  try {
    const {
      ids,
      status,
      reviewComment = "",
    } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "ids must be a non-empty array",
      });
    }

    if (
      !["pending", "approved", "rejected"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const validIds = ids.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (validIds.length !== ids.length) {
      return res.status(400).json({
        success: false,
        message: "One or more leave IDs are invalid",
      });
    }

    const updateData = {
      status,
      reviewComment: reviewComment.trim(),
    };

    if (
      status === "approved" ||
      status === "rejected"
    ) {
      updateData.reviewedBy = req.user._id;
      updateData.reviewedAt = new Date();
    }

    if (status === "pending") {
      updateData.reviewedBy = null;
      updateData.reviewedAt = null;
      updateData.reviewComment = "";
    }

    const result = await Leave.updateMany(
      {
        _id: { $in: validIds },
      },
      {
        $set: updateData,
      }
    );

    const leaves = await populateLeave(
      Leave.find({
        _id: { $in: validIds },
      }).sort({ createdAt: -1 })
    );

    return res.status(200).json({
      success: true,
      message: `${result.modifiedCount} leave(s) updated successfully`,
      modifiedCount: result.modifiedCount,
      leaves,
    });
  } catch (error) {
    console.error("Bulk Update Leaves Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// BULK DELETE LEAVES
// ==========================================
const bulkDeleteLeaves = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "ids must be a non-empty array",
      });
    }

    const validIds = ids.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (validIds.length !== ids.length) {
      return res.status(400).json({
        success: false,
        message: "One or more leave IDs are invalid",
      });
    }

    const result = await Leave.deleteMany({
      _id: { $in: validIds },
    });

    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} leave(s) deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Bulk Delete Leaves Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================
module.exports = {
  createLeave,
  getLeaves,
  getLeave,
  updateLeave,
  deleteLeave,
  bulkUpdateLeaves,
  bulkDeleteLeaves,
};