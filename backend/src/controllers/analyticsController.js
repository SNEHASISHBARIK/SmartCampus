const User = require("../models/User");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const Department = require("../models/Department");
const Subject = require("../models/Subject");
const Complaint = require("../models/Complaint");
const Fee = require("../models/Fee");
const Leave = require("../models/Leave");
const Exam = require("../models/Exam");
const Assignment = require("../models/Assignment");
const Notice = require("../models/Notice");
const Result = require("../models/Result");
const Attendance = require("../models/Attendance");

// ADMIN DASHBOARD
const getAdminDashboard = async (req, res) => {
  try {
    // ==============================
    // STATISTICS
    // ==============================

    const [
      totalUsers,
      totalStudents,
      totalFaculty,
      totalDepartments,
      totalSubjects,
      totalComplaints,
      activeUsers,

      totalFees,
      pendingFees,
      paidFees,

      totalLeaves,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,

      totalExams,
      totalAssignments,
      totalNotices,
      totalResults,
      totalAttendanceRecords,
    ] = await Promise.all([
      User.countDocuments(),
      Student.countDocuments(),
      Faculty.countDocuments(),
      Department.countDocuments(),
      Subject.countDocuments(),
      Complaint.countDocuments(),
      User.countDocuments({ isActive: true }),

      Fee.countDocuments(),
      Fee.countDocuments({ status: "pending" }),
      Fee.countDocuments({ status: "paid" }),

      Leave.countDocuments(),
      Leave.countDocuments({ status: "pending" }),
      Leave.countDocuments({ status: "approved" }),
      Leave.countDocuments({ status: "rejected" }),

      Exam.countDocuments(),
      Assignment.countDocuments(),
      Notice.countDocuments(),
      Result.countDocuments(),
      Attendance.countDocuments(),
    ]);

    // ==============================
    // COMPLAINT STATISTICS
    // ==============================

    const [
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints,
      rejectedComplaints,
    ] = await Promise.all([
      Complaint.countDocuments({ status: "pending" }),
      Complaint.countDocuments({ status: "in-progress" }),
      Complaint.countDocuments({ status: "resolved" }),
      Complaint.countDocuments({ status: "rejected" }),
    ]);

    // ==============================
    // RECENT STUDENTS
    // ==============================

    const recentStudents = await Student.find()
      .populate("user", "name email phone")
      .populate("department", "name code")
      .sort({ createdAt: -1 })
      .limit(5);

    // ==============================
    // RECENT FACULTY
    // ==============================

    const recentFaculty = await Faculty.find()
      .populate("user", "name email phone")
      .populate("department", "name code")
      .sort({ createdAt: -1 })
      .limit(5);

    // ==============================
    // RECENT COMPLAINTS
    // ==============================

    const recentComplaints = await Complaint.find()
      .populate({
        path: "student",
        populate: [
          {
            path: "user",
            select: "name email",
          },
          {
            path: "department",
            select: "name code",
          },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(5);

    // ==============================
    // RECENT LEAVES
    // ==============================

    const recentLeaves = await Leave.find()
      .populate({
        path: "student",
        populate: {
          path: "user",
          select: "name email",
        },
      })
      .sort({ createdAt: -1 })
      .limit(5);

    // ==============================
    // UPCOMING EXAMS
    // ==============================

    const upcomingExams = await Exam.find({
      date: { $gte: new Date() },
    })
      .populate("subject", "name code")
      .sort({ date: 1 })
      .limit(5);

    // ==============================
    // RECENT NOTICES
    // ==============================

    const recentNotices = await Notice.find()
      .populate("createdBy", "name email role")
      .populate("department", "name code")
      .sort({ createdAt: -1 })
      .limit(5);

    // ==============================
    // DEPARTMENT-WISE STUDENT COUNT
    // ==============================

    const studentsByDepartment = await Student.aggregate([
      {
        $group: {
          _id: "$department",
          totalStudents: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "department",
        },
      },
      {
        $unwind: {
          path: "$department",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          departmentId: "$department._id",
          departmentName: "$department.name",
          departmentCode: "$department.code",
          totalStudents: 1,
        },
      },
      {
        $sort: {
          totalStudents: -1,
        },
      },
    ]);

    // ==============================
    // FEE SUMMARY
    // ==============================

    const feeSummary = await Fee.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          paidAmount: { $sum: "$paidAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1,
          totalAmount: 1,
          paidAmount: 1,
        },
      },
    ]);

    // ==============================
// FEE COLLECTION SUMMARY
// ==============================

const feeCollection = await Fee.aggregate([
  {
    $group: {
      _id: null,
      totalAmount: { $sum: "$amount" },
      totalPaidAmount: { $sum: "$paidAmount" },
    },
  },
  {
    $project: {
      _id: 0,
      totalAmount: 1,
      totalPaidAmount: 1,
      totalPendingAmount: {
        $subtract: ["$totalAmount", "$totalPaidAmount"],
      },
    },
  },
]);

const feeCollectionSummary = feeCollection[0] || {
  totalAmount: 0,
  totalPaidAmount: 0,
  totalPendingAmount: 0,
};

const collectionPercentage =
  feeCollectionSummary.totalAmount > 0
    ? Number(
        (
          (feeCollectionSummary.totalPaidAmount /
            feeCollectionSummary.totalAmount) *
          100
        ).toFixed(2)
      )
    : 0;

    // ==============================
// LEAVE SUMMARY
// ==============================

const leaveSummary = await Leave.aggregate([
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 },
    },
  },
  {
    $project: {
      _id: 0,
      status: "$_id",
      count: 1,
    },
  },
]);

