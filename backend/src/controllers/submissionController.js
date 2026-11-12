
const mongoose = require("mongoose");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");

// Get the logged-in faculty profile
const getFaculty = async (userId) => {
  return Faculty.findOne({
    user: userId,
    status: "active",
  });
};

// Get the logged-in student's profile
const getStudent = async (userId) => {
  return Student.findOne({
    user: userId,
    status: "active",
  });
};

// ASSIGNMENT ANALYSIS SUMMARY
// GET /api/submissions/faculty/analytics
const getAssignmentAnalytics = async (req, res) => {
  try {
    const faculty = await getFaculty(req.user._id);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty profile not found",
      });
    }

    const assignments = await Assignment.find({
      faculty: faculty._id,
    })
      .populate("subject", "name code")
      .sort({ createdAt: -1 });

    const analytics = await Promise.all(
      assignments.map(async (assignment) => {
        const submissions = await Submission.find({
          assignment: assignment._id,
        });

        const submittedCount = submissions.length;

        const eligibleStudents = await Student.countDocuments({
          status: "active",
          semester: assignment.semester,
          subjects: assignment.subject?._id || assignment.subject,
        });

        const pendingCount = Math.max(
          eligibleStudents - submittedCount,
          0
        );

        const lateCount = submissions.filter(
          (item) => item.status === "late"
        ).length;

        const gradedCount = submissions.filter(
          (item) => item.status === "graded"
        ).length;

        const submissionRate = eligibleStudents
          ? Math.round(
              (submittedCount / eligibleStudents) * 100
            )
          : 0;

        return {
          assignmentId: assignment._id,
          title: assignment.title,
          subject: assignment.subject?.name || "Unknown",
          subjectCode: assignment.subject?.code || "",
          semester: assignment.semester,
          dueDate: assignment.dueDate,
          totalMarks: assignment.totalMarks,
          status: assignment.status,
          eligibleStudents,
          submittedCount,
          pendingCount,
          lateCount,
          gradedCount,
          submissionRate,
        };
      })
    );

    const totals = analytics.reduce(
      (result, item) => {
        result.assignments += 1;
        result.submitted += item.submittedCount;
        result.pending += item.pendingCount;
        result.late += item.lateCount;
        result.graded += item.gradedCount;
        return result;
      },
      {
        assignments: 0,
        submitted: 0,
        pending: 0,
        late: 0,
        graded: 0,
      }
    );

    res.status(200).json({
      success: true,
      totals,
      assignments: analytics,
    });
  } catch (error) {
    console.error("Assignment analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load assignment analytics",
    });
  }
};

// RECENT STUDENT SUBMISSIONS
// GET /api/submissions/faculty/recent
const getRecentSubmissions = async (req, res) => {
  try {
    const faculty = await getFaculty(req.user._id);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty profile not found",
      });
    }

    const assignmentIds = await Assignment.find({
      faculty: faculty._id,
    }).distinct("_id");

    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      50
    );

    const submissions = await Submission.find({
      assignment: { $in: assignmentIds },
    })
      .populate({
        path: "student",
        select: "studentId rollNumber semester section user",
        populate: {
          path: "user",
          select: "name email",
        },
      })
      .populate({
        path: "assignment",
        select: "title dueDate totalMarks subject",
        populate: {
          path: "subject",
          select: "name code",
        },
      })
      .sort({ submittedAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error("Recent submissions error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load recent submissions",
    });
  }
};

// STUDENT SUBMITS AN ASSIGNMENT
// POST /api/submissions/:assignmentId


