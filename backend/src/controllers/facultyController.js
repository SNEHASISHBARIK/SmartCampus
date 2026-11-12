const mongoose = require("mongoose");
const Faculty = require("../models/Faculty");
const Department = require("../models/Department");
const Subject = require("../models/Subject");
const Assignment = require("../models/Assignment");
const Exam = require("../models/Exam");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

// ============================================================
// CREATE FACULTY PROFILE
// POST /api/faculty/profile
// ============================================================

const createProfile = async (req, res) => {
  try {
    const {
      facultyId,
      employeeId,
      department,
      designation,
      specialization,
      qualification,
      phone,
      dateOfJoining,
    } = req.body;

    // Check required fields
    if (
      !facultyId ||
      !employeeId ||
      !department ||
      !designation
    ) {
      return res.status(400).json({
        success: false,
        message:
          "facultyId, employeeId, department and designation are required",
      });
    }

    // Check if faculty profile already exists
    const existingProfile = await Faculty.findOne({
      user: req.user._id,
    });

    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: "Faculty profile already exists",
      });
    }

    // Find department using department code
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

    // Check duplicate faculty ID
    const existingFacultyId = await Faculty.findOne({
      facultyId,
    });

    if (existingFacultyId) {
      return res.status(409).json({
        success: false,
        message: "Faculty ID already exists",
      });
    }

    // Check duplicate employee ID
    const existingEmployeeId = await Faculty.findOne({
      employeeId,
    });

    if (existingEmployeeId) {
      return res.status(409).json({
        success: false,
        message: "Employee ID already exists",
      });
    }

    // Create faculty profile
    const faculty = await Faculty.create({
      user: req.user._id,
      facultyId,
      employeeId,
      department: departmentData._id,
      designation,
      specialization,
      qualification,
      phone,
      dateOfJoining,
      status: "active",
    });

    // Get populated faculty profile
    const populatedFaculty = await Faculty.findById(
      faculty._id
    )
      .populate("user", "-password")
      .populate("department", "name code");

    res.status(201).json({
      success: true,
      message: "Faculty profile created successfully",
      faculty: populatedFaculty,
    });
  } catch (error) {
    console.error("Create faculty profile error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating faculty profile",
    });
  }
};

// ============================================================
// GET FACULTY PROFILE
// GET /api/faculty/profile
// ============================================================

