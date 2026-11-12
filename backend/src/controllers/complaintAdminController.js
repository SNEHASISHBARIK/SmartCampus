const Complaint = require("../models/Complaint");
const Student = require("../models/Student");


// ==========================================
// CREATE COMPLAINT
// ==========================================
const createComplaint = async (req, res) => {
  try {
    const {
      student,
      subject,
      description,
      category,
    } = req.body;

    if (!student || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: "Student, subject and description are required",
      });
    }

    // Check student exists
    const studentData = await Student.findById(student);

    if (!studentData) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const complaint = await Complaint.create({
      student,
      subject,
      description,
      category: category || "other",
      status: "pending",
    });

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate({
        path: "student",
        populate: {
          path: "user",
          select: "name email phone",
        },
      })
      .populate("resolvedBy", "name email role");

    return res.status(201).json({
      success: true,
      message: "Complaint created successfully",
      complaint: populatedComplaint,
    });
  } catch (error) {
    console.error("Create Complaint Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// ==========================================
// GET ALL COMPLAINTS
// ==========================================
const getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate({
        path: "student",
        populate: {
          path: "user",
          select: "name email phone",
        },
      })
      .populate("resolvedBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error("Get Complaints Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// ==========================================
// GET SINGLE COMPLAINT
// ==========================================
const getComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await Complaint.findById(id)
      .populate({
        path: "student",
        populate: {
          path: "user",
          select: "name email phone",
        },
      })
      .populate("resolvedBy", "name email role");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    return res.status(200).json({
      success: true,
      complaint,
    });
  } catch (error) {
    console.error("Get Complaint Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// ==========================================
// UPDATE COMPLAINT
// ==========================================
const updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      subject,
      description,
      category,
      status,
      response,
    } = req.body || {};

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (subject !== undefined) {
      complaint.subject = subject.trim();
    }

    if (description !== undefined) {
      complaint.description = description.trim();
    }

    if (category !== undefined) {
      complaint.category = category;
    }

    if (status !== undefined) {
      complaint.status = status;

      // If resolved, save admin who resolved it
      if (status === "resolved") {
        complaint.resolvedBy = req.user._id;
        complaint.resolvedAt = new Date();
      }

      // If complaint is moved away from resolved
      if (status !== "resolved") {
        complaint.resolvedBy = null;
        complaint.resolvedAt = null;
      }
    }

    if (response !== undefined) {
      complaint.response = response.trim();
    }

    await complaint.save();

    const updatedComplaint = await Complaint.findById(complaint._id)
      .populate({
        path: "student",
        populate: {
          path: "user",
          select: "name email phone",
        },
      })
      .populate("resolvedBy", "name email role");

    return res.status(200).json({
      success: true,
      message: "Complaint updated successfully",
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error("Update Complaint Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// ==========================================
// DELETE COMPLAINT
// ==========================================
const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    await Complaint.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Complaint deleted successfully",
    });
  } catch (error) {
    console.error("Delete Complaint Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


module.exports = {
  createComplaint,
  getComplaints,
  getComplaint,
  updateComplaint,
  deleteComplaint,
};