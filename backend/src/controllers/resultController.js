
const mongoose = require("mongoose");

const Result = require("../models/Result");
const Faculty = require("../models/Faculty");
const Student = require("../models/Student");
const Subject = require("../models/Subject");

// Calculate grade on the backend
const calculateGrade = (marksObtained, totalMarks) => {
  const percentage = (marksObtained / totalMarks) * 100;

  if (percentage >= 90) return { grade: "O", gradePoint: 10 };
  if (percentage >= 80) return { grade: "A", gradePoint: 9 };
  if (percentage >= 70) return { grade: "B", gradePoint: 8 };
  if (percentage >= 60) return { grade: "C", gradePoint: 7 };
  if (percentage >= 50) return { grade: "D", gradePoint: 6 };
  if (percentage >= 40) return { grade: "E", gradePoint: 5 };

  return { grade: "F", gradePoint: 0 };
};

// Validate marks
const validateMarks = (marksObtained, totalMarks) => {
  if (
    marksObtained === undefined ||
    totalMarks === undefined ||
    marksObtained === null ||
    totalMarks === null ||
    marksObtained === "" ||
    totalMarks === ""
  ) {
    return "Marks obtained and total marks are required.";
  }

  const obtained = Number(marksObtained);
  const total = Number(totalMarks);

  if (!Number.isFinite(obtained) || !Number.isFinite(total)) {
    return "Marks must be valid numbers.";
  }

  if (total <= 0) {
    return "Total marks must be greater than zero.";
  }

  if (obtained < 0) {
    return "Marks obtained cannot be negative.";
  }

  if (obtained > total) {
    return "Marks obtained cannot exceed total marks.";
  }

  return null;
};

// Get active faculty profile
const getActiveFaculty = async (userId) => {
  return Faculty.findOne({
    user: userId,
    status: "active",
  });
};

// Create result
const createResult = async (req, res) => {
  try {
    const {
      student,
      subject,
      semester,
      examType,
      marksObtained,
      totalMarks,
      published,
    } = req.body;

    if (
      !student ||
      !subject ||
      semester === undefined ||
      semester === null ||
      semester === "" ||
      !examType ||
      marksObtained === undefined ||
      totalMarks === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required result fields.",
      });
    }

    if (
      !mongoose.isValidObjectId(student) ||
      !mongoose.isValidObjectId(subject)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid student or subject ID.",
      });
    }

    const semesterNumber = Number(semester);

    if (
      !Number.isInteger(semesterNumber) ||
      semesterNumber < 1 ||
      semesterNumber > 8
    ) {
      return res.status(400).json({
        success: false,
        message: "Semester must be a whole number between 1 and 8.",
      });
    }

    const allowedExamTypes = [
      "internal",
      "midterm",
      "end-semester",
      "practical",
      "assignment",
    ];

    if (!allowedExamTypes.includes(examType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam type.",
      });
    }

    if (published !== undefined && typeof published !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Published must be true or false.",
      });
    }

    const marksError = validateMarks(marksObtained, totalMarks);

    if (marksError) {
      return res.status(400).json({
        success: false,
        message: marksError,
      });
    }

    const faculty = await getActiveFaculty(req.user._id);

    if (!faculty) {
      return res.status(403).json({
        success: false,
        message: "Active faculty profile not found.",
      });
    }

    // Ensure subject exists and is active; auto-link faculty if needed
    const subjectData = await Subject.findOne({
      _id: subject,
      isActive: true,
    });

    if (!subjectData) {
      return res.status(404).json({
        success: false,
        message: "Subject not found or is inactive.",
      });
    }

    const isAssigned = Array.isArray(subjectData.faculty)
      ? subjectData.faculty.some(
          (assignedId) =>
            String(assignedId?._id || assignedId) === String(faculty._id)
        )
      : String(subjectData.faculty?._id || subjectData.faculty || "") ===
        String(faculty._id);

    if (!isAssigned) {
      if (!Array.isArray(subjectData.faculty)) {
        subjectData.faculty = subjectData.faculty ? [subjectData.faculty] : [];
      }
      subjectData.faculty.push(faculty._id);
      await subjectData.save();
    }

    const studentData = await Student.findById(student);

    if (!studentData || studentData.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "Active student not found.",
      });
    }

    if (
      studentData.department &&
      subjectData.department &&
      String(studentData.department?._id || studentData.department) !==
      String(subjectData.department?._id || subjectData.department)
    ) {
      return res.status(400).json({
        success: false,
        message: "Student and subject must belong to the same department.",
      });
    }

    if (
      subjectData.semester !== undefined &&
      Number(subjectData.semester) !== semesterNumber
    ) {
      return res.status(400).json({
        success: false,
        message: "Semester does not match the subject semester.",
      });
    }

    if (
      studentData.semester !== undefined &&
      Number(studentData.semester) !== semesterNumber
    ) {
      return res.status(400).json({
        success: false,
        message: "Semester does not match the student's semester.",
      });
    }

    // Prevent duplicate results for the same exam
    const existingResult = await Result.findOne({
      student,
      subject,
      semester: semesterNumber,
      examType,
    });

    if (existingResult) {
      return res.status(409).json({
        success: false,
        message: "A result already exists for this student, subject and exam.",
      });
    }

    const obtained = Number(marksObtained);
    const total = Number(totalMarks);
    const { grade, gradePoint } = calculateGrade(obtained, total);

    const result = await Result.create({
      student,
      subject,
      semester: semesterNumber,
      examType,
      marksObtained: obtained,
      totalMarks: total,
      grade,
      gradePoint,
      published: published ?? false,
    });

    const populatedResult = await Result.findById(result._id)
      .populate({
        path: "student",
        select: "studentId rollNumber semester section user",
        populate: {
          path: "user",
          select: "name email",
        },
      })
      .populate("subject", "name code semester");

    return res.status(201).json({
      success: true,
      message: "Result created successfully.",
      result: populatedResult,
    });
  } catch (error) {
    console.error("Create result error:", error);

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create result.",
    });
  }
};

