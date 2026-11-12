const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Faculty = require("../models/Faculty");
const Department = require("../models/Department");

// CREATE FACULTY
const createFaculty = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      facultyId,
      employeeId,
      department,
      designation,
      specialization,
      qualification,
      dateOfJoining,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !facultyId ||
      !employeeId ||
      !department ||
      !designation
    ) {
      return res.status(400).json({
        success: false,
        message:
          "name, email, password, facultyId, employeeId, department and designation are required",
      });
    }

    // Check email
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Check faculty ID
    const existingFacultyId = await Faculty.findOne({
      facultyId,
    });

    if (existingFacultyId) {
      return res.status(409).json({
        success: false,
        message: "Faculty ID already exists",
      });
    }

    // Check employee ID
    const existingEmployeeId = await Faculty.findOne({
      employeeId,
    });

    if (existingEmployeeId) {
      return res.status(409).json({
        success: false,
        message: "Employee ID already exists",
      });
    }

    // Find department
    const departmentData = await Department.findOne({
      code: department.toUpperCase(),
      isActive: true,
    });

    if (!departmentData) {
      return res.status(404).json({
        success: false,
        message: `Department '${department}' not found`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "faculty",
      phone,
      isActive: true,
    });

    try {
      // Create faculty profile
      const faculty = await Faculty.create({
        user: user._id,
        facultyId,
        employeeId,
        department: departmentData._id,
        designation,
        specialization,
        qualification,
        phone,
        dateOfJoining,
        status: "active",
      });

      const populatedFaculty = await Faculty.findById(faculty._id)
        .populate("user", "-password")
        .populate("department", "name code");

      res.status(201).json({
        success: true,
        message: "Faculty created successfully",
        faculty: populatedFaculty,
      });
    } catch (facultyError) {
      // Roll back user if faculty creation fails
      await User.findByIdAndDelete(user._id);

      throw facultyError;
    }
  } catch (error) {
    console.error("Create faculty error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating faculty",
    });
  }
};


// GET ALL FACULTY
const getFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find()
      .populate("user", "-password")
      .populate("department", "name code")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: faculty.length,
      faculty,
    });
  } catch (error) {
    console.error("Get faculty error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching faculty",
    });
  }
};


// GET ONE FACULTY
const getOneFaculty = async (req, res) => {
  try {
    const { id } = req.params;

    const faculty = await Faculty.findById(id)
      .populate("user", "-password")
      .populate("department", "name code");

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    res.status(200).json({
      success: true,
      faculty,
    });
  } catch (error) {
    console.error("Get one faculty error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// UPDATE FACULTY
const updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      phone,
      department,
      designation,
      specialization,
      qualification,
      dateOfJoining,
      status,
    } = req.body;

    const faculty = await Faculty.findById(id);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    if (department !== undefined) {
      const departmentData = await Department.findOne({
        code: department.toUpperCase(),
        isActive: true,
      });

      if (!departmentData) {
        return res.status(404).json({
          success: false,
          message: `Department '${department}' not found`,
        });
      }

      faculty.department = departmentData._id;
    }

    if (designation !== undefined) faculty.designation = designation;
    if (specialization !== undefined)
      faculty.specialization = specialization;
    if (qualification !== undefined)
      faculty.qualification = qualification;
    if (phone !== undefined) faculty.phone = phone;
    if (dateOfJoining !== undefined)
      faculty.dateOfJoining = dateOfJoining;

    if (status !== undefined) {
      faculty.status = status;
    }

    await faculty.save();

    const user = await User.findById(faculty.user);

    if (user) {
      if (name !== undefined) user.name = name;
      if (phone !== undefined) user.phone = phone;

      if (status === "inactive") {
        user.isActive = false;
      }

      if (status === "active") {
        user.isActive = true;
      }

      await user.save();
    }

    const updatedFaculty = await Faculty.findById(faculty._id)
      .populate("user", "-password")
      .populate("department", "name code");

    res.status(200).json({
      success: true,
      message: "Faculty updated successfully",
      faculty: updatedFaculty,
    });
  } catch (error) {
    console.error("Update faculty error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating faculty",
    });
  }
};


// DEACTIVATE FACULTY
const deactivateFaculty = async (req, res) => {
  try {
    const { id } = req.params;

    const faculty = await Faculty.findById(id);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    faculty.status = "inactive";
    await faculty.save();

    await User.findByIdAndUpdate(faculty.user, {
      isActive: false,
    });

    res.status(200).json({
      success: true,
      message: "Faculty deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate faculty error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// CHANGE FACULTY PASSWORD
const changeFacultyPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const faculty = await Faculty.findById(id);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    const user = await User.findById(faculty.user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Faculty user account not found",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Faculty password changed successfully",
    });
  } catch (error) {
    console.error("Change faculty password error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while changing faculty password",
    });
  }
};


module.exports = {
  createFaculty,
  getFaculty,
  getOneFaculty,
  updateFaculty,
  deactivateFaculty,
  changeFacultyPassword
};