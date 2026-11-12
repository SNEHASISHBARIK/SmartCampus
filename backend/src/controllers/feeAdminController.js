const Fee = require("../models/Fee");
const Student = require("../models/Student");

// ===============================
// CREATE FEE
// ===============================
const createFee = async (req, res) => {
  try {
    const {
      student,
      semester,
      feeType,
      amount,
      paidAmount,
      dueDate,
      paymentDate,
      transactionId,
      status,
    } = req.body;

    if (!student || !semester || !feeType || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Student, semester, feeType and amount are required",
      });
    }

    // Check student
    const studentData = await Student.findById(student);

    if (!studentData) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Validate paid amount
    const finalPaidAmount = paidAmount ?? 0;

    if (finalPaidAmount > amount) {
      return res.status(400).json({
        success: false,
        message: "Paid amount cannot be greater than total amount",
      });
    }

    const fee = await Fee.create({
      student,
      semester,
      feeType,
      amount,
      paidAmount: finalPaidAmount,
      dueDate,
      paymentDate,
      transactionId: transactionId || "",
      status: status || "pending",
    });

    const populatedFee = await Fee.findById(fee._id).populate({
      path: "student",
      populate: {
        path: "user",
        select: "name email",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Fee created successfully",
      fee: populatedFee,
    });
  } catch (error) {
    console.error("Create Fee Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating fee",
    });
  }
};

// ===============================
// GET ALL FEES
// ===============================
const getFees = async (req, res) => {
  try {
    const fees = await Fee.find()
      .populate({
        path: "student",
        populate: {
          path: "user",
          select: "name email",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: fees.length,
      fees,
    });
  } catch (error) {
    console.error("Get Fees Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching fees",
    });
  }
};

// ===============================
// GET SINGLE FEE
// ===============================
const getFee = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id).populate({
      path: "student",
      populate: {
        path: "user",
        select: "name email",
      },
    });

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: "Fee record not found",
      });
    }

    return res.status(200).json({
      success: true,
      fee,
    });
  } catch (error) {
    console.error("Get Fee Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching fee",
    });
  }
};

// ===============================
// UPDATE FEE
// ===============================
const updateFee = async (req, res) => {
  try {
    const {
      semester,
      feeType,
      amount,
      paidAmount,
      dueDate,
      paymentDate,
      transactionId,
      status,
    } = req.body || {};

    const fee = await Fee.findById(req.params.id);

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: "Fee record not found",
      });
    }

    if (semester !== undefined) {
      fee.semester = semester;
    }

    if (feeType !== undefined) {
      fee.feeType = feeType;
    }

    if (amount !== undefined) {
      fee.amount = amount;
    }

    if (paidAmount !== undefined) {
      fee.paidAmount = paidAmount;
    }

    if (dueDate !== undefined) {
      fee.dueDate = dueDate;
    }

    if (paymentDate !== undefined) {
      fee.paymentDate = paymentDate;
    }

    if (transactionId !== undefined) {
      fee.transactionId = transactionId;
    }

    if (status !== undefined) {
      fee.status = status;
    }

    if (fee.paidAmount > fee.amount) {
      return res.status(400).json({
        success: false,
        message: "Paid amount cannot be greater than total amount",
      });
    }

    await fee.save();

    const updatedFee = await Fee.findById(fee._id).populate({
      path: "student",
      populate: {
        path: "user",
        select: "name email",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Fee updated successfully",
      fee: updatedFee,
    });
  } catch (error) {
    console.error("Update Fee Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating fee",
    });
  }
};

// ===============================
// DELETE FEE
// ===============================
const deleteFee = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: "Fee record not found",
      });
    }

    await Fee.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Fee deleted successfully",
    });
  } catch (error) {
    console.error("Delete Fee Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting fee",
    });
  }
};

module.exports = {
  createFee,
  getFees,
  getFee,
  updateFee,
  deleteFee,
};