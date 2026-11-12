const mongoose = require("mongoose");
const Subject = require("../models/Subject");
const Exam = require("../models/Exam");

// ==========================================
// HELPER: RESOLVE SUBJECT
// ==========================================

const resolveSubject = async (value) => {
  if (!value) return null;

  // If ObjectId
  if (mongoose.Types.ObjectId.isValid(value)) {
    const subject = await Subject.findById(value);

    if (subject) {
      return subject;
    }
  }

  // Find by subject name
  const escapedValue = String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const byName = await Subject.findOne({
    name: {
      $regex: `^${escapedValue}$`,
      $options: "i",
    },
  });

  if (byName) {
    return byName;
  }

  // Find by subject code
  const byCode = await Subject.findOne({
    code: String(value).toUpperCase(),
  });

  return byCode;
};

// ==========================================
// HELPER: FORMAT EXAM
// ==========================================

const formatExam = (exam) => {
  const examObject = exam.toObject();

  const subjectData =
    examObject.subject && typeof examObject.subject === "object"
      ? examObject.subject
      : {};

  let type = "Internal";

  if (examObject.examType === "midterm") {
    type = "Midterm";
  } else if (examObject.examType === "end-semester") {
    type = "End Semester";
  } else if (examObject.examType === "practical") {
    type = "Practical";
  } else if (examObject.examType === "internal") {
    type = "Internal";
  }

  return {
    ...examObject,

    // Frontend-compatible fields
    id: examObject.examId || "",
    code: subjectData.code || "",
    subject: subjectData.name || "",
    type,

    date: examObject.date,

    time:
      examObject.startTime && examObject.endTime
        ? `${examObject.startTime} - ${examObject.endTime}`
        : "",

    status: examObject.status || "Upcoming",
  };
};

// ==========================================
// CREATE EXAM
// ==========================================

const createExam = async (req, res) => {
  try {
    const {
      title,
      subject,
      semester,
      examType,
      date,
      startTime,
      endTime,
      room,
      totalMarks,
      instructions,
      status,
    } = req.body;

    // --------------------------------------
    // REQUIRED FIELDS
    // --------------------------------------

    if (
      !title ||
      !subject ||
      semester === undefined ||
      semester === null ||
      !examType ||
      !date ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required exam fields",
      });
    }

    // --------------------------------------
    // VALIDATE SEMESTER
    // --------------------------------------

    const semesterNumber = Number(semester);

    if (
      Number.isNaN(semesterNumber) ||
      semesterNumber < 1 ||
      semesterNumber > 8
    ) {
      return res.status(400).json({
        success: false,
        message: "Semester must be between 1 and 8",
      });
    }

    // --------------------------------------
    // VALIDATE EXAM TYPE
    // --------------------------------------

    const allowedExamTypes = [
      "internal",
      "midterm",
      "end-semester",
      "practical",
    ];

    if (!allowedExamTypes.includes(examType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam type",
      });
    }

    // --------------------------------------
    // RESOLVE SUBJECT
    // --------------------------------------

    const subjectExists = await resolveSubject(subject);

    if (!subjectExists) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // --------------------------------------
    // VALIDATE TIME
    // --------------------------------------

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: "End time must be later than start time",
      });
    }

    // --------------------------------------
    // VALIDATE STATUS
    // --------------------------------------

    const allowedStatuses = ["Scheduled", "Upcoming"];

    const finalStatus = status || "Upcoming";

    if (!allowedStatuses.includes(finalStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam status",
      });
    }

    // --------------------------------------
    // GENERATE EXAM ID
    // --------------------------------------

    const lastExam = await Exam.findOne({
      examId: {
        $regex: /^EXM\d+$/,
      },
    })
      .sort({
        createdAt: -1,
      })
      .select("examId");

    let nextNumber = 1;

    if (lastExam && lastExam.examId) {
      const number = parseInt(
        lastExam.examId.replace("EXM", ""),
        10
      );

      if (!Number.isNaN(number)) {
        nextNumber = number + 1;
      }
    } else {
      const totalExisting = await Exam.countDocuments();

      nextNumber = totalExisting + 1;
    }

    const examId = `EXM${String(nextNumber).padStart(3, "0")}`;

    // --------------------------------------
    // CREATE EXAM
    // --------------------------------------

    const exam = await Exam.create({
      examId,
      title: title.trim(),
      subject: subjectExists._id,
      semester: semesterNumber,
      examType,
      date,
      startTime,
      endTime,
      room: room ? room.trim() : "",
      totalMarks:
        totalMarks !== undefined && totalMarks !== null
          ? Number(totalMarks)
          : 100,
      instructions: instructions || "",
      status: finalStatus,
    });

    // --------------------------------------
    // POPULATE SUBJECT
    // --------------------------------------

    const populatedExam = await Exam.findById(exam._id).populate(
      "subject",
      "name code credits semester"
    );

    return res.status(201).json({
      success: true,
      message: "Examination created successfully",
      exam: formatExam(populatedExam),
    });
  } catch (error) {
    console.error("Create Exam Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create examination",
    });
  }
};

