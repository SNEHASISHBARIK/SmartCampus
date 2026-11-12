const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Department = require("../models/Department");
const Student = require("../models/Student");
const Placement = require("../models/Placement");

async function autoSeedEssentialData() {
  try {
    let dept = await Department.findOne({ code: "CSE" });
    if (!dept) {
      dept = await Department.create({
        name: "Computer Science and Engineering",
        code: "CSE",
        description: "Department of Computer Science and Engineering",
        isActive: true,
      });
      console.log("🌱 Auto-seeded CSE Department");
    }

    const studentEmail = "student@test.com";
    let studentUser = await User.findOne({ email: studentEmail });
    const hashedPassword = await bcrypt.hash("Student@123", 10);

    if (!studentUser) {
      studentUser = await User.create({
        name: "Test Student",
        email: studentEmail,
        password: hashedPassword,
        role: "student",
        isActive: true,
      });
      console.log("🌱 Auto-seeded student@test.com user");
    }

    let studentProfile = await Student.findOne({ user: studentUser._id });
    if (!studentProfile) {
      await Student.create({
        user: studentUser._id,
        studentId: "STU2026001",
        rollNumber: "CSE2601",
        department: dept._id,
        semester: 6,
        section: "A",
        batch: "2023-2027",
        status: "active",
      });
      console.log("🌱 Auto-seeded Student profile");
    }

    const jobCount = await Placement.countDocuments({ isActive: true });
    if (jobCount === 0) {
      await Placement.insertMany([
        {
          source: "campus",
          sourceId: "job-cse-1",
          title: "Full Stack Software Engineer",
          company: "InnovateTech Systems",
          location: "Bengaluru, India (Hybrid)",
          category: "Technology",
          jobType: "Full-time",
          sourceUrl: "https://smartcampus.internal/jobs/1",
          description:
            "Looking for a Full Stack Software Engineer skilled in React, Node.js, Express, MongoDB, RESTful APIs, Git, and modern JavaScript. Experience with Python, Docker, or Cloud services is a plus.",
          isActive: true,
        },
        {
          source: "campus",
          sourceId: "job-cse-2",
          title: "Frontend React Developer",
          company: "CloudWave Technologies",
          location: "Hyderabad, India (Remote)",
          category: "Technology",
          jobType: "Full-time",
          sourceUrl: "https://smartcampus.internal/jobs/2",
          description:
            "Seeking a talented Frontend Developer proficient in React.js, JavaScript (ES6+), HTML5, CSS3, responsive web design, state management, and API integration.",
          isActive: true,
        },
        {
          source: "campus",
          sourceId: "job-cse-3",
          title: "Python Backend Developer",
          company: "DataCore Labs",
          location: "Pune, India (On-site)",
          category: "Technology",
          jobType: "Full-time",
          sourceUrl: "https://smartcampus.internal/jobs/3",
          description:
            "We are hiring a Python Backend Developer with strong knowledge of Python, FastAPI/Django/Flask, SQL/NoSQL databases, data structures, and microservices.",
          isActive: true,
        },
        {
          source: "campus",
          sourceId: "job-cse-4",
          title: "AI & Data Science Associate",
          company: "Apex Cognitive",
          location: "Bengaluru, India",
          category: "Technology",
          jobType: "Full-time",
          sourceUrl: "https://smartcampus.internal/jobs/4",
          description:
            "Seeking an AI & Data Science Associate with skills in Python, Machine Learning, Data Analysis, SQL, and LLM integrations.",
          isActive: true,
        },
      ]);
      console.log("🌱 Auto-seeded initial placement jobs");
    }
  } catch (seedErr) {
    console.error("Auto-seeding warning:", seedErr.message);
  }
}

module.exports = { autoSeedEssentialData };
