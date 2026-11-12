const User = require("../models/User");
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const Assignment = require("../models/Assignment");
const Result = require("../models/Result");
const Notice = require("../models/Notice");
const Complaint = require("../models/Complaint");
const Leave = require("../models/Leave");
const Fee = require("../models/Fee");
const Exam = require("../models/Exam");
const Subject = require("../models/Subject");
const Note = require("../models/Note");

const Department = require("../models/Department");

// CREATE STUDENT PROFILE
const createProfile = async (req, res) => {
  try {
    const {
      studentId,
      rollNumber,
      department,
      semester,
      section,
      batch,
      dateOfBirth,
      gender,
      address,
      guardianName,
      guardianPhone,
      admissionDate,
    } = req.body;

    // Check required fields
    if (
      !studentId ||
      !rollNumber ||
      !department ||
      !semester
    ) {
      return res.status(400).json({
        success: false,
        message:
          "studentId, rollNumber, department and semester are required",
      });
    }

    // Check if profile already exists
    const existingProfile = await Student.findOne({
      user: req.user._id,
    });

    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: "Student profile already exists",
      });
    }

    // Find department
    const departmentData = await Department.findOne({
      code: department.toUpperCase(),
      isActive: true,
    });

    if (!departmentData) {
      return res.status(404).json({
        success: false,
        message: `Department '${department}' not found`,
      });
    }

    // Check duplicate student ID
    const existingStudentId = await Student.findOne({
      studentId,
    });

    if (existingStudentId) {
      return res.status(409).json({
        success: false,
        message: "Student ID already exists",
      });
    }

    // Check duplicate roll number
    const existingRollNumber = await Student.findOne({
      rollNumber,
    });

    if (existingRollNumber) {
      return res.status(409).json({
        success: false,
        message: "Roll number already exists",
      });
    }

    // Create student profile
    const student = await Student.create({
      user: req.user._id,
      studentId,
      rollNumber,
      department: departmentData._id,
      semester,
      section,
      batch,
      dateOfBirth,
      gender,
      address,
      guardianName,
      guardianPhone,
      admissionDate,
    });

    // Return populated profile
    const populatedStudent = await Student.findById(
      student._id
    )
      .populate("user", "-password")
      .populate("department", "name code");

    res.status(201).json({
      success: true,
      message: "Student profile created successfully",
      student: populatedStudent,
    });
  } catch (error) {
    console.error("Create student profile error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating student profile",
    });
  }
};