const getProfile = async (req, res) => {
  try {
    const faculty = await Faculty.findOne({
      user: req.user._id,
    })
      .populate("user", "-password")
      .populate("department", "name code");

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty profile not found",
      });
    }

    res.status(200).json({
      success: true,
      faculty,
    });
  } catch (error) {
    console.error("Get faculty profile error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============================================================
// UPDATE FACULTY PROFILE
// PUT /api/faculty/profile
// ============================================================

const updateProfile = async (req, res) => {
  try {
    const {
      specialization,
      qualification,
      phone,
      designation,
      dateOfJoining,
    } = req.body;

    const faculty = await Faculty.findOne({
      user: req.user._id,
    });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty profile not found",
      });
    }

    // Update only fields that were provided
    if (specialization !== undefined) {
      faculty.specialization = specialization;
    }

    if (qualification !== undefined) {
      faculty.qualification = qualification;
    }

    if (phone !== undefined) {
      faculty.phone = phone;
    }

    if (designation !== undefined) {
      faculty.designation = designation;
    }

    if (dateOfJoining !== undefined) {
      faculty.dateOfJoining = dateOfJoining;
    }

    await faculty.save();

    const updatedFaculty = await Faculty.findById(
      faculty._id
    )
      .populate("user", "-password")
      .populate("department", "name code");

    res.status(200).json({
      success: true,
      message: "Faculty profile updated successfully",
      faculty: updatedFaculty,
    });
  } catch (error) {
    console.error("Update faculty profile error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============================================================
// FACULTY DASHBOARD
// GET /api/faculty/dashboard
// ============================================================

const getDashboard = async (req, res) => {
  try {
    // Find logged-in faculty
    const faculty = await Faculty.findOne({
      user: req.user._id,
      status: "active",
    })
      .populate("user", "name email phone profileImage")
      .populate("department", "name code");

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty profile not found",
      });
    }

    // ========================================================
    // GET SUBJECTS ASSIGNED TO FACULTY (OR IN DEPARTMENT)
    // ========================================================

    const facultyDeptId = faculty.department?._id || faculty.department;

    let subjects = await Subject.find({
      $or: [
        { faculty: faculty._id },
        ...(facultyDeptId ? [{ department: facultyDeptId }] : []),
      ],
      isActive: true,
    })
      .populate("department", "name code")
      .select("_id name code semester department faculty");

    if (subjects.length === 0) {
      subjects = await Subject.find({ isActive: true })
        .populate("department", "name code")
        .select("_id name code semester department faculty");
    }

    const subjectIds = subjects.map(
      (subject) => subject._id
    );

    // ========================================================
    // GET STUDENTS
    // Active students assigned to subjects or department
    // ========================================================

    let students = [];

    if (subjectIds.length > 0) {
      const facultyDeptId = faculty.department?._id || faculty.department;
      students = await Student.find({
        $or: [
          { subjects: { $in: subjectIds } },
          ...(facultyDeptId ? [{ department: facultyDeptId }] : []),
        ],
        status: "active",
      })
        .populate("user", "name email phone")
        .populate("department", "name code")
        .select("-__v");
    }

    // ========================================================
    // COUNT ASSIGNMENTS
    // ========================================================

    const totalAssignments =
      await Assignment.countDocuments({
        faculty: faculty._id,
      });

    // ========================================================
    // COUNT EXAMS
    // ========================================================

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingExamFilter = {
      subject: { $in: subjectIds },
      date: { $gte: today },
      status: { $nin: ["Completed", "Closed", "Cancelled"] },
    };

    const totalExams = await Exam.countDocuments(upcomingExamFilter);

    // ========================================================
    // COUNT ATTENDANCE RECORDS
    // ========================================================

    const totalAttendanceRecords =
      await Attendance.countDocuments({
        faculty: faculty._id,
      });

    // ========================================================
    // RECENT ASSIGNMENTS
    // ========================================================

    const recentAssignments =
      await Assignment.find({
        faculty: faculty._id,
      })
        .populate("subject", "name code")
        .sort({ createdAt: -1 })
        .limit(5);

    // ========================================================
    // UPCOMING EXAMS
    // ========================================================

    const upcomingExams = await Exam.find(upcomingExamFilter)
      .populate("subject", "name code")
      .sort({ date: 1, startTime: 1 })
      .limit(5);

    // ========================================================
    // RESPONSE
    // ========================================================

    res.status(200).json({
      success: true,

      dashboard: {
        faculty,

        statistics: {
          totalSubjects: subjects.length,
          totalStudents: students.length,
          totalAssignments,
          totalExams,
          totalAttendanceRecords,
        },

        subjects,
        students,

        recentAssignments,
        upcomingExams,
      },
    });
  } catch (error) {
    console.error(
      "Faculty dashboard error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while loading faculty dashboard",
    });
  }
};

// ============================================================
// GET ALL FACULTY SUBJECTS
// GET /api/faculty/subjects
// ============================================================

