const mongoose = require("mongoose");
require("dotenv").config();

const Department = require("./models/Department");

const departments = [
  {
    name: "Computer Science and Engineering",
    code: "CSE",
    description: "Department of Computer Science and Engineering",
  },
  {
    name: "Information Technology",
    code: "IT",
    description: "Department of Information Technology",
  },
  {
    name: "Electronics and Communication Engineering",
    code: "ECE",
    description: "Department of Electronics and Communication Engineering",
  },
  {
    name: "Electrical Engineering",
    code: "EE",
    description: "Department of Electrical Engineering",
  },
  {
    name: "Mechanical Engineering",
    code: "ME",
    description: "Department of Mechanical Engineering",
  },
  {
    name: "Civil Engineering",
    code: "CE",
    description: "Department of Civil Engineering",
  },
];

const seedDepartments = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB connected");

    for (const department of departments) {
      const existingDepartment = await Department.findOne({
        code: department.code,
      });

      if (existingDepartment) {
        console.log(`⚠️ ${department.code} already exists`);
        continue;
      }

      await Department.create(department);

      console.log(`✅ ${department.code} created`);
    }

    console.log("\n🎉 Department seeding completed");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);

    await mongoose.disconnect();
    process.exit(1);
  }
};

seedDepartments();