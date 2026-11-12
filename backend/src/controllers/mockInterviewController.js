const mongoose = require("mongoose");
const MockInterviewAttempt = require("../models/MockInterviewAttempt");
const Placement = require("../models/Placement");
const { analyzeInterview } = require("../services/mockInterviewAnalyzer");

/**
 * Evaluates an interview transcript, calculates evidence-based scores,
 * generates skill gap analysis & 7-day roadmap, and saves the attempt.
 */
const evaluateInterview = async (req, res) => {
  try {
    const studentId = req.user?._id;
    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to evaluate interview.",
      });
    }

    const {
      jobId,
      jobTitle = "Software Developer",
      company = "Placement Opportunity",
      skills = [],
      questionsAndAnswers = [],
    } = req.body;

    if (!Array.isArray(questionsAndAnswers) || questionsAndAnswers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No interview questions and answers provided for evaluation.",
      });
    }

    // Verify placement job exists if jobId is provided
    let verifiedJobId = null;
    let targetJobTitle = jobTitle;
    let targetCompany = company;
    let targetSkills = Array.isArray(skills) ? [...skills] : [];

    if (jobId && mongoose.Types.ObjectId.isValid(jobId)) {
      const placement = await Placement.findById(jobId).lean();
      if (placement) {
        verifiedJobId = placement._id;
        targetJobTitle = placement.title || targetJobTitle;
        targetCompany = placement.company || targetCompany;
        if (Array.isArray(placement.requirements) && placement.requirements.length > 0) {
          targetSkills = [...new Set([...targetSkills, ...placement.requirements])];
        }
        if (Array.isArray(placement.skills) && placement.skills.length > 0) {
          targetSkills = [...new Set([...targetSkills, ...placement.skills])];
        }
      }
    }

    // Run deep analysis
    const analysis = analyzeInterview({
      jobTitle: targetJobTitle,
      skills: targetSkills,
      questionsAndAnswers,
    });

    // Save record to database
    const attempt = await MockInterviewAttempt.create({
      student: studentId,
      jobId: verifiedJobId,
      jobTitle: targetJobTitle,
      company: targetCompany,
      overallScore: analysis.overallScore,
      categories: analysis.categories,
      feedback: analysis.feedback,
      skillGaps: analysis.skillGaps,
      learningRoadmap: analysis.learningRoadmap,
      recommendedPriorities: analysis.recommendedPriorities,
      questionsAndAnswers: analysis.questionsAndAnswers,
    });

    return res.status(201).json({
      success: true,
      message: "Mock interview evaluated and saved successfully.",
      attemptId: attempt._id,
      report: attempt,
    });
  } catch (error) {
    console.error("[MockInterview] Error evaluating interview:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to evaluate interview. Please try again.",
      error: error.message,
    });
  }
};

/**
 * Returns the student's mock interview history for progress tracking.
 */
const getInterviewHistory = async (req, res) => {
  try {
    const studentId = req.user?._id;
    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const attempts = await MockInterviewAttempt.find({ student: studentId })
      .select("jobTitle company overallScore categories submittedAt createdAt")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({
      success: true,
      attempts: attempts.map((att, idx, arr) => {
        // Calculate progress trend compared to older attempts
        const older = arr[idx + 1];
        const diff = older ? att.overallScore - older.overallScore : null;
        return {
          _id: att._id,
          jobTitle: att.jobTitle,
          company: att.company,
          overallScore: att.overallScore,
          technicalScore: att.categories?.technical?.score ?? 0,
          communicationScore: att.categories?.communication?.score ?? 0,
          problemSolvingScore: att.categories?.problemSolving?.score ?? 0,
          submittedAt: att.submittedAt || att.createdAt,
          diff,
        };
      }),
    });
  } catch (error) {
    console.error("[MockInterview] Error fetching interview history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load interview history.",
    });
  }
};

/**
 * Returns a specific interview attempt by ID.
 */
const getInterviewAttempt = async (req, res) => {
  try {
    const studentId = req.user?._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview attempt ID.",
      });
    }

    const attempt = await MockInterviewAttempt.findOne({
      _id: id,
      student: studentId,
    }).lean();

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Interview attempt not found.",
      });
    }

    return res.status(200).json({
      success: true,
      report: attempt,
    });
  } catch (error) {
    console.error("[MockInterview] Error fetching attempt:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve interview attempt.",
    });
  }
};

module.exports = {
  evaluateInterview,
  getInterviewHistory,
  getInterviewAttempt,
};