// ==============================
// ATTENDANCE SUMMARY
// ==============================

const attendanceSummary = await Attendance.aggregate([
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 },
    },
  },
  {
    $project: {
      _id: 0,
      status: "$_id",
      count: 1,
    },
  },
]);

// ==============================
// ASSIGNMENT SUMMARY
// ==============================

const assignmentSummary = await Assignment.aggregate([
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 },
    },
  },
  {
    $project: {
      _id: 0,
      status: "$_id",
      count: 1,
    },
  },
]);

// ==============================
// RESULT SUMMARY
// ==============================

const resultSummary = await Result.aggregate([
  {
    $group: {
      _id: "$published",
      count: { $sum: 1 },
    },
  },
  {
    $project: {
      _id: 0,
      published: "$_id",
      count: 1,
    },
  },
]);

// ==============================
// EXAM SUMMARY
// ==============================

const examSummary = await Exam.aggregate([
  {
    $group: {
      _id: "$examType",
      count: { $sum: 1 },
    },
  },
  {
    $project: {
      _id: 0,
      examType: "$_id",
      count: 1,
    },
  },
]);

// ==============================
// RECENT RESULTS
// ==============================

const recentResults = await Result.find()
  .populate("student", "studentId rollNumber")
  .populate("subject", "name code")
  .sort({ createdAt: -1 })
  .limit(5);



    // ==============================
    // FINAL RESPONSE
    // ==============================

    return res.status(200).json({
      success: true,

      dashboard: {
        statistics: {
          totalUsers,
          totalStudents,
          totalFaculty,
          totalDepartments,
          totalSubjects,
          activeUsers,

          totalComplaints,
          pendingComplaints,
          inProgressComplaints,
          resolvedComplaints,
          rejectedComplaints,

          totalFees,
          pendingFees,
          paidFees,

          totalLeaves,
          pendingLeaves,
          approvedLeaves,
          rejectedLeaves,

          totalExams,
          totalAssignments,
          totalNotices,
          totalResults,
          totalAttendanceRecords,
          
        },

        recentStudents,
        recentFaculty,
        recentComplaints,
        recentLeaves,
        upcomingExams,
        recentNotices,

        studentsByDepartment,

        feeSummary,

        feeCollection: {
        ...feeCollectionSummary,
        collectionPercentage,
        },
        leaveSummary,

        leaveSummary,

        attendanceSummary,
        assignmentSummary,
        resultSummary,
         examSummary,
         recentResults,

        message: "Admin dashboard data loaded successfully",
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while loading admin dashboard",
      error: error.message,
    });
  }
};

module.exports = {
  getAdminDashboard,
};