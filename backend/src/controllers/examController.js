const mongoose = require("mongoose");
const Exam = require("../models/Exam");
const Faculty = require("../models/Faculty");
const Subject = require("../models/Subject");

const validateExamData = ({
  title,
  subject,
  semester,
  examType,
  date,
  startTime,
  endTime,
  totalMarks,
}) => {
  if (
    typeof title !== "string" ||
    !title.trim() ||
    !subject ||
    semester === undefined ||
    semester === null ||
    semester === "" ||
    !examType ||
    !date ||
    !startTime ||
    !endTime ||
    totalMarks === undefined ||
    totalMarks === null ||
    totalMarks === ""
  ) {
    return "Please provide all required exam fields.";
  }

  if (!mongoose.isValidObjectId(subject)) {
    return "Invalid subject ID.";
  }

  const semesterNumber = Number(semester);

  if (
    !Number.isInteger(semesterNumber) ||
    semesterNumber < 1 ||
    semesterNumber > 8
  ) {
    return "Semester must be a whole number between 1 and 8.";
  }

  const allowedTypes = [
    "internal",
    "midterm",
    "end-semester",
    "practical",
  ];

  if (!allowedTypes.includes(examType)) {
    return "Invalid exam type.";
  }

  const marks = Number(totalMarks);

  if (!Number.isFinite(marks) || marks < 1) {
    return "Total marks must be a number greater than zero.";
  }

  if (typeof startTime !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
    return "Start time must use HH:mm format.";
  }

  if (typeof endTime !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(endTime)) {
    return "End time must use HH:mm format.";
  }

  if (endTime <= startTime) {
    return "End time must be later than start time.";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Please provide a valid exam date.";
  }

  return null;
};

// CREATE EXAM
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
    } = req.body;

    const validationError = validateExamData(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const faculty = await Faculty.findOne({
      user: req.user._id,
      status: "active",
    }).populate("department", "name code");

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty profile not found",
      });
    }

    const subjectData = await Subject.findOne({
      _id: subject,
      isActive: true,
    }).populate("department", "name code");

    if (!subjectData) {
      return res.status(404).json({
        success: false,
        message: "Subject not found or is inactive",
      });
    }

    if (Number(subjectData.semester) !== Number(semester)) {
      return res.status(400).json({
        success: false,
        message: "Exam semester must match the selected subject semester.",
      });
    }

    // Check if faculty is already linked to this subject
    const isAssigned = (subjectData.faculty || []).some(
      (facultyId) => String(facultyId?._id || facultyId) === String(faculty._id)
    );

    // Auto-link faculty to subject if creating an exam for it
    if (!isAssigned) {
      if (!Array.isArray(subjectData.faculty)) {
        subjectData.faculty = [];
      }
      subjectData.faculty.push(faculty._id);
      await subjectData.save();
    }

    // Auto-generate examId if not provided
    let examId = req.body.examId;
    if (!examId) {
      const count = await Exam.countDocuments();
      const year = new Date().getFullYear();
      examId = `EXAM-${year}-${String(count + 1).padStart(4, "0")}`;
    }

    const exam = await Exam.create({
      examId,
      title: title.trim(),
      subject: subjectData._id,
      semester: Number(semester),
      examType,
      date,
      startTime,
      endTime,
      room: room ? room.trim() : "",
      totalMarks: Number(totalMarks),
      instructions: instructions ? instructions.trim() : "",
    });

    const populatedExam = await Exam.findById(exam._id)
      .populate("subject", "name code semester credits department");

    res.status(201).json({
      success: true,
      message: "Exam created successfully",
      exam: populatedExam,
    });
  } catch (error) {
    console.error("Create exam error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating exam",
    });
  }
};


