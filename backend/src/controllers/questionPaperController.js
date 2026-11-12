
const mongoose = require("mongoose");
const QuestionPaper = require("../models/QuestionPaper");
const Exam = require("../models/Exam");
const Faculty = require("../models/Faculty");
const Subject = require("../models/Subject");

const uploadQuestionPaper = async (req, res) => {
  try {
    const { title, exam: examId } = req.body;

    if (!title?.trim() || !examId || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Title, exam, and PDF file are required.",
      });
    }

    if (!mongoose.isValidObjectId(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID.",
      });
    }

    const faculty = await Faculty.findOne({
      user: req.user._id,
      status: "active",
    });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Active faculty profile not found.",
      });
    }

    const exam = await Exam.findById(examId).populate("subject");

    if (!exam || !exam.subject) {
      return res.status(404).json({
        success: false,
        message: "Exam or its subject was not found.",
      });
    }

    const subject = await Subject.findOne({
      _id: exam.subject._id,
      faculty: faculty._id,
      isActive: true,
    });

    if (!subject) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to upload for this exam.",
      });
    }

    const questionPaper = await QuestionPaper.create({
      title: title.trim(),
      exam: exam._id,
      subject: subject._id,
      semester: exam.semester,
      fileUrl: `/uploads/question-papers/${req.file.filename}`,
      fileName: req.file.originalname,
      uploadedBy: faculty._id,
    });

    return res.status(201).json({
      success: true,
      message: "Question paper uploaded successfully.",
      questionPaper,
    });
  } catch (error) {
    console.error("Upload question paper error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload question paper.",
    });
  }
};

const getQuestionPapers = async (req, res) => {
  try {
    const faculty = await Faculty.findOne({
      user: req.user._id,
      status: "active",
    });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Active faculty profile not found.",
      });
    }

    const subjects = await Subject.find({
      faculty: faculty._id,
      isActive: true,
    }).select("_id");

    const subjectIds = subjects.map((subject) => subject._id);

    const questionPapers = await QuestionPaper.find({
      subject: { $in: subjectIds },
    })
      .populate("exam", "title examType date startTime endTime room")
      .populate("subject", "name code semester")
      .populate("uploadedBy", "user");

    return res.status(200).json({
      success: true,
      count: questionPapers.length,
      questionPapers,
    });
  } catch (error) {
    console.error("Get question papers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch question papers.",
    });
  }
};

module.exports = {
  uploadQuestionPaper,
  getQuestionPapers,
};
