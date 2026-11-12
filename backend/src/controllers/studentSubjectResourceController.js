const mongoose = require("mongoose");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Note = require("../models/Note");
const QuestionPaper = require("../models/QuestionPaper");

const getStudentSubjectResources = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.subjectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID.",
      });
    }

    const student = await Student.findOne({
      user: req.user._id,
      status: "active",
    }).select("subjects");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Active student profile not found.",
      });
    }

    const hasSubjectAccess = (student.subjects || []).some(
      (subjectId) => String(subjectId) === req.params.subjectId
    );
    if (!hasSubjectAccess) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this subject.",
      });
    }

    const subject = await Subject.findOne({
      _id: req.params.subjectId,
      isActive: true,
    }).populate({
      path: "faculty",
      select: "employeeId user",
      populate: { path: "user", select: "name" },
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found in your department.",
      });
    }

    const [notes, questionPapers] = await Promise.all([
      Note.find({
        subject: subject._id,
        semester: subject.semester,
        status: "active",
      })
        .populate("faculty", "facultyId employeeId")
        .sort({ createdAt: -1 }),
      QuestionPaper.find({ subject: subject._id })
        .populate("exam", "title examType date")
        .sort({ createdAt: -1 }),
    ]);

    return res.status(200).json({
      success: true,
      subject,
      resources: {
        notes,
        questionPapers,
      },
    });
  } catch (error) {
    console.error("Student subject resources error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch subject resources.",
    });
  }
};

module.exports = { getStudentSubjectResources };
