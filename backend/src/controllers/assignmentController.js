const Assignment = require("../models/Assignment");
const Faculty = require("../models/Faculty");
const Subject = require("../models/Subject");
const mongoose = require("mongoose");

// CREATE ASSIGNMENT
const createAssignment = async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      semester,
      dueDate,
      totalMarks,
      attachmentUrl,
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      !subject ||
      !semester ||
      !dueDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "title, description, subject, semester and dueDate are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(subject)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID.",
      });
    }

    const semesterNumber = Number(semester);
    if (!Number.isInteger(semesterNumber) || semesterNumber < 1 || semesterNumber > 8) {
      return res.status(400).json({
        success: false,
        message: "Semester must be a number from 1 to 8.",
      });
    }

    const dueDateValue = new Date(dueDate);
    if (Number.isNaN(dueDateValue.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid due date.",
      });
    }

    const marks = totalMarks === undefined ? 100 : Number(totalMarks);
    if (!Number.isFinite(marks) || marks < 1) {
      return res.status(400).json({
        success: false,
        message: "Total marks must be at least 1.",
      });
    }

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

    const subjectData = await Subject.findOne({
      _id: subject,
      isActive: true,
    });

    if (!subjectData) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // Ensure faculty is linked to subject so it reflects in assigned lists
    const assignedFaculty = Array.isArray(subjectData.faculty)
      ? subjectData.faculty.some(
          (assignedId) =>
            String(assignedId?._id || assignedId) === String(faculty._id)
        )
      : String(subjectData.faculty?._id || subjectData.faculty || "") ===
        String(faculty._id);

    if (!assignedFaculty) {
      if (!Array.isArray(subjectData.faculty)) {
        subjectData.faculty = subjectData.faculty ? [subjectData.faculty] : [];
      }
      subjectData.faculty.push(faculty._id);
      await subjectData.save();
    }

    if (
      subjectData.semester !== undefined &&
      subjectData.semester !== null &&
      subjectData.semester !== semesterNumber
    ) {
      return res.status(400).json({
        success: false,
        message: "Assignment semester must match the selected subject semester.",
      });
    }

    const assignment = await Assignment.create({
      title: title.trim(),
      description: description.trim(),
      subject: subjectData._id,
      faculty: faculty._id,
      semester: semesterNumber,
      dueDate: dueDateValue,
      totalMarks: marks,
      attachmentUrl: String(attachmentUrl || "").trim(),
      status: "active",
    });

    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate("subject", "name code semester department")
      .populate("faculty", "facultyId employeeId");

    res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      assignment: populatedAssignment,
    });
  } catch (error) {
    console.error("Create assignment error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating assignment",
    });
  }
};


// GET FACULTY ASSIGNMENTS
const getAssignments = async (req, res) => {
  try {
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

    const filter = { faculty: faculty._id };
    if (req.query.subject && mongoose.Types.ObjectId.isValid(req.query.subject)) {
      filter.subject = req.query.subject;
    }

    const assignments = await Assignment.find(filter)
      .populate("subject", "name code semester department")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error("Get assignments error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching assignments",
    });
  }
};


// UPDATE ASSIGNMENT
const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      dueDate,
      totalMarks,
      attachmentUrl,
      status,
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

    const assignment = await Assignment.findOne({
      _id: id,
      faculty: faculty._id,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    if (title !== undefined) assignment.title = title;
    if (description !== undefined) assignment.description = description;
    if (dueDate !== undefined) assignment.dueDate = dueDate;
    if (totalMarks !== undefined) assignment.totalMarks = totalMarks;
    if (attachmentUrl !== undefined)
      assignment.attachmentUrl = attachmentUrl;
    if (status !== undefined) assignment.status = status;

    await assignment.save();

    const updatedAssignment = await Assignment.findById(
      assignment._id
    )
      .populate("subject", "name code")
      .populate("faculty", "facultyId employeeId");

    res.status(200).json({
      success: true,
      message: "Assignment updated successfully",
      assignment: updatedAssignment,
    });
  } catch (error) {
    console.error("Update assignment error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating assignment",
    });
  }
};


// DELETE ASSIGNMENT
const deleteAssignment = async (req, res) => {
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

    const assignment = await Assignment.findOne({
      _id: id,
      faculty: faculty._id,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    await Assignment.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    console.error("Delete assignment error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deleting assignment",
    });
  }
};


module.exports = {
  createAssignment,
  getAssignments,
  updateAssignment,
  deleteAssignment,
};