// ==========================================
// GET ALL EXAMS
// ==========================================

const getExams = async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate(
        "subject",
        "name code credits semester"
      )
      .sort({
        date: 1,
        startTime: 1,
      });

    const formattedExams = exams.map(formatExam);

    return res.status(200).json({
      success: true,

      count: formattedExams.length,

      statistics: {
        total: formattedExams.length,

        scheduled: formattedExams.filter(
          (exam) => exam.status === "Scheduled"
        ).length,

        upcoming: formattedExams.filter(
          (exam) => exam.status === "Upcoming"
        ).length,

        semesters: new Set(
          formattedExams.map(
            (exam) => exam.semester
          )
        ).size,
      },

      exams: formattedExams,
    });
  } catch (error) {
    console.error("Get Exams Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// GET SINGLE EXAM
// ==========================================

const getExam = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await Exam.findById(id).populate(
      "subject",
      "name code credits semester"
    );

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    return res.status(200).json({
      success: true,
      exam: formatExam(exam),
    });
  } catch (error) {
    console.error("Get Exam Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE EXAM
// ==========================================

const updateExam = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      subject,
      semester,
      examType,
      date,
      startTime,
      endTime,
      room,
      totalMarks,
      instructions,
      status,
    } = req.body || {};

    // --------------------------------------
    // FIND EXAM
    // --------------------------------------

    const exam = await Exam.findById(id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // --------------------------------------
    // SUBJECT
    // --------------------------------------

    if (subject !== undefined && subject !== "") {
      const subjectExists = await resolveSubject(subject);

      if (!subjectExists) {
        return res.status(404).json({
          success: false,
          message: "Subject not found",
        });
      }

      exam.subject = subjectExists._id;
    }

    // --------------------------------------
    // TITLE
    // --------------------------------------

    if (title !== undefined) {
      if (!String(title).trim()) {
        return res.status(400).json({
          success: false,
          message: "Title cannot be empty",
        });
      }

      exam.title = String(title).trim();
    }

    // --------------------------------------
    // SEMESTER
    // --------------------------------------

    if (semester !== undefined) {
      const semesterNumber = Number(semester);

      if (
        Number.isNaN(semesterNumber) ||
        semesterNumber < 1 ||
        semesterNumber > 8
      ) {
        return res.status(400).json({
          success: false,
          message: "Semester must be between 1 and 8",
        });
      }

      exam.semester = semesterNumber;
    }

    // --------------------------------------
    // EXAM TYPE
    // --------------------------------------

    if (examType !== undefined) {
      const allowedExamTypes = [
        "internal",
        "midterm",
        "end-semester",
        "practical",
      ];

      if (!allowedExamTypes.includes(examType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid exam type",
        });
      }

      exam.examType = examType;
    }

    // --------------------------------------
    // DATE
    // --------------------------------------

    if (date !== undefined) {
      exam.date = date;
    }

    // --------------------------------------
    // TIME
    // --------------------------------------

    if (startTime !== undefined) {
      exam.startTime = startTime;
    }

    if (endTime !== undefined) {
      exam.endTime = endTime;
    }

    // --------------------------------------
    // TIME VALIDATION
    // --------------------------------------

    if (
      exam.startTime &&
      exam.endTime &&
      exam.startTime >= exam.endTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Start time must be before end time",
      });
    }

    // --------------------------------------
    // ROOM
    // --------------------------------------

    if (room !== undefined) {
      exam.room = String(room).trim();
    }

    // --------------------------------------
    // TOTAL MARKS
    // --------------------------------------

    if (totalMarks !== undefined) {
      const marks = Number(totalMarks);

      if (Number.isNaN(marks) || marks < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid total marks",
        });
      }

      exam.totalMarks = marks;
    }

    // --------------------------------------
    // INSTRUCTIONS
    // --------------------------------------

    if (instructions !== undefined) {
      exam.instructions = instructions;
    }

    // --------------------------------------
    // STATUS
    // --------------------------------------

    if (status !== undefined) {
      const allowedStatuses = [
        "Scheduled",
        "Upcoming",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid exam status",
        });
      }

      exam.status = status;
    }

    // --------------------------------------
    // SAVE
    // --------------------------------------

    await exam.save();

    // --------------------------------------
    // POPULATE UPDATED EXAM
    // --------------------------------------

    const updatedExam = await Exam.findById(
      exam._id
    ).populate(
      "subject",
      "name code credits semester"
    );

    return res.status(200).json({
      success: true,
      message: "Exam updated successfully",
      exam: formatExam(updatedExam),
    });
  } catch (error) {
    console.error("Update Exam Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE EXAM
// ==========================================

const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await Exam.findById(id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    await Exam.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Exam deleted successfully",
    });
  } catch (error) {
    console.error("Delete Exam Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  createExam,
  getExams,
  getExam,
  updateExam,
  deleteExam,
};