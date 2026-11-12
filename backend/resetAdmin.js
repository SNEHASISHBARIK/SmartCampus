require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./src/models/User");

const resetAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    const admin = await User.findByIdAndUpdate(
      "6ab28c3c37e17f8918754238",
      {
        email: "admin@smartcampus.com",
        password: hashedPassword,
        role: "admin",
        isActive: true,
      },
      { new: true }
    );

    if (!admin) {
      console.log("Admin user not found");
      process.exit(1);
    }

    console.log("Admin credentials reset successfully");

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

resetAdmin();