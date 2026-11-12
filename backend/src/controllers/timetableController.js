const mongoose = require("mongoose");
const Student = require("../models/Student");
const TimetableEntry = require("../models/TimetableEntry");
const Subject = require("../models/Subject");
const Department = require("../models/Department");
const Faculty = require("../models/Faculty");

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const sessionTypes = ["class", "lab", "break", "activity", "study"];

const timetablePopulate = [
  { path: "subject", select: "name code" },
  {
    path: "faculty",
    select: "user",
    populate: { path: "user", select: "name" },
  },
];

const getStudentTimetable = async (req, res) => {
  try {
    const student = await Student.findOne({
      user: req.user._id,
      status: "active",
    }).select("department semester section subjects");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Active student profile not found.",
      });
    }

    const sectionFilter = student.section
      ? { $in: ["", student.section] }
      : "";
    const subjectConditions = [{ subject: null }];
    if (student.subjects && student.subjects.length > 0) {
      subjectConditions.push({ subject: { $in: student.subjects } });
    } else {
      subjectConditions.push({ department: student.department });
    }

    const timetable = await TimetableEntry.find({
      department: student.department,
      semester: student.semester,
      section: sectionFilter,
      isActive: true,
      $or: subjectConditions,
    })
      .populate(timetablePopulate)
      .sort({ startTime: 1 });

    return res.status(200).json({
      success: true,
      student: {
        semester: student.semester,
        section: student.section || "",
      },
      timetable,
    });
  } catch (error) {
    console.error("Get student timetable error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch timetable.",
    });
  }
};

const validateEntry = async (input) => {
  const {
    title,
    subject,
    department,
    semester,
    section,
    day,
    startTime,
    endTime,
    room,
    faculty,
    sessionType,
    isActive,
  } = input;

  if (!String(title || "").trim()) {
    return { error: "A timetable title is required." };
  }

  if (!mongoose.Types.ObjectId.isValid(department)) {
    return { error: "A valid department is required." };
  }

  const numericSemester = Number(semester);
  if (!Number.isInteger(numericSemester) || numericSemester < 1 || numericSemester > 8) {
    return { error: "Semester must be a number from 1 to 8." };
  }

  if (!days.includes(day)) {
    return { error: "Select a valid timetable day." };
  }

  if (
    !timePattern.test(startTime || "") ||
    !timePattern.test(endTime || "") ||
    startTime >= endTime
  ) {
    return { error: "Enter valid 24-hour times with the end after the start." };
  }

  const type = sessionType || "class";
  if (!sessionTypes.includes(type)) {
    return { error: "Select a valid timetable session type." };
  }

  if (subject && !mongoose.Types.ObjectId.isValid(subject)) {
    return { error: "Select a valid subject." };
  }

  if (faculty && !mongoose.Types.ObjectId.isValid(faculty)) {
    return { error: "Select a valid faculty member." };
  }

  const departmentExists = await Department.exists({ _id: department });
  if (!departmentExists) {
    return { error: "Department not found." };
  }

  if (subject) {
    const subjectExists = await Subject.exists({
      _id: subject,
      department,
      semester: numericSemester,
    });
    if (!subjectExists) {
      return { error: "Subject must belong to the selected department and semester." };
    }
  }

  if (faculty) {
    const facultyExists = await Faculty.exists({
      _id: faculty,
      department,
      status: "active",
    });
    if (!facultyExists) {
      return { error: "Faculty member must be active and belong to the selected department." };
    }
  }

  return {
    value: {
      title: String(title).trim(),
      subject: subject || null,
      department,
      semester: numericSemester,
      section: String(section || "").trim().toUpperCase(),
      day,
      startTime,
      endTime,
      room: String(room || "").trim(),
      faculty: faculty || null,
      sessionType: type,
      ...(typeof isActive === "boolean" ? { isActive } : {}),
    },
  };
};

const getAdminTimetable = async (req, res) => {
  try {
    const filter = {};
    if (req.query.department) {
      if (!mongoose.Types.ObjectId.isValid(req.query.department)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department ID.",
        });
      }
      filter.department = req.query.department;
    }
    if (req.query.semester !== undefined) {
      const semester = Number(req.query.semester);
      if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
        return res.status(400).json({
          success: false,
          message: "Semester must be a number from 1 to 8.",
        });
      }
      filter.semester = semester;
    }
    if (req.query.section !== undefined) {
      filter.section = String(req.query.section).trim().toUpperCase();
    }

    const timetable = await TimetableEntry.find(filter)
      .populate(timetablePopulate)
      .sort({ semester: 1, day: 1, startTime: 1 });

    return res.status(200).json({
      success: true,
      count: timetable.length,
      timetable,
    });
  } catch (error) {
    console.error("Get admin timetable error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch timetable entries.",
    });
  }
};

const createTimetableEntry = async (req, res) => {
  try {
    const validation = await validateEntry(req.body);
    if (validation.error) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    const entry = await TimetableEntry.create(validation.value);
    await entry.populate(timetablePopulate);
    return res.status(201).json({ success: true, timetableEntry: entry });
  } catch (error) {
    console.error("Create timetable entry error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to create timetable entry.",
    });
  }
};

const updateTimetableEntry = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid timetable entry ID." });
    }

    const entry = await TimetableEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: "Timetable entry not found." });
    }

    const validation = await validateEntry({
      ...entry.toObject(),
      ...req.body,
      department: req.body.department ?? entry.department,
      subject: Object.hasOwn(req.body, "subject")
        ? req.body.subject
        : entry.subject,
      semester: req.body.semester ?? entry.semester,
      faculty: Object.hasOwn(req.body, "faculty")
        ? req.body.faculty
        : entry.faculty,
    });
    if (validation.error) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    entry.set(validation.value);
    await entry.save();
    await entry.populate(timetablePopulate);
    return res.status(200).json({ success: true, timetableEntry: entry });
  } catch (error) {
    console.error("Update timetable entry error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to update timetable entry.",
    });
  }
};

const deleteTimetableEntry = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid timetable entry ID." });
    }

    const entry = await TimetableEntry.findByIdAndDelete(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: "Timetable entry not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Timetable entry deleted.",
    });
  } catch (error) {
    console.error("Delete timetable entry error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete timetable entry.",
    });
  }
};

module.exports = {
  getStudentTimetable,
  getAdminTimetable,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
};