const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { answer = "", fileUrl = "" } = req.body;

    if (!mongoose.isValidObjectId(assignmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    // Use the uploaded file path when a PDF is provided.
    const uploadedFileUrl = req.file
      ? `/uploads/submissions/${req.file.filename}`
      : String(fileUrl).trim();

    const normalizedAnswer = String(answer).trim();

    if (!normalizedAnswer && !uploadedFileUrl) {
      return res.status(400).json({
        success: false,
        message: "Provide an answer or upload a PDF file.",
      });
    }

    const student = await getStudent(req.user._id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      status: "active",
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Active assignment not found",
      });
    }

    if (
      Number(student.semester) !== Number(assignment.semester)
    ) {
      return res.status(403).json({
        success: false,
        message: "Assignment is not available for your semester",
      });
    }

    const hasSubjectAccess = (student.subjects || []).some(
      (subjectId) =>
        String(subjectId) === String(assignment.subject)
    );

    if (!hasSubjectAccess) {
      return res.status(403).json({
        success: false,
        message:
          "You are not assigned to this assignment's subject",
      });
    }

    const now = new Date();
    const status =
      now > new Date(assignment.dueDate)
        ? "late"
        : "submitted";

    const existingSubmission = await Submission.findOne({
      assignment: assignment._id,
      student: student._id,
    });

    if (
      existingSubmission &&
      ["accepted", "graded"].includes(existingSubmission.status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This assignment has already been evaluated and cannot be resubmitted.",
      });
    }

    const submission = await Submission.findOneAndUpdate(
      {
        assignment: assignment._id,
        student: student._id,
      },
      {
        $set: {
          answer: normalizedAnswer,
          fileUrl: uploadedFileUrl,
          submittedAt: now,
          status,
        },
        $setOnInsert: {
          marks: null,
          feedback: "",
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Assignment submitted successfully",
      submission,
    });
  } catch (error) {
    console.error("Submit assignment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit assignment",
    });
  }
};



// FACULTY EVALUATES A STUDENT SUBMISSION
// PATCH /api/submissions/:submissionId/evaluate
const evaluateSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { status, marks, feedback = "" } = req.body;

    if (!mongoose.isValidObjectId(submissionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid submission ID",
      });
    }

    if (!["accepted", "rejected", "graded"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be accepted, rejected, or graded",
      });
    }

    const faculty = await getFaculty(req.user._id);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty profile not found",
      });
    }

    const submission = await Submission.findById(submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    const assignment = await Assignment.findOne({
      _id: submission.assignment,
      faculty: faculty._id,
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: "You cannot evaluate this submission",
      });
    }

    if (status === "rejected" && !String(feedback).trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a reason for rejection",
      });
    }

    const updates = {
      status,
      feedback: String(feedback).trim(),
    };

    if (marks !== undefined && marks !== null && marks !== "") {
      const numericMarks = Number(marks);

      if (
        !Number.isFinite(numericMarks) ||
        numericMarks < 0 ||
        numericMarks > assignment.totalMarks
      ) {
        return res.status(400).json({
          success: false,
          message: `Marks must be between 0 and ${assignment.totalMarks}`,
        });
      }

      updates.marks = numericMarks;
    } else if (status === "graded") {
      return res.status(400).json({
        success: false,
        message: "Marks are required to finalize grading",
      });
    }

    submission.set(updates);
    await submission.save();

    return res.status(200).json({
      success: true,
      message: `Submission ${status} successfully`,
      submission,
    });
  } catch (error) {
    console.error("Evaluate submission error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to evaluate submission",
    });
  }
};

// FACULTY DELETES A SUBMISSION RECORD
// DELETE /api/submissions/:submissionId
const deleteSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;

    if (!mongoose.isValidObjectId(submissionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid submission ID",
      });
    }

    const faculty = await getFaculty(req.user._id);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty profile not found",
      });
    }

    const submission = await Submission.findById(submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    const assignment = await Assignment.findOne({
      _id: submission.assignment,
      faculty: faculty._id,
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete this submission",
      });
    }

    await Submission.deleteOne({ _id: submission._id });

    return res.status(200).json({
      success: true,
      message: "Submission record deleted successfully",
    });
  } catch (error) {
    console.error("Delete submission error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete submission",
    });
  }
};

module.exports = {
  getAssignmentAnalytics,
  getRecentSubmissions,
  submitAssignment,
  evaluateSubmission,
  deleteSubmission,
};