// Get results belonging to the logged-in faculty's subjects
const getResults = async (req, res) => {
  try {
    const faculty = await getActiveFaculty(req.user._id);

    if (!faculty) {
      return res.status(403).json({
        success: false,
        message: "Active faculty profile not found.",
      });
    }

    const facultyDeptId = faculty.department?._id || faculty.department;

    let subjects = await Subject.find({
      $or: [
        { faculty: faculty._id },
        ...(facultyDeptId ? [{ department: facultyDeptId }] : []),
      ],
      isActive: true,
    }).select("_id");

    if (subjects.length === 0) {
      subjects = await Subject.find({ isActive: true }).select("_id");
    }

    const subjectIds = subjects.map((subject) => subject._id);

    const filter = { subject: { $in: subjectIds } };
    if (req.query.subject && mongoose.isValidObjectId(req.query.subject)) {
      filter.subject = req.query.subject;
    }

    const results = await Result.find(filter)
      .populate({
        path: "student",
        select: "studentId rollNumber semester section department user",
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
      .populate({
        path: "subject",
        select: "name code semester department",
        populate: {
          path: "department",
          select: "name code",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("Get results error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch results.",
    });
  }
};

// Update result marks
const updateResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { marksObtained, totalMarks, published } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid result ID.",
      });
    }

    const faculty = await getActiveFaculty(req.user._id);

    if (!faculty) {
      return res.status(403).json({
        success: false,
        message: "Active faculty profile not found.",
      });
    }

    const result = await Result.findById(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found.",
      });
    }

    // Verify active subject exists and auto-link faculty
    const assignedSubject = await Subject.findOne({
      _id: result.subject,
      isActive: true,
    });

    if (!assignedSubject) {
      return res.status(403).json({
        success: false,
        message: "Subject for this result is not active.",
      });
    }

    const isAssigned = Array.isArray(assignedSubject.faculty)
      ? assignedSubject.faculty.some(
          (assignedId) =>
            String(assignedId?._id || assignedId) === String(faculty._id)
        )
      : String(assignedSubject.faculty?._id || assignedSubject.faculty || "") ===
        String(faculty._id);

    if (!isAssigned) {
      if (!Array.isArray(assignedSubject.faculty)) {
        assignedSubject.faculty = assignedSubject.faculty
          ? [assignedSubject.faculty]
          : [];
      }
      assignedSubject.faculty.push(faculty._id);
      await assignedSubject.save();
    }

    if (
      published !== undefined &&
      typeof published !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "Published must be true or false.",
      });
    }

    // Validate and update marks when provided
    const nextObtained =
      marksObtained === undefined
        ? result.marksObtained
        : marksObtained;

    const nextTotal =
      totalMarks === undefined
        ? result.totalMarks
        : totalMarks;

    if (
      marksObtained !== undefined ||
      totalMarks !== undefined
    ) {
      const marksError = validateMarks(nextObtained, nextTotal);

      if (marksError) {
        return res.status(400).json({
          success: false,
          message: marksError,
        });
      }

      result.marksObtained = Number(nextObtained);
      result.totalMarks = Number(nextTotal);

      const calculated = calculateGrade(
        result.marksObtained,
        result.totalMarks
      );

      // Grade is calculated by the server, not trusted from the client
      result.grade = calculated.grade;
      result.gradePoint = calculated.gradePoint;
    }

    if (published !== undefined) {
      result.published = published;
    }

    await result.save();

    const populatedResult = await Result.findById(result._id)
      .populate({
        path: "student",
        select: "studentId rollNumber semester section user",
        populate: {
          path: "user",
          select: "name email",
        },
      })
      .populate("subject", "name code semester");

    return res.status(200).json({
      success: true,
      message: "Result updated successfully.",
      result: populatedResult,
    });
  } catch (error) {
    console.error("Update result error:", error);

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update result.",
    });
  }
};

module.exports = {
  createResult,
  getResults,
  updateResult,
};
