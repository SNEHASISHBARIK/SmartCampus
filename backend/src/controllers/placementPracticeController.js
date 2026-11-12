const mongoose = require("mongoose");

const Placement = require("../models/Placement");
const PlacementPracticeAttempt = require("../models/PlacementPracticeAttempt");
const {
  generatePlacementQuestions,
} = require("../services/placementQuestionGenerator");

// Create a practice test
const createPracticeTest = async (req, res) => {
  try {
    const { jobId, jobRole, difficulty = "medium" } = req.body;

    let targetJobRole = typeof jobRole === "string" ? jobRole.trim() : "";
    let targetJobId = null;

    if (jobId) {
      if (!mongoose.Types.ObjectId.isValid(jobId)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid job ID.",
        });
      }

      const placement = await Placement.findById(jobId).lean();

      if (!placement) {
        return res.status(404).json({
          success: false,
          message: "Selected placement job was not found.",
        });
      }

      targetJobId = placement._id;
      targetJobRole = placement.title?.trim() || "Software Developer";
    }

    if (!targetJobRole) {
      return res.status(400).json({
        success: false,
        message: "Please select a placement job or provide a target role.",
      });
    }

    const allowedDifficulties = ["easy", "medium", "hard"];

    if (!allowedDifficulties.includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: "Difficulty must be easy, medium, or hard.",
      });
    }

    // Limit role name length for AI service validation
    const cleanJobRole = targetJobRole.slice(0, 100);

    const generated = await generatePlacementQuestions({
      jobRole: cleanJobRole,
      difficulty,
    });

    // Keep the answer key in MongoDB, not in the response sent to students.
    const questions = generated.sections.flatMap((section) =>
      section.questions.map((question, index) => ({
        questionId: `${section.section}-${index + 1}`,
        section: section.section,
        question: question.question,
        options: question.options,
        correctAnswer: question.correct_answer,
        explanation: question.explanation,
        topic: question.topic,
      }))
    );

    if (questions.length !== 60) {
      return res.status(502).json({
        success: false,
        message: "The AI did not generate exactly 60 questions. Please try again.",
      });
    }

    const attempt = await PlacementPracticeAttempt.create({
      student: req.user._id,
      jobId: targetJobId,
      jobRole: cleanJobRole,
      difficulty,
      questions,
      answers: [],
      score: 0,
      status: "in_progress",
    });

    // Never return the correct answer or explanation before submission.
    const safeQuestions = questions.map(
      ({ correctAnswer, explanation, ...question }) => question
    );

    return res.status(201).json({
      success: true,
      message: "Placement practice test generated successfully.",
      attemptId: attempt._id,
      jobId: attempt.jobId,
      jobRole: attempt.jobRole,
      difficulty: attempt.difficulty,
      totalQuestions: safeQuestions.length,
      sections: [
        {
          section: "aptitude",
          questions: safeQuestions.filter(
            (question) => question.section === "aptitude"
          ),
        },
        {
          section: "logical_reasoning",
          questions: safeQuestions.filter(
            (question) => question.section === "logical_reasoning"
          ),
        },
        {
          section: "programming",
          questions: safeQuestions.filter(
            (question) => question.section === "programming"
          ),
        },
      ],
    });
  } catch (error) {
    console.error("Create placement practice test error:", error.message);

    return res.status(502).json({
      success: false,
      message: "Unable to generate a practice test right now. Please try again.",
    });
  }
};

// Submit answers and calculate score on the server
const submitPracticeTest = async (req, res) => {
  try {
    const { attemptId, answers } = req.body;

    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(400).json({
        success: false,
        message: "A valid attemptId is required.",
      });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: "Answers must be provided as an array.",
      });
    }

    const attempt = await PlacementPracticeAttempt.findOne({
      _id: attemptId,
      student: req.user._id,
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Practice attempt not found.",
      });
    }

    if (attempt.status === "completed") {
      return res.status(409).json({
        success: false,
        message: "This practice test has already been submitted.",
      });
    }

    if (answers.length !== attempt.questions.length) {
      return res.status(400).json({
        success: false,
        message: `Submit exactly ${attempt.questions.length} answers.`,
      });
    }

    const answerMap = new Map();

    for (const answer of answers) {
      if (
        !answer ||
        typeof answer.questionId !== "string" ||
        (answer.selectedAnswer !== null && typeof answer.selectedAnswer !== "string") ||
        answerMap.has(answer.questionId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Each answer must have a unique questionId and a valid answer or null.",
        });
      }

      answerMap.set(answer.questionId, answer.selectedAnswer);
    }

    const validQuestionIds = new Set(
      attempt.questions.map((question) => question.questionId)
    );

    if (
      answerMap.size !== validQuestionIds.size ||
      [...answerMap.keys()].some((id) => !validQuestionIds.has(id))
    ) {
      return res.status(400).json({
        success: false,
        message: "Answers do not match the questions in this attempt.",
      });
    }

    let score = 0;
    const sectionStats = {};

    for (const question of attempt.questions) {
      const selectedAnswer = answerMap.get(question.questionId);
      const isCorrect = selectedAnswer === question.correctAnswer;

      if (isCorrect) score += 1;

      if (!sectionStats[question.section]) {
        sectionStats[question.section] = {
          correct: 0,
          total: 0,
        };
      }

      sectionStats[question.section].total += 1;

      if (isCorrect) {
        sectionStats[question.section].correct += 1;
      }
    }

    const topicStats = {};

    const reviewedQuestions = attempt.questions.map((question) => {
      const selectedAnswer = answerMap.get(question.questionId);
      const isCorrect = selectedAnswer === question.correctAnswer;

      if (!topicStats[question.topic]) {
        topicStats[question.topic] = {
          correct: 0,
          total: 0,
        };
      }

      topicStats[question.topic].total += 1;

      if (isCorrect) {
        topicStats[question.topic].correct += 1;
      }

      return {
        questionId: question.questionId,
        section: question.section,
        question: question.question,
        options: question.options,
        selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
        topic: question.topic,
      };
    });

    const weakAreas = Object.entries(topicStats)
      .filter(([, stats]) => stats.correct / stats.total < 0.6)
      .map(([topic, stats]) => ({
        topic,
        correct: stats.correct,
        total: stats.total,
        recommendation: `Practise more questions about ${topic}.`,
      }));

    attempt.answers = answers;
    attempt.score = score;
    attempt.status = "completed";
    attempt.submittedAt = new Date();

    await attempt.save();

    return res.status(200).json({
      success: true,
      message: "Practice test evaluated successfully.",
      result: {
        attemptId: attempt._id,
        jobId: attempt.jobId,
        jobRole: attempt.jobRole,
        difficulty: attempt.difficulty,
        score,
        totalQuestions: attempt.questions.length,
        percentage: Math.round(
          (score / attempt.questions.length) * 100
        ),
        sectionStats,
        weakAreas,
        questions: reviewedQuestions,
      },
    });
  } catch (error) {
    console.error("Submit placement practice test error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to evaluate the practice test.",
    });
  }
};

module.exports = {
  createPracticeTest,
  submitPracticeTest,
};