// GET FACULTY EXAMS
const getExams = async (req, res) => {
  try {
    const faculty = await Faculty.findOne({
      user: req.user._id,
      status: "active",
    }).populate("department", "name code");

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Active faculty profile not found.",
      });
    }

    const { subject, examType, status } = req.query;

    const filter = {};

    if (subject && subject !== "all") {
      if (!mongoose.isValidObjectId(subject)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subject ID",
        });
      }
      filter.subject = subject;
    }

    if (examType && examType !== "all") {
      filter.examType = examType;
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    const exams = await Exam.find(filter)
      .populate({
        path: "subject",
        select: "name code semester credits department faculty",
        populate: { path: "department", select: "name code" },
      })
      .sort({ date: 1, startTime: 1 });

    const facultyDeptId = String(faculty.department?._id || faculty.department || "");

    const formattedExams = exams.map((exam) => {
      const examObj = exam.toObject();
      const sub = examObj.subject;
      const isAssigned = (sub?.faculty || []).some(
        (f) => String(f?._id || f) === String(faculty._id)
      );
      const subDeptId = String(sub?.department?._id || sub?.department || "");
      const isSameDept = Boolean(facultyDeptId && subDeptId && facultyDeptId === subDeptId);

      return {
        ...examObj,
        isAssigned: Boolean(isAssigned),
        isDepartment: isSameDept,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedExams.length,
      exams: formattedExams,
    });
  } catch (error) {
    console.error("Get exams error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch exams.",
    });
  }
};



// UPDATE EXAM
const updateExam = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      semester,
      examType,
      date,
      startTime,
      endTime,
      room,
      totalMarks,
      instructions,
    } = req.body;

    const faculty = await Faculty.findOne({
      user: req.user._id,
      status: "active",
    });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty profile not found",
      });
    }

    const exam = await Exam.findById(id).populate("subject");

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    const mergedExamData = {
      title: req.body.title ?? exam.title,
      subject: req.body.subject ?? exam.subject?._id ?? exam.subject,
      semester: req.body.semester ?? exam.semester,
      examType: req.body.examType ?? exam.examType,
      date: req.body.date ?? exam.date,
      startTime: req.body.startTime ?? exam.startTime,
      endTime: req.body.endTime ?? exam.endTime,
      totalMarks: req.body.totalMarks ?? exam.totalMarks,
    };

    const validationError = validateExamData(mergedExamData);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const selectedSubject = await Subject.findOne({
      _id: mergedExamData.subject,
      isActive: true,
    });

    if (!selectedSubject) {
      return res.status(404).json({
        success: false,
        message: "Selected subject not found or is inactive",
      });
    }

    if (Number(selectedSubject.semester) !== Number(mergedExamData.semester)) {
      return res.status(400).json({
        success: false,
        message: "Exam semester must match the selected subject semester.",
      });
    }

    // Link faculty to subject if not already linked
    const isAssigned = (selectedSubject.faculty || []).some(
      (facultyId) => String(facultyId?._id || facultyId) === String(faculty._id)
    );

    if (!isAssigned) {
      if (!Array.isArray(selectedSubject.faculty)) {
        selectedSubject.faculty = [];
      }
      selectedSubject.faculty.push(faculty._id);
      await selectedSubject.save();
    }

    exam.subject = selectedSubject._id;

    if (title !== undefined) exam.title = title;
    if (semester !== undefined) exam.semester = Number(semester);
    if (examType !== undefined) exam.examType = examType;
    if (date !== undefined) exam.date = date;
    if (startTime !== undefined) exam.startTime = startTime;
    if (endTime !== undefined) exam.endTime = endTime;
    if (room !== undefined) exam.room = room;
    if (totalMarks !== undefined) exam.totalMarks = Number(totalMarks);
    if (instructions !== undefined) exam.instructions = instructions;

    await exam.save();

    const updatedExam = await Exam.findById(exam._id)
      .populate("subject", "name code semester credits department");

    res.status(200).json({
      success: true,
      message: "Exam updated successfully",
      exam: updatedExam,
    });
  } catch (error) {
    console.error("Update exam error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating exam",
    });
  }
};


// DELETE EXAM
const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;

    const faculty = await Faculty.findOne({
      user: req.user._id,
      status: "active",
    });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty profile not found",
      });
    }

    const exam = await Exam.findById(id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    await Exam.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Exam deleted successfully",
    });
  } catch (error) {
    console.error("Delete exam error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deleting exam",
    });
  }
};


module.exports = {
  createExam,
  getExams,
  updateExam,
  deleteExam,
};