// GET PROFILE
const getProfile = async (req, res) => {
  try {
    const student = await Student.findOne({
      user: req.user._id,
    })
      .populate("user", "-password")
      .populate("department", "name code");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    res.json({
      success: true,
      student,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// UPDATE PROFILE
const updateProfile = async (req, res) => {
  try {
    const {
      phone,
      address,
      guardianName,
      guardianPhone,
      profileImage,
    } = req.body;

    const student = await Student.findOne({
      user: req.user._id,
      status: "active",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    student.address = address ?? student.address;
    student.guardianName =
      guardianName ?? student.guardianName;
    student.guardianPhone =
      guardianPhone ?? student.guardianPhone;

    await student.save();

    await User.findByIdAndUpdate(req.user._id, {
      phone: phone ?? req.user.phone,
      profileImage:
        profileImage ?? req.user.profileImage,
    });

    const updatedStudent = await Student.findById(student._id)
      .populate("user", "-password")
      .populate("department", "name code");

    res.json({
      success: true,
      message: "Profile updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ATTENDANCE
const getAttendance = async (req, res) => {
  try {
    const student = await Student.findOne({
      user: req.user._id,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const attendance = await Attendance.find({
      student: student._id,
    })
      .populate("subject", "name code")
      .populate("faculty", "employeeId")
      .sort({ date: -1 });

    const total = attendance.length;

    const present = attendance.filter(
      (item) => item.status === "present"
    ).length;

    const absent = attendance.filter(
      (item) => item.status === "absent"
    ).length;

    const late = attendance.filter(
      (item) => item.status === "late"
    ).length;

    const percentage =
      total > 0
        ? Number(((present / total) * 100).toFixed(2))
        : 0;

    res.json({
      success: true,
      summary: {
        total,
        present,
        absent,
        late,
        percentage,
      },
      attendance,
    });
  } catch (error) {
    console.error("Attendance error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// SUBJECTS
const getSubjects = async (req, res) => {
  try {
    const student = await Student.findOne({
      user: req.user._id,
      status: "active",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const semester =
      req.query.semester === undefined
        ? student.semester
        : Number(req.query.semester);

    if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
      return res.status(400).json({
        success: false,
        message: "Semester must be a number from 1 to 8.",
      });
    }

    let subjectFilter = {
      semester,
      isActive: true,
    };
    if (student.subjects && student.subjects.length > 0) {
      subjectFilter._id = { $in: student.subjects };
    } else if (student.department) {
      subjectFilter.department = student.department;
    }

    const subjects = await Subject.find(subjectFilter)
      .populate({
        path: "faculty",
        select: "employeeId user",
        populate: { path: "user", select: "name" },
      })
      .populate("department", "name code");

    return res.json({
      success: true,
      student: {
        semester: student.semester,
        department: student.department,
      },
      selectedSemester: semester,
      subjects,
    });
  } catch (error) {
    console.error("Subjects error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ASSIGNMENTS
const getAssignments = async (req, res) => {
  try {
    const student = await Student.findOne({
      user: req.user._id,
      status: "active",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    let subjectIds = student.subjects || [];
    if (!subjectIds.length && student.department) {
      const deptSubjects = await Subject.find({
        department: student.department,
        semester: student.semester,
        isActive: true,
      }).select("_id");
      subjectIds = deptSubjects.map((s) => s._id);
    }

    const assignments = await Assignment.find({
      semester: student.semester,
      status: "active",
      $or: [
        { subject: { $in: subjectIds } },
        ...(student.department ? [{ department: student.department }] : []),
      ],
    })
      .populate("subject", "name code")
      .populate({
        path: "faculty",
        select: "employeeId user",
        populate: { path: "user", select: "name" },
      })
      .sort({ dueDate: 1 });

    return res.json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error("Assignments error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// RESULTS
const getResults = async (req, res) => {
  try {
    const student = await Student.findOne({
      user: req.user._id,
      status: "active",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Active student profile not found.",
      });
    }

    const filter = {
      student: student._id,
      published: true,
    };

    let selectedSemester = null;
    if (req.query.semester !== undefined && req.query.semester !== "all") {
      selectedSemester = Number(req.query.semester);
      if (
        !Number.isInteger(selectedSemester) ||
        selectedSemester < 1 ||
        selectedSemester > 8
      ) {
        return res.status(400).json({
          success: false,
          message: "Semester must be a number from 1 to 8.",
        });
      }
      filter.semester = selectedSemester;
    }

    const results = await Result.find(filter)
      .populate("subject", "name code credits")
      .sort({
        semester: 1,
        createdAt: -1,
      });

    return res.json({
      success: true,
      count: results.length,
      currentSemester: student.semester,
      selectedSemester,
      results,
    });
  } catch (error) {
    console.error("Results error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// NOTICES
const getNotices = async (req, res) => {
  try {
    const student = await Student.findOne({
      user: req.user._id,
      status: "active",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Active student profile not found.",
      });
    }

    const now = new Date();
    const notices = await Notice.find({
      published: true,
      $and: [
        {
          $or: [
            { targetRoles: "student" },
            { targetRoles: { $size: 0 } },
          ],
        },
        {
          $or: [
            { department: null },
            { department: student.department },
          ],
        },
        {
          $or: [
            { expiresAt: null },
            { expiresAt: { $gte: now } },
          ],
        },
      ],
    })
      .populate("createdBy", "name role")
      .populate("department", "name code")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: notices.length,
      notices,
    });
  } catch (error) {
    console.error("Notices error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// COMPLAINTS
const getComplaints = async (req, res) => {
  try {
    const student = await Student.findOne({
      user: req.user._id,
      status: "active",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Active student profile not found.",
      });
    }

    const complaints = await Complaint.find({
      student: student._id,
    })
      .populate("resolvedBy", "name role")
      .sort({ createdAt: -1 });

    const statistics = complaints.reduce(
      (summary, complaint) => {
        summary.total += 1;
        if (complaint.status === "resolved") summary.resolved += 1;
        if (complaint.status === "in-progress") summary.inProgress += 1;
        if (complaint.status === "pending") summary.pending += 1;
        if (complaint.status === "rejected") summary.rejected += 1;
        return summary;
      },
      { total: 0, resolved: 0, inProgress: 0, pending: 0, rejected: 0 }
    );

    return res.json({
      success: true,
      count: complaints.length,
      statistics,
      complaints,
    });
  } catch (error) {
    console.error("Complaints error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const createComplaint = async (req, res) => {
  try {
    const {
      subject,
      description,
      category,
    } = req.body;

    if (
      typeof subject !== "string" ||
      typeof description !== "string" ||
      !subject.trim() ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Subject and description are required.",
      });
    }

    const allowedCategories = [
      "academic",
      "hostel",
      "library",
      "transport",
      "fees",
      "technical",
      "other",
    ];
    const normalizedCategory = category || "other";
    if (!allowedCategories.includes(normalizedCategory)) {
      return res.status(400).json({
        success: false,
        message: "Select a valid complaint category.",
      });
    }

    const student = await Student.findOne({
      user: req.user._id,
      status: "active",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Active student profile not found.",
      });
    }

    const complaint = await Complaint.create({
      student: student._id,
      subject: subject.trim(),
      description: description.trim(),
      category: normalizedCategory,
    });

    return res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      complaint,
    });
  } catch (error) {
    console.error("Create complaint error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// LEAVES
const getLeaves = async (req, res) => {
  try {
    const student = await Student.findOne({
      user: req.user._id,
      status: "active",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Active student profile not found.",
      });
    }

    const leaves = await Leave.find({
      student: student._id,
    })
      .populate("reviewedBy", "name role")
      .sort({ createdAt: -1 });

    const statistics = leaves.reduce(
      (summary, leave) => {
        summary.total += 1;
        if (leave.status === "pending") summary.pending += 1;
        if (leave.status === "approved") {
          summary.approved += 1;
          const from = new Date(leave.fromDate);
          const to = new Date(leave.toDate);
          const fromDay = Date.UTC(
            from.getUTCFullYear(),
            from.getUTCMonth(),
            from.getUTCDate()
          );
          const toDay = Date.UTC(
            to.getUTCFullYear(),
            to.getUTCMonth(),
            to.getUTCDate()
          );
          summary.approvedCalendarDays +=
            Math.floor((toDay - fromDay) / 86400000) + 1;
        }
        if (leave.status === "rejected") summary.rejected += 1;
        return summary;
      },
      { total: 0, pending: 0, approved: 0, rejected: 0, approvedCalendarDays: 0 }
    );

    return res.json({
      success: true,
      count: leaves.length,
      statistics,
      leaves,
    });
  } catch (error) {
    console.error("Leaves error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const createLeave = async (req, res) => {
  try {
    const {
      fromDate,
      toDate,
      reason,
      leaveType,
      documentUrl,
    } = req.body;

    if (
      typeof fromDate !== "string" ||
      typeof toDate !== "string" ||
      typeof reason !== "string" ||
      !fromDate ||
      !toDate ||
      !reason.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "From date, to date and reason are required.",
      });
    }

    const allowedLeaveTypes = ["medical", "personal", "family", "academic", "other"];
    const normalizedLeaveType = leaveType || "personal";
    if (!allowedLeaveTypes.includes(normalizedLeaveType)) {
      return res.status(400).json({
        success: false,
        message: "Select a valid leave type.",
      });
    }

    const validDateOnly = (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const parsed = new Date(`${value}T00:00:00.000Z`);
      return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
      );
    };

    const from = new Date(`${fromDate}T00:00:00.000Z`);
    const to = new Date(`${toDate}T00:00:00.000Z`);
    if (
      !validDateOnly(fromDate) ||
      !validDateOnly(toDate) ||
      fromDate > toDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter valid leave dates. The end date must be on or after the start date.",
      });
    }

    const student = await Student.findOne({
      user: req.user._id,
      status: "active",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Active student profile not found.",
      });
    }

    const leave = await Leave.create({
      student: student._id,
      fromDate: from,
      toDate: to,
      reason: reason.trim(),
      leaveType: normalizedLeaveType,
      documentUrl: String(documentUrl || "").trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Leave application submitted",
      leave,
    });
  } catch (error) {
    console.error("Create leave error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// FEES
const getFees = async (req, res) => {
  try {
    const student = await Student.findOne({
      user: req.user._id,
      status: "active",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Active student profile not found.",
      });
    }

    const fees = await Fee.find({
      student: student._id,
    }).sort({
      semester: -1,
      dueDate: 1,
    });

    const summary = fees.reduce(
      (totals, fee) => {
        const amount = Number(fee.amount) || 0;
        const paid = Number(fee.paidAmount) || 0;
        totals.totalAmount += amount;
        totals.paidAmount += paid;
        totals.pendingAmount += Math.max(amount - paid, 0);
        return totals;
      },
      { totalAmount: 0, paidAmount: 0, pendingAmount: 0 }
    );
    const nextDue = fees
      .filter((fee) => Number(fee.paidAmount) < Number(fee.amount) && fee.dueDate)
      .sort((first, second) => new Date(first.dueDate) - new Date(second.dueDate))[0];

    return res.json({
      success: true,
      count: fees.length,
      summary: {
        ...summary,
        nextDueDate: nextDue?.dueDate || null,
      },
      fees,
    });
  } catch (error) {
    console.error("Fees error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// EXAMS
const getExams = async (req, res) => {
  try {
    const student = await Student.findOne({
      user: req.user._id,
      status: "active",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Active student profile not found.",
      });
    }

    let subjectIds = student.subjects || [];
    if (!subjectIds.length && student.department) {
      const deptSubjects = await Subject.find({
        department: student.department,
        semester: student.semester,
        isActive: true,
      }).select("_id");
      subjectIds = deptSubjects.map((s) => s._id);
    }

    const exams = await Exam.find({
      semester: student.semester,
      $or: [
        { subject: { $in: subjectIds } },
        ...(student.department ? [{ department: student.department }] : []),
      ],
    })
      .populate("subject", "name code")
      .sort({ date: 1 });

    return res.json({
      success: true,
      student: {
        semester: student.semester,
      },
      exams,
    });
  } catch (error) {
    console.error("Exams error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


//note

const getNotes = async (req, res) => {
  try {
    const student = await Student.findOne({
      user: req.user._id,
      status: "active",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Active student profile not found.",
      });
    }

    let subjectIds = student.subjects || [];
    if (!subjectIds.length && student.department) {
      const deptSubjects = await Subject.find({
        department: student.department,
        semester: student.semester,
        isActive: true,
      }).select("_id");
      subjectIds = deptSubjects.map((s) => s._id);
    }

    const notes = await Note.find({
      semester: student.semester,
      status: "active",
      $or: [
        { subject: { $in: subjectIds } },
        ...(student.department ? [{ department: student.department }] : []),
      ],
    })
      .populate("subject", "name code")
      .populate("faculty", "facultyId employeeId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: notes.length,
      student: {
        semester: student.semester,
      },
      notes,
    });
  } catch (error) {
    console.error("Student notes error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching notes",
    });
  }
};

// DASHBOARD
const getDashboard = async (req, res) => {
  try {
    const student = await Student.findOne({
      user: req.user._id,
      status: "active",
    })
      .populate("user", "name email phone profileImage")
      .populate("department", "name code");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    let subjectFilter = { isActive: true };
    if (student.subjects && student.subjects.length > 0) {
      subjectFilter._id = { $in: student.subjects };
    } else if (student.department) {
      subjectFilter.department = student.department;
      subjectFilter.semester = student.semester;
    }

    const assignedSubjects = await Subject.find(subjectFilter)
      .populate("department", "name code")
      .populate({
        path: "faculty",
        select: "employeeId user",
        populate: { path: "user", select: "name" },
      });
    const subjectIds = assignedSubjects.map((subject) => subject._id);

    const [
      attendance,
      assignments,
      results,
      notices,
      complaints,
      leaves,
      fees,
      exams,
    ] = await Promise.all([
      Attendance.find({ student: student._id }),
      Assignment.find({
        subject: { $in: subjectIds },
        semester: student.semester,
        status: "active",
      }),
      Result.find({
        student: student._id,
        published: true,
      }),
      Notice.find({
        published: true,
        targetRoles: "student",
      })
        .sort({ createdAt: -1 })
        .limit(5),
      Complaint.find({
        student: student._id,
      }),
      Leave.find({
        student: student._id,
      }),
      Fee.find({
        student: student._id,
      }),
      Exam.find({
        semester: student.semester,
        subject: { $in: subjectIds },
      })
        .populate("subject", "name code")
        .sort({ date: 1 })
        .limit(5),
    ]);

    const present = attendance.filter(
      (item) => item.status === "present"
    ).length;

    const attendancePercentage =
      attendance.length > 0
        ? Number(
            ((present / attendance.length) * 100).toFixed(2)
          )
        : 0;

    const pendingFees = fees.reduce(
      (sum, fee) => sum + (fee.amount - fee.paidAmount),
      0
    );

    res.json({
      success: true,
      dashboard: {
        student,
        subjects: assignedSubjects,
        attendance: {
          total: attendance.length,
          present,
          percentage: attendancePercentage,
        },
        assignmentsCount: assignments.length,
        resultsCount: results.length,
        notices,
        complaintsCount: complaints.length,
        pendingLeaves: leaves.filter(
          (leave) => leave.status === "pending"
        ).length,
        pendingFees,
        upcomingExams: exams,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



module.exports = {
    createProfile,
  getProfile,
  updateProfile,
  getAttendance,
  getSubjects,
  getAssignments,
  getResults,
  getNotices,
  getComplaints,
  createComplaint,
  getLeaves,
  createLeave,
  getFees,
  getExams,
  getDashboard,
  getNotes,
};