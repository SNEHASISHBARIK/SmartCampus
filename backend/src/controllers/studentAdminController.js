const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("../models/User");
const Student = require("../models/Student");
const Department = require("../models/Department");
const Subject = require("../models/Subject");

const validateStudentSubjects = async (subjectIds, departmentId, semester) => {
  if (!Array.isArray(subjectIds)) {
    return { error: "Subjects must be provided as a list." };
  }

  const normalizedIds = [...new Set(subjectIds.map(String))];
  if (normalizedIds.some((id) => !mongoose.isValidObjectId(id))) {
    return { error: "One or more selected subjects are invalid." };
  }

  if (normalizedIds.length === 0) {
    return { subjectIds: [] };
  }

  const subjects = await Subject.find({
    _id: { $in: normalizedIds },
    department: departmentId,
    semester: Number(semester),
    isActive: true,
  }).select("_id");

  if (subjects.length !== normalizedIds.length) {
    return {
      error: "Select only active subjects in the student's department and semester.",
    };
  }

  return { subjectIds: subjects.map((subject) => subject._id) };
};

// CREATE STUDENT
const createStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      studentId,
      rollNumber,
      department,
      semester,
      subjects = [],
      section,
      batch,
      dateOfBirth,
      gender,
      address,
      guardianName,
      guardianPhone,
      admissionDate,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !studentId ||
      !rollNumber ||
      !department ||
      !semester
    ) {
      return res.status(400).json({
        success: false,
        message:
          "name, email, password, studentId, rollNumber, department and semester are required",
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

    // Check student ID
    const existingStudentId = await Student.findOne({
      studentId,
    });

    if (existingStudentId) {
      return res.status(409).json({
        success: false,
        message: "Student ID already exists",
      });
    }

    // Check roll number
    const existingRollNumber = await Student.findOne({
      rollNumber,
    });

    if (existingRollNumber) {
      return res.status(409).json({
        success: false,
        message: "Roll number already exists",
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

    const validatedSubjects = await validateStudentSubjects(
      subjects,
      departmentData._id,
      semester
    );
    if (validatedSubjects.error) {
      return res.status(400).json({
        success: false,
        message: validatedSubjects.error,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "student",
      phone,
      isActive: true,
    });

    try {
      // Create student profile
      const student = await Student.create({
        user: user._id,
        studentId,
        rollNumber,
        department: departmentData._id,
        semester,
        subjects: validatedSubjects.subjectIds,
        section,
        batch,
        dateOfBirth,
        gender,
        address,
        guardianName,
        guardianPhone,
        admissionDate,
        status: "active",
      });

      const populatedStudent = await Student.findById(student._id)
        .populate("user", "-password")
        .populate("department", "name code")
        .populate("subjects", "name code semester");

      res.status(201).json({
        success: true,
        message: "Student created successfully",
        student: populatedStudent,
      });
    } catch (studentError) {
      // Remove user if student creation fails
      await User.findByIdAndDelete(user._id);

      throw studentError;
    }
  } catch (error) {
    console.error("Create student error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating student",
    });
  }
};


// GET ALL STUDENTS
const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate("user", "-password")
      .populate("department", "name code")
      .populate("subjects", "name code semester")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error("Get students error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching students",
    });
  }
};


// GET SINGLE STUDENT
const getStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id)
      .populate("user", "-password")
      .populate("department", "name code")
      .populate("subjects", "name code semester");


    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      student,
    });
  } catch (error) {
    console.error("Get student error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// UPDATE STUDENT
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      phone,
      department,
      semester,
      section,
      batch,
      dateOfBirth,
      gender,
      address,
      guardianName,
      guardianPhone,
      admissionDate,
      status,
      subjects,
    } = req.body;

    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    let departmentData = null;
    if (department !== undefined) {
      departmentData = await Department.findOne({
        code: department.toUpperCase(),
        isActive: true,
      });

      if (!departmentData) {
        return res.status(404).json({
          success: false,
          message: `Department '${department}' not found`,
        });
      }

      student.department = departmentData._id;
    }

    const nextSemester = semester === undefined ? student.semester : Number(semester);
    if (!Number.isInteger(nextSemester) || nextSemester < 1 || nextSemester > 8) {
      return res.status(400).json({
        success: false,
        message: "Semester must be a number from 1 to 8.",
      });
    }
    const nextDepartmentId = departmentData?._id || student.department;

    const validatedSubjects = await validateStudentSubjects(
      subjects === undefined ? student.subjects || [] : subjects,
      nextDepartmentId,
      nextSemester
    );
    if (validatedSubjects.error) {
      return res.status(400).json({
        success: false,
        message: validatedSubjects.error,
      });
    }

    if (semester !== undefined) student.semester = nextSemester;
    student.subjects = validatedSubjects.subjectIds;
    if (section !== undefined) student.section = section;
    if (batch !== undefined) student.batch = batch;
    if (dateOfBirth !== undefined) student.dateOfBirth = dateOfBirth;
    if (gender !== undefined) student.gender = gender;
    if (address !== undefined) student.address = address;
    if (guardianName !== undefined) student.guardianName = guardianName;
    if (guardianPhone !== undefined) student.guardianPhone = guardianPhone;
    if (admissionDate !== undefined) student.admissionDate = admissionDate;
    if (status !== undefined) student.status = status;

    await student.save();

    // Update user information
    const user = await User.findById(student.user);

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

    const updatedStudent = await Student.findById(student._id)
      .populate("user", "-password")
      .populate("department", "name code")
      .populate("subjects", "name code semester");

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Update student error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating student",
    });
  }
};


// DEACTIVATE STUDENT
const deactivateStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    student.status = "inactive";
    await student.save();

    await User.findByIdAndUpdate(student.user, {
      isActive: false,
    });

    res.status(200).json({
      success: true,
      message: "Student deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate student error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const activateStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id).populate("user");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Activate Student
    student.status = "active";
    await student.save();

    // Activate User account
    if (student.user) {
      student.user.isActive = true;
      await student.user.save();
    }

    const updatedStudent = await Student.findById(id)
      .populate("user", "name email role phone isActive")
      .populate("department", "name code");

    return res.status(200).json({
      success: true,
      message: "Student activated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Activate student error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while activating student",
      error: error.message,
    });
  }
};

// CHANGE STUDENT PASSWORD
const changeStudentPassword = async (req, res) => {
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
        message: "Password must be at least 6 characters",
      });
    }

    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const user = await User.findById(student.user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Student user account not found",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Student password updated successfully",
    });
  } catch (error) {
    console.error("Change student password error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while changing student password",
    });
  }
};

module.exports = {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deactivateStudent,
  activateStudent,
  changeStudentPassword,
};