const getFacultySubjects = async (req, res) => {
  try {
    const faculty = await Faculty.findOne({
      user: req.user._id,
      status: "active",
    }).populate("department", "name code");

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Active faculty profile not found",
      });
    }

    const facultyDeptId = faculty.department?._id || faculty.department;

    // Fetch all active subjects with department info
    const allSubjects = await Subject.find({
      isActive: true,
    })
      .populate("department", "name code")
      .populate({
        path: "faculty",
        populate: { path: "user", select: "name email" },
      })
      .sort({ semester: 1, code: 1 });

    const formattedSubjects = allSubjects.map((sub) => {
      const isAssigned = (sub.faculty || []).some((f) => {
        const fid = f?._id || f;
        return String(fid) === String(faculty._id);
      });
      const subDeptId = sub.department?._id || sub.department;
      const isSameDepartment =
        facultyDeptId &&
        subDeptId &&
        String(facultyDeptId) === String(subDeptId);

      return {
        _id: sub._id,
        name: sub.name,
        code: sub.code,
        semester: sub.semester,
        credits: sub.credits,
        department: sub.department,
        isAssigned,
        isDepartment: Boolean(isSameDepartment),
      };
    });

    // Priority sort: assigned first, then department subjects, then semester & code
    formattedSubjects.sort((a, b) => {
      if (a.isAssigned !== b.isAssigned) {
        return a.isAssigned ? -1 : 1;
      }
      if (a.isDepartment !== b.isDepartment) {
        return a.isDepartment ? -1 : 1;
      }
      if (a.semester !== b.semester) {
        return a.semester - b.semester;
      }
      return (a.code || "").localeCompare(b.code || "");
    });

    return res.status(200).json({
      success: true,
      count: formattedSubjects.length,
      subjects: formattedSubjects,
    });
  } catch (error) {
    console.error("Get faculty subjects error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while loading faculty subjects",
    });
  }
};

// ============================================================
// GET STUDENTS FOR A FACULTY SUBJECT ATTENDANCE SESSION
// GET /api/faculty/attendance/students
// ============================================================

const getAttendanceStudents = async (req, res) => {
  try {
    const { subjectId, section } = req.query;

    if (!mongoose.isValidObjectId(subjectId)) {
      return res.status(400).json({
        success: false,
        message: "Valid subjectId is required",
      });
    }

    const faculty = await Faculty.findOne({
      user: req.user._id,
      status: "active",
    });

    if (!faculty) {
      return res.status(403).json({
        success: false,
        message: "Active faculty profile not found",
      });
    }

    const subject = await Subject.findOne({
      _id: subjectId,
      isActive: true,
    }).populate("department", "name code");

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found or is inactive",
      });
    }

    const departmentId =
      subject.department?._id || subject.department || faculty.department;

    // Flexible class filter: student enrolled in subject OR in same department + semester
    const classConditions = [{ subjects: subject._id }];

    if (departmentId && subject.semester) {
      classConditions.push({
        department: departmentId,
        semester: subject.semester,
      });
    }

    const classFilter = {
      status: "active",
      $or: classConditions,
    };

    const normalizedSection =
      typeof section === "string" ? section.trim().toUpperCase() : "";
    const studentFilter = { ...classFilter };

    if (normalizedSection && normalizedSection !== "ALL") {
      const escapedSection = normalizedSection.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
      studentFilter.section = new RegExp(`^${escapedSection}$`, "i");
    }

    const [students, storedSections] = await Promise.all([
      Student.find(studentFilter)
        .populate("user", "name email phone")
        .populate("department", "name code")
        .sort({ rollNumber: 1 })
        .select("-__v"),
      Student.distinct("section", {
        ...classFilter,
        section: { $nin: [null, ""] },
      }),
    ]);

    const sections = [
      ...new Set(
        storedSections
          .filter((value) => typeof value === "string")
          .map((value) => value.trim().toUpperCase())
          .filter((value) => value.length > 0)
      ),
    ].sort();

    return res.status(200).json({
      success: true,
      subject: {
        _id: subject._id,
        name: subject.name,
        code: subject.code,
        semester: subject.semester,
        department: departmentId,
      },
      sections,
      students,
      totalStudents: students.length,
    });
  } catch (error) {
    console.error("Get attendance students error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load students for attendance",
    });
  }
};

// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
  createProfile,
  getProfile,
  updateProfile,
  getDashboard,
  getFacultySubjects,
  getAttendanceStudents,
};