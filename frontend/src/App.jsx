import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";

// =========================
// Public Pages
// =========================
import PublicLayout from "./pages/public/PublicLayout";
import Home from "./pages/public/Home";
import About from "./pages/public/About";
import Features from "./pages/public/Features";
import Placement from "./pages/public/Placement";
import PlacementGuide from "./pages/public/PlacementGuide";
import InterviewTips from "./pages/public/InterviewTips";
import CampusLife from "./pages/public/CampusLife";
import Contact from "./pages/public/Contact";
import Blog from "./pages/public/Blog";
import HelpCenter from "./pages/public/HelpCenter";
import LegalPage from "./pages/public/LegalPage";

// =========================
// Student
// =========================
import StudentLayout from "./components/StudentLayout";

import StudentDashboard from "./pages/student/StudentDashboard";
import Profile from "./pages/student/Profile";
import Attendance from "./pages/student/Attendance";
import Timetable from "./pages/student/Timetable";
import StudentSubjects from "./pages/student/Subjects";
import Assignments from "./pages/student/Assignments";
import Results from "./pages/student/Results";
import StudentExams from "./pages/student/Exams";
import Leave from "./pages/student/Leave";
import Fees from "./pages/student/Fees";
import Notices from "./pages/student/Notices";
import Complaints from "./pages/student/Complaints";
import Notes from "./pages/student/Notes";
import Placements from "./pages/student/Placements";

// =========================
// Faculty
// =========================
import FacultyLayout from "./pages/faculty/FacultyLayout";

import FacultyDashboard from "./pages/faculty/FacultyDashboard";
import AttendanceManagement from "./pages/faculty/AttendanceManagement";
import AssignmentManagement from "./pages/faculty/AssignmentManagement";
import MarksManagement from "./pages/faculty/MarksManagement";
import NotesManagement from "./pages/faculty/NotesManagement";
import ExamManagement from "./pages/faculty/ExamManagement";

// =========================
// Admin
// =========================
import AdminLayout from "./components/AdminLayout";

import AdminDashboard from "./pages/admin/AdminDashboard";

import Faculty from "./pages/admin/Faculty";
import Departments from "./pages/admin/Departments";
import AdminSubjects from "./pages/admin/Subjects";
import AdminFees from "./pages/admin/Fees";
import AdminComplaints from "./pages/admin/Complaints";
import Leaves from "./pages/admin/Leaves";
import AdminNotices from "./pages/admin/Notices";
import AdminExams from "./pages/admin/Exams";
import AdminTimetable from "./pages/admin/Timetable";
import Students from "./pages/admin/Students";
import Analytics from "./pages/admin/Analytics";

// =========================
// Common Pages & Redirects
// =========================
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (user.role === "faculty") return <Navigate to="/faculty" replace />;
  return <Navigate to="/student" replace />;
};

const Unauthorized = () => (
  <div>
    <h1>403 - Unauthorized</h1>
    <p>You do not have permission to access this page.</p>
  </div>
);

const NotFound = () => (
  <div>
    <h1>404 - Page Not Found</h1>
  </div>
);

function App() {
  return (
    <Routes>

      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/placement" element={<Placement />} />
        <Route path="/placement-guide" element={<PlacementGuide />} />
        <Route path="/interview-tips" element={<InterviewTips />} />
        <Route path="/campus-life" element={<CampusLife />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/privacy" element={<LegalPage type="privacy" />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
      </Route>

      {/* Authentication */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />

      {/* Unauthorized */}
      <Route
        path="/unauthorized"
        element={<Unauthorized />}
      />

      {/* =========================
          Student
      ========================= */}
          {/* Student */}
<Route element={<ProtectedRoute allowedRoles={["student"]} />}>
  <Route path="/student" element={<StudentLayout />}>
    <Route index element={<StudentDashboard />} />
    <Route path="profile" element={<Profile />} />
    <Route path="attendance" element={<Attendance />} />
    <Route path="timetable" element={<Timetable />} />
    <Route path="subjects" element={<StudentSubjects />} />
    <Route path="assignments" element={<Assignments />} />
    <Route path="results" element={<Results />} />
    <Route path="exams" element={<StudentExams />} />
    <Route path="leave" element={<Leave />} />
    <Route path="fees" element={<Fees />} />
    <Route path="notices" element={<Notices />} />
    <Route path="complaints" element={<Complaints />} />
    <Route path="notes" element={<Notes />} />
    <Route path="placements" element={<Placements />} />
  </Route>
</Route>

      {/* =========================
          Faculty
      ========================= */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["faculty"]} />
        }
      >
        <Route
          path="/faculty"
          element={<FacultyLayout />}
        >
          <Route
            index
            element={<FacultyDashboard />}
          />

          <Route
            path="dashboard"
            element={<FacultyDashboard />}
          />

          <Route
            path="attendance"
            element={<AttendanceManagement />}
          />

          <Route
            path="assignments"
            element={<AssignmentManagement />}
          />

          <Route
            path="marks"
            element={<MarksManagement />}
          />

          <Route
            path="notes"
            element={<NotesManagement />}
          />

          <Route
            path="exams"
            element={<ExamManagement />}
          />
        </Route>
      </Route>

      {/* =========================
          Admin
 {/* Admin */}
<Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<AdminDashboard />} />
    <Route path="students" element={<Students />} />
    <Route path="faculty" element={<Faculty />} />
    <Route path="departments" element={<Departments />} />
     <Route path="subjects" element={<AdminSubjects />} />
    
    <Route path="fees" element={<AdminFees />} />
    <Route path="complaints" element={<AdminComplaints />} />
    <Route path="leaves" element={<Leaves />} />
    <Route path="notices" element={<AdminNotices />} />
    <Route path="exams" element={<AdminExams />} />
    <Route path="timetable" element={<AdminTimetable />} />
    <Route path="analytics" element={<Analytics />} />
  </Route>
</Route>
      {/* =========================
          404
      ========================= */}
      <Route
        path="/404"
        element={<NotFound />}
      />

      <Route
        path="*"
        element={<Navigate to="/404" replace />}
      />

    </Routes>
  );
}

export default App;