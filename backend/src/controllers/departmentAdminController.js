const Department = require("../models/Department");

// ===============================
// CREATE DEPARTMENT
// ===============================
const createDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Name and code are required",
      });
    }

    const normalizedCode = code.trim().toUpperCase();

    const existingDepartment = await Department.findOne({
      $or: [
        { name: name.trim() },
        { code: normalizedCode },
      ],
    });

    if (existingDepartment) {
      return res.status(409).json({
        success: false,
        message: "Department name or code already exists",
      });
    }

    const department = await Department.create({
      name: name.trim(),
      code: normalizedCode,
      description: description?.trim() || "",
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Department created successfully",
      department,
    });
  } catch (error) {
    console.error("Create Department Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating department",
    });
  }
};

// ===============================
// GET ALL DEPARTMENTS
// ===============================
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: departments.length,
      departments,
    });
  } catch (error) {
    console.error("Get Departments Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching departments",
    });
  }
};

// ===============================
// GET SINGLE DEPARTMENT
// ===============================
// ===============================
// GET SINGLE DEPARTMENT
// ===============================
const getDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("Requested Department ID:", id);

    const department = await Department.findOne({
      _id: id,
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    return res.status(200).json({
      success: true,
      department,
    });
  } catch (error) {
    console.error("Get Department Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching department",
    });
  }
};

// ===============================
// UPDATE DEPARTMENT
// ===============================
const updateDepartment = async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      isActive
    } = req.body || {};

    console.log("UPDATE DEPARTMENT ID:", req.params.id);

   const department = await Department.findOne({
  _id: req.params.id
});

  console.log("FOUND DEPARTMENT:", department);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    if (name !== undefined) {
      department.name = name.trim();
    }

    if (code !== undefined) {
      department.code = code.trim().toUpperCase();
    }

    if (description !== undefined) {
      department.description = description.trim();
    }

    if (isActive !== undefined) {
      department.isActive = isActive;
    }

    await department.save();

    return res.status(200).json({
      success: true,
      message: "Department updated successfully",
      department,
    });
  } catch (error) {
    console.error("Update Department Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating department",
    });
  }
};
// ===============================
// DEACTIVATE DEPARTMENT
// ===============================
const deactivateDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    department.isActive = false;
    await department.save();

    return res.status(200).json({
      success: true,
      message: "Department deactivated successfully",
      department,
    });
  } catch (error) {
    console.error("Deactivate Department Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deactivating department",
    });
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartment,
  updateDepartment,
  deactivateDepartment,
};