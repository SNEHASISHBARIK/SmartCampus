const Subject = require("../models/Subject");
const Department = require("../models/Department");
const Faculty = require("../models/Faculty");

// ===============================
// CREATE SUBJECT
// ===============================
const createSubject = async (req, res) => {
  try {
    const {
      name,
      code,
      department,
      semester,
      credits,
      faculty,
    } = req.body;

    if (!name || !code || !department || !semester || !credits) {
      return res.status(400).json({
        success: false,
        message:
          "Name, code, department, semester and credits are required",
      });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Check department
    const departmentData = await Department.findOne({
      code: department.trim().toUpperCase(),
      isActive: true,
    });

    if (!departmentData) {
      return res.status(404).json({
        success: false,
        message: "Active department not found",
      });
    }

    // Check duplicate subject code
    const existingSubject = await Subject.findOne({
      code: normalizedCode,
    });

    if (existingSubject) {
      return res.status(409).json({
        success: false,
        message: "Subject code already exists",
      });
    }

    // Optional faculty
    let facultyData = null;

    if (faculty) {
      facultyData = await Faculty.findOne({
        _id: faculty,
        status: "active",
      });

      if (!facultyData) {
        return res.status(404).json({
          success: false,
          message: "Active faculty not found",
        });
      }
    }

    const subject = await Subject.create({
      name: name.trim(),
      code: normalizedCode,
      department: departmentData._id,
      semester,
      credits,
      faculty: facultyData ? facultyData._id : null,
      isActive: true,
    });

    const populatedSubject = await Subject.findById(subject._id)
      .populate("department", "name code")
      .populate("faculty", "facultyId employeeId designation");

    return res.status(201).json({
      success: true,
      message: "Subject created successfully",
      subject: populatedSubject,
    });
  } catch (error) {
    console.error("Create Subject Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating subject",
    });
  }
};

// ===============================
// GET ALL SUBJECTS
// ===============================
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find()
      .populate("department", "name code")
      .populate("faculty", "facultyId employeeId designation")
      .sort({ semester: 1, name: 1 });

    return res.status(200).json({
      success: true,
      count: subjects.length,
      subjects,
    });
  } catch (error) {
    console.error("Get Subjects Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching subjects",
    });
  }
};

// ===============================
// GET SINGLE SUBJECT
// ===============================
const getSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate("department", "name code")
      .populate("faculty", "facultyId employeeId designation");

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    return res.status(200).json({
      success: true,
      subject,
    });
  } catch (error) {
    console.error("Get Subject Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching subject",
    });
  }
};

// ===============================
// UPDATE SUBJECT
// ===============================
const updateSubject = async (req, res) => {
  try {
    const {
      name,
      code,
      department,
      semester,
      credits,
      faculty,
      isActive,
    } = req.body;

    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    if (name !== undefined) {
      subject.name = name.trim();
    }

    if (code !== undefined) {
      subject.code = code.trim().toUpperCase();
    }

    if (department !== undefined) {
      const departmentData = await Department.findOne({
        code: department.trim().toUpperCase(),
        isActive: true,
      });

      if (!departmentData) {
        return res.status(404).json({
          success: false,
          message: "Active department not found",
        });
      }

      subject.department = departmentData._id;
    }

    if (semester !== undefined) {
      subject.semester = semester;
    }

    if (credits !== undefined) {
      subject.credits = credits;
    }

    if (faculty !== undefined) {
      if (faculty === null || faculty === "") {
        subject.faculty = null;
      } else {
        const facultyData = await Faculty.findOne({
          _id: faculty,
          status: "active",
        });

        if (!facultyData) {
          return res.status(404).json({
            success: false,
            message: "Active faculty not found",
          });
        }

        subject.faculty = facultyData._id;
      }
    }

    if (isActive !== undefined) {
      subject.isActive = isActive;
    }

    await subject.save();

    const updatedSubject = await Subject.findById(subject._id)
      .populate("department", "name code")
      .populate("faculty", "facultyId employeeId designation");

    return res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      subject: updatedSubject,
    });
  } catch (error) {
    console.error("Update Subject Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating subject",
    });
  }
};

// ===============================
// DEACTIVATE SUBJECT
// ===============================
const deactivateSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    subject.isActive = false;
    await subject.save();

    return res.status(200).json({
      success: true,
      message: "Subject deactivated successfully",
      subject,
    });
  } catch (error) {
    console.error("Deactivate Subject Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deactivating subject",
    });
  }
};

module.exports = {
  createSubject,
  getSubjects,
  getSubject,
  updateSubject,
  deactivateSubject,
};