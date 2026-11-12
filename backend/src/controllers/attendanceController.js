const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const Faculty = require("../models/Faculty");
const Student = require("../models/Student");
const Subject = require("../models/Subject");

const ALLOWED_STATUSES = ["present", "absent", "late", "leave"];

const getFaculty = async (userId) =>
  Faculty.findOne({ user: userId, status: "active" });

const sameId = (left, right) =>
  String(left?._id || left) === String(right?._id || right);

const isStudentInSubjectClass = (student, subject) => {
  // Check if subject is explicitly in student's subjects array
  const hasSubject = (student.subjects || []).some((assignedSubject) =>
    sameId(assignedSubject, subject._id)
  );
  if (hasSubject) return true;

  // Check if student belongs to the same department and semester as the subject
  const studentDeptId = student.department?._id || student.department;
  const subjectDeptId = subject.department?._id || subject.department;
  const sameDept =
    studentDeptId &&
    subjectDeptId &&
    String(studentDeptId) === String(subjectDeptId);
  const sameSem =
    student.semester !== undefined &&
    subject.semester !== undefined &&
    Number(student.semester) === Number(subject.semester);

  return Boolean(sameDept && sameSem);
};

const matchesSelectedSection = (student, section) => {
  const normalizedSection = String(section || "").trim().toUpperCase();

  return (
    !normalizedSection ||
    normalizedSection === "ALL" ||
    !student.section ||
    String(student.section).trim().toUpperCase() === normalizedSection
  );
};

const getDateRange = (date) => {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  const start = new Date(`${date}T00:00:00.000Z`);

  if (
    Number.isNaN(start.getTime()) ||
    start.toISOString().slice(0, 10) !== date
  ) {
    return null;
  }

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { $gte: start, $lt: end };
};

const populateAttendance = (query) =>
  query
    .populate("student", "studentId rollNumber user section")
    .populate("subject", "name code")
    .populate("faculty", "facultyId employeeId");

const markAttendance = async (req, res) => {
  try {
    const {
      student,
      subject,
      date,
      status,
      remarks = "",
      period = "",
      section,
    } = req.body;

    if (
      !student ||
      !subject ||
      !date ||
      !status ||
      typeof section !== "string" ||
      !section.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "student, subject, date, status and section are required",
      });
    }

    if (
      !mongoose.isValidObjectId(student) ||
      !mongoose.isValidObjectId(subject)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid student or subject ID",
      });
    }

    const normalizedStatus = String(status).trim().toLowerCase();

    if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance status",
      });
    }

    const dateRange = getDateRange(date);

    if (!dateRange) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance date",
      });
    }

    const faculty = await getFaculty(req.user._id);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Active faculty profile not found",
      });
    }

    const [studentData, subjectData] = await Promise.all([
      Student.findOne({ _id: student, status: "active" }),
      Subject.findOne({
        _id: subject,
        isActive: true,
      }),
    ]);

    if (!studentData) {
      return res.status(404).json({
        success: false,
        message: "Active student not found",
      });
    }

    if (!subjectData) {
      return res.status(404).json({
        success: false,
        message: "Subject not found or is inactive",
      });
    }

    if (!isStudentInSubjectClass(studentData, subjectData)) {
      return res.status(403).json({
        success: false,
        message: "Student is not assigned to this subject class",
      });
    }

    if (!matchesSelectedSection(studentData, section)) {
      return res.status(403).json({
        success: false,
        message: "Student does not belong to the selected section",
      });
    }

    const normalizedPeriod = String(period).trim();

    const existing = await Attendance.findOne({
      student,
      subject,
      date: dateRange,
      period: normalizedPeriod,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          "Attendance already exists for this student, date, subject and period. Update the existing record instead.",
      });
    }

    const attendance = await Attendance.create({
      student,
      subject,
      faculty: faculty._id,
      date: dateRange.$gte,
      period: normalizedPeriod,
      status: normalizedStatus,
      remarks: String(remarks || "").trim(),
    });

    // Ensure student is also enrolled in this subject if not already
    await Student.updateOne(
      { _id: student, subjects: { $ne: subjectData._id } },
      { $addToSet: { subjects: subjectData._id } }
    ).catch((err) =>
      console.warn("Auto-sync student subjects non-fatal error:", err.message)
    );

    const populated = await populateAttendance(
      Attendance.findById(attendance._id)
    );

    return res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      attendance: populated,
    });
  } catch (error) {
    console.error("Mark attendance error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Attendance already exists for this session",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while marking attendance",
    });
  }
};

const getAttendance = async (req, res) => {
  try {
    const faculty = await getFaculty(req.user._id);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Active faculty profile not found",
      });
    }

    const { subject, date, period } = req.query;
    const filter = { faculty: faculty._id };

    if (subject) {
      if (!mongoose.isValidObjectId(subject)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subject ID",
        });
      }

      filter.subject = subject;
    }

    if (date) {
      const dateRange = getDateRange(date);

      if (!dateRange) {
        return res.status(400).json({
          success: false,
          message: "Invalid attendance date",
        });
      }

      filter.date = dateRange;
    }

    if (period !== undefined) {
      filter.period = String(period).trim();
    }

    const attendance = await populateAttendance(
      Attendance.find(filter).sort({ date: -1, period: 1 })
    );

    return res.status(200).json({
      success: true,
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    console.error("Get attendance error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching attendance",
    });
  }
};

const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks, period, date, section } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance ID",
      });
    }

    if (typeof section !== "string" || !section.trim()) {
      return res.status(400).json({
        success: false,
        message: "section is required",
      });
    }

    const faculty = await getFaculty(req.user._id);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Active faculty profile not found",
      });
    }

    const attendance = await Attendance.findOne({
      _id: id,
      faculty: faculty._id,
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    const [student, subject] = await Promise.all([
      Student.findOne({ _id: attendance.student, status: "active" }),
      Subject.findOne({
        _id: attendance.subject,
        isActive: true,
      }),
    ]);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Active student not found",
      });
    }

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found or is inactive",
      });
    }

    if (!isStudentInSubjectClass(student, subject)) {
      return res.status(403).json({
        success: false,
        message: "Student is not assigned to this subject class",
      });
    }

    if (!matchesSelectedSection(student, section)) {
      return res.status(403).json({
        success: false,
        message: "Student does not belong to the selected section",
      });
    }

    if (status !== undefined) {
      const normalizedStatus = String(status).trim().toLowerCase();

      if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid attendance status",
        });
      }

      attendance.status = normalizedStatus;
    }

    if (remarks !== undefined) {
      attendance.remarks = String(remarks || "").trim();
    }

    if (period !== undefined) {
      attendance.period = String(period || "").trim();
    }

    if (date !== undefined) {
      const dateRange = getDateRange(date);

      if (!dateRange) {
        return res.status(400).json({
          success: false,
          message: "Invalid attendance date",
        });
      }

      attendance.date = dateRange.$gte;
    }

    await attendance.save();

    const updated = await populateAttendance(
      Attendance.findById(attendance._id)
    );

    return res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      attendance: updated,
    });
  } catch (error) {
    console.error("Update attendance error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating attendance",
    });
  }
};

module.exports = {
  markAttendance,
  getAttendance,
  updateAttendance,
};
