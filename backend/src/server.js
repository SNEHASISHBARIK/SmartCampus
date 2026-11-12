const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const connectDB = require("./config/db");

const User = require("./models/User");
const Student = require("./models/Student");
const Faculty = require("./models/Faculty");
const Department = require("./models/Department");
const Subject = require("./models/Subject");
const authRoutes = require("./routes/authRoutes");

const testRoutes = require("./routes/testRoutes");



const Attendance = require("./models/Attendance");
const Assignment = require("./models/Assignment");
const Submission = require("./models/Submission");
const Result = require("./models/Result");
const Notice = require("./models/Notice");
const Complaint = require("./models/Complaint");
const Leave = require("./models/Leave");
const Fee = require("./models/Fee");
const Exam = require("./models/Exam");
const Message = require("./models/Message");
const TimetableEntry = require("./models/TimetableEntry");

const studentRoutes = require("./routes/studentRoutes");

const facultyRoutes = require("./routes/facultyRoutes");

const attendanceRoutes = require("./routes/attendanceRoutes");

const assignmentRoutes = require("./routes/assignmentRoutes");

const resultRoutes = require("./routes/resultRoutes");


const placementRoutes = require("./routes/placementRoutes");

const noteRoutes = require("./routes/noteRoutes");

const examRoutes = require("./routes/examRoutes");

const analyticsRoutes = require("./routes/analyticsRoutes");

const resumeAnalyzerRoutes = require("./routes/resumeAnalyzerRoutes");

const placementPracticeRoutes = require("./routes/placementPracticeRoutes");
const mockInterviewRoutes = require("./routes/mockInterviewRoutes");



const adminStudentRoutes = require("./routes/adminStudentRoutes");


const adminFacultyRoutes = require("./routes/adminFacultyRoutes");

const departmentAdminRoutes = require("./routes/departmentAdminRoutes");

const subjectAdminRoutes = require("./routes/subjectAdminRoutes");

const feeAdminRoutes = require("./routes/feeAdminRoutes");


const complaintAdminRoutes = require("./routes/complaintAdminRoutes");

const leaveAdminRoutes = require("./routes/leaveAdminRoutes");

const noticeAdminRoutes = require("./routes/noticeAdminRoutes");

const examAdminRoutes = require("./routes/examAdminRoutes");


const submissionRoutes = require("./routes/submissionRoutes");
const questionPaperRoutes = require("./routes/questionPaperRoutes");
const timetableAdminRoutes = require("./routes/timetableAdminRoutes");










dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

connectDB();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(
  "/uploads/question-papers",
  express.static(path.resolve(__dirname, "../uploads/question-papers"))
);

app.use("/api/auth", authRoutes);

app.use("/api/test", testRoutes);

app.use("/api/students", studentRoutes);

app.use("/api/faculty", facultyRoutes);

app.use("/api/attendance", attendanceRoutes);


app.use("/api/assignments", assignmentRoutes);

app.use("/api/results", resultRoutes);


app.use("/api/placements", placementRoutes);


app.use("/api/notes", noteRoutes);


app.use("/api/resume-analyzer", resumeAnalyzerRoutes);

app.use("/api/placement-practice", placementPracticeRoutes);
app.use("/api/mock-interview", mockInterviewRoutes);


app.use("/api/exams", examRoutes);

app.use("/api/analytics", analyticsRoutes);

app.use("/api/admin/students", adminStudentRoutes);

app.use("/api/admin/faculty", adminFacultyRoutes);

app.use("/api/admin/departments", departmentAdminRoutes);

app.use("/api/admin/subjects", subjectAdminRoutes);

app.use("/api/admin/fees", feeAdminRoutes);

app.use("/api/admin/complaints", complaintAdminRoutes);

app.use("/api/admin/leaves", leaveAdminRoutes);

app.use("/api/admin/notices", noticeAdminRoutes);

app.use("/api/admin/exams", examAdminRoutes);

app.use("/api/admin/timetable", timetableAdminRoutes);

app.use("/api/submissions", submissionRoutes);

app.use("/api/question-papers", questionPaperRoutes);



app.use("/uploads/submissions",express.static(
    path.resolve(__dirname, "../uploads/submissions")
  )
);



app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SmartCampus API is running",
  });
});

app.get("/api/models-test", (req, res) => {
  res.json({
    success: true,
    models: {
      User: !!User,
      Student: !!Student,
      Faculty: !!Faculty,
      Department: !!Department,
      Subject: !!Subject,
      Attendance: !!Attendance,
      Assignment: !!Assignment,
      Submission: !!Submission,
      Result: !!Result,
      Notice: !!Notice,
      Complaint: !!Complaint,
      Leave: !!Leave,
      Fee: !!Fee,
      Exam: !!Exam,
      Message: !!Message,
      TimetableEntry: !!TimetableEntry,
    },
  });
});

app.listen(PORT, () => {
  console.log(`🚀 SmartCampus server running on port ${PORT}`);
});