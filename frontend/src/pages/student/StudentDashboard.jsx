import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiArrowRight,
  FiBell,
  FiBookOpen,
  FiCalendar,
  FiClock,
  FiCreditCard,
  FiDownload,
  FiFileText,
  FiMaximize,
  FiMinimize,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrendingUp,
  FiUpload,
} from "react-icons/fi";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./StudentDashboard.css";

const dateLabel = (date, options = { day: "2-digit", month: "short" }) => {
  if (!date) return "Date unavailable";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? "Date unavailable"
    : parsed.toLocaleDateString("en-IN", options);
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [partialError, setPartialError] = useState(false);
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
          await document.documentElement.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed:", err);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setReloadKey((key) => key + 1);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchDashboard = async () => {
      setLoading(true);
      setError("");
      setPartialError(false);

      const requests = await Promise.allSettled([
        api.get("/students/dashboard"),
        api.get("/students/subjects"),
        api.get("/students/assignments"),
        api.get("/students/attendance"),
        api.get("/students/results"),
        api.get("/students/exams"),
      ]);

      if (!isMounted) return;

      const [
        dashboardResult,
        subjectsResult,
        assignmentsResult,
        attendanceResult,
        resultsResult,
        examsResult,
      ] = requests;

      if (dashboardResult.status === "rejected") {
        const requestError = dashboardResult.reason;
        console.error("Dashboard error:", requestError);
        setError(
          requestError.response?.data?.message || "Unable to load dashboard."
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const dashboardData = dashboardResult.value.data?.dashboard;

      if (!dashboardData) {
        setError("No dashboard data found.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const supplementalResults = [
        subjectsResult,
        assignmentsResult,
        attendanceResult,
        resultsResult,
        examsResult,
      ];
      const hasSupplementalError = supplementalResults.some(
        (result) => result.status === "rejected"
      );
      supplementalResults.forEach((result) => {
        if (result.status === "rejected") {
          console.error("Student dashboard detail request failed:", result.reason);
        }
      });

      setPartialError(hasSupplementalError);
      setDashboard({
        ...dashboardData,
        subjects:
          subjectsResult.status === "fulfilled"
            ? subjectsResult.value.data?.subjects || []
            : [],
        assignments:
          assignmentsResult.status === "fulfilled"
            ? assignmentsResult.value.data?.assignments || []
            : [],
        attendanceRecords:
          attendanceResult.status === "fulfilled"
            ? attendanceResult.value.data?.attendance || []
            : [],
        results:
          resultsResult.status === "fulfilled"
            ? resultsResult.value.data?.results || []
            : [],
        exams:
          examsResult.status === "fulfilled"
            ? examsResult.value.data?.exams || []
            : dashboardData.upcomingExams || [],
      });
      setLoading(false);
      setRefreshing(false);
    };

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const chartData = useMemo(() => {
    const records = dashboard?.attendanceRecords || [];
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setHours(0, 0, 0, 0);
    currentWeekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));

    return Array.from({ length: 4 }, (_, index) => {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() - (3 - index) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weeklyRecords = records.filter((record) => {
        if (!record.date) return false;
        const date = new Date(record.date);
        return date >= weekStart && date < weekEnd;
      });
      const present = weeklyRecords.filter(
        (record) => record.status === "present"
      ).length;

      return {
        label: `Week ${index + 1}`,
        percentage: weeklyRecords.length
          ? Math.round((present / weeklyRecords.length) * 100)
          : 0,
      };
    });
  }, [dashboard?.attendanceRecords]);

  if (loading) {
    return (
      <div className="student-dashboard-state">
        <div className="student-dashboard-spinner" />
        <p>Loading your campus dashboard...</p>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="student-dashboard-state student-dashboard-error">
        <FiAlertCircle />
        <h2>{error || "No dashboard data found."}</h2>
        <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
          Try again
        </button>
      </div>
    );
  }

  const student = dashboard.student || {};
  const studentName = user?.name || student.user?.name || "Student";
  const firstName = studentName.trim().split(/\s+/)[0];
  const subjects = dashboard.subjects || [];
  const assignments = dashboard.assignments || [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingExams = (dashboard.exams || dashboard.upcomingExams || []).filter(
    (exam) => {
      if (!exam.date || ["completed", "closed", "cancelled"].includes(String(exam.status || "").toLowerCase())) {
        return false;
      }
      const examDate = new Date(exam.date);
      return !Number.isNaN(examDate.getTime()) && examDate >= today;
    }
  );
  const todaysExams = upcomingExams.filter(
    (exam) => new Date(exam.date).toDateString() === today.toDateString()
  );
  const notices = dashboard.notices || [];
  const attendancePercentage = Number(dashboard.attendance?.percentage || 0);
  const results = dashboard.results || [];
  const cgpaValues = results
    .filter((result) => result.gradePoint !== null && result.gradePoint !== undefined && result.gradePoint !== "")
    .map((result) => Number(result.gradePoint))
    .filter(Number.isFinite);
  const cgpa = cgpaValues.length
    ? (cgpaValues.reduce((sum, value) => sum + value, 0) / cgpaValues.length).toFixed(1)
    : "—";
  const currentDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const normalizedSearch = search.trim().toLowerCase();
  const visibleSubjects = subjects
    .filter((subject) =>
      `${subject.name} ${subject.code}`.toLowerCase().includes(normalizedSearch)
    )
    .slice(0, 4);
  const visibleNotices = notices
    .filter((notice) =>
      `${notice.title} ${notice.content}`.toLowerCase().includes(normalizedSearch)
    )
    .slice(0, 4);
  const upcomingAssignments = [...assignments]
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 4);
  const quickActions = [
    { label: "Apply Leave", icon: <FiCalendar />, color: "mint", path: "/student/leave" },
    { label: "Pay Fees", icon: <FiCreditCard />, color: "blue", path: "/student/fees" },
    { label: "Download Notes", icon: <FiDownload />, color: "purple", path: "/student/notes" },
    { label: "Submit Assignment", icon: <FiUpload />, color: "orange", path: "/student/assignments" },
    { label: "View Results", icon: <FiTrendingUp />, color: "pink", path: "/student/results" },
    { label: "Raise Complaint", icon: <FiAlertCircle />, color: "sky", path: "/student/complaints" },
  ];

  return (
    <div className="student-dashboard">
      <div className="student-dashboard-toolbar">
        <div className="student-search">
          <FiSearch aria-hidden="true" />
          <input
            aria-label="Search subjects and notices"
            placeholder="Search for subjects, notices, etc..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="student-toolbar-actions">
          <div className="student-current-date-chip">
            <FiCalendar />
            <span>{currentDate}</span>
          </div>

          <button
            type="button"
            className={`student-toolbar-btn student-refresh-btn ${refreshing ? "spinning" : ""}`}
            onClick={handleRefresh}
            title="Refresh dashboard data"
            aria-label="Refresh dashboard data"
          >
            <FiRefreshCw className="btn-icon" />
            <span className="btn-text">Refresh</span>
          </button>

          <button
            type="button"
            className="student-toolbar-btn student-fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen Mode" : "Enter Fullscreen Mode"}
            aria-label="Toggle full screen"
          >
            {isFullscreen ? <FiMinimize className="btn-icon" /> : <FiMaximize className="btn-icon" />}
            <span className="btn-text">{isFullscreen ? "Exit Full" : "Full Screen"}</span>
          </button>
        </div>

        <div className="student-toolbar-profile">
          <span className="student-notification" aria-label="Notifications">
            <FiBell />
            {notices.length > 0 && <i />}
          </span>
          <div className="student-mini-avatar">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div className="student-toolbar-name">
            <strong>{studentName}</strong>
            <span>
              {student.department?.code || student.department?.name || "Student"}
              {student.semester ? ` · Semester ${student.semester}` : ""}
            </span>
          </div>
        </div>
      </div>

      {partialError && (
        <div className="student-dashboard-partial-warning" role="status">
          Some dashboard details could not be loaded.
          <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
            Retry
          </button>
        </div>
      )}

      <section className="student-welcome-banner">
        <div className="student-welcome-copy">
          <span className="student-welcome-eyebrow">WELCOME BACK</span>
          <p>Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"},</p>
          <h1>{firstName}! <span aria-hidden="true">👋</span></h1>
          <span className="student-welcome-subtitle">
            Keep learning, keep growing. You’re doing great!
          </span>
          <small>{currentDate}</small>
        </div>
        <div className="student-campus-art" aria-hidden="true">
          <div className="campus-sun" />
          <div className="campus-tree campus-tree-left" />
          <div className="campus-building-art">
            <div className="campus-building-roof" />
            <div className="campus-building-windows" />
          </div>
          <div className="campus-tree campus-tree-right" />
        </div>
      </section>

      <section className="student-stat-grid" aria-label="Student overview">
        <StatCard
          icon={<FiCalendar />}
          title="Attendance"
          value={`${attendancePercentage}%`}
          note={attendancePercentage >= 75 ? "Above required 75%" : "Required: 75%"}
          color="green"
          progress={attendancePercentage}
        />
        <StatCard
          icon={<FiBookOpen />}
          title="Total Subjects"
          value={subjects.length}
          note={`Semester ${student.semester || "—"}`}
          color="blue"
        />
        <StatCard
          icon={<FiFileText />}
          title="Assignments"
          value={assignments.length || dashboard.assignmentsCount || 0}
          note="Active this semester"
          color="orange"
        />
        <StatCard
          icon={<FiTrendingUp />}
          title="CGPA"
          value={cgpa}
          note={results.length ? "Based on published results" : "As per latest results"}
          color="purple"
        />
      </section>

      <section className="student-dashboard-grid student-dashboard-top-grid">
        <DashboardPanel
          className="student-classes-panel"
          icon={<FiCalendar />}
          title="Today's Classes"
          action="View Full Timetable"
          to="/student/timetable"
        >
          <div className="student-list">
            {todaysExams.slice(0, 4).map((exam) => (
                <div className="student-class-row" key={exam._id}>
                  <span className="student-class-dot" />
                  <strong>{exam.startTime || "Today"}</strong>
                  <div className="student-list-primary">
                    <b>{exam.subject?.name || exam.title}</b>
                    <span>{exam.subject?.code || exam.examType || "Exam"}</span>
                  </div>
                  <span className="student-row-meta">
                    {exam.room ? `Room: ${exam.room}` : "Exam"}
                  </span>
                </div>
              ))}
            {todaysExams.length === 0 && (
              <EmptyList message="No classes or exams scheduled for today." />
            )}
          </div>
        </DashboardPanel>

        <DashboardPanel
          className="student-deadlines-panel"
          icon={<FiClock />}
          title="Upcoming Deadlines"
          action="View All"
          to="/student/assignments"
        >
          <div className="student-list">
            {upcomingAssignments.length ? upcomingAssignments.map((assignment) => {
              const due = assignment.dueDate ? new Date(assignment.dueDate) : null;
              const isOverdue = due && due < new Date();
              return (
                <div className="student-deadline-row" key={assignment._id}>
                  <div className="student-date-tile">
                    <strong>{due && !Number.isNaN(due.getTime()) ? due.toLocaleDateString("en-IN", { day: "2-digit" }) : "—"}</strong>
                    <span>{due && !Number.isNaN(due.getTime()) ? due.toLocaleDateString("en-IN", { month: "short" }).toUpperCase() : "DUE"}</span>
                  </div>
                  <div className="student-list-primary">
                    <b>{assignment.title}</b>
                    <span>{assignment.subject?.name || "Assignment"}</span>
                  </div>
                  <span className={`student-status-badge ${isOverdue ? "is-overdue" : "is-upcoming"}`}>
                    {isOverdue ? "Overdue" : "Upcoming"}
                  </span>
                </div>
              );
            }) : <EmptyList message="No active assignment deadlines." />}
          </div>
        </DashboardPanel>

        <DashboardPanel
          className="student-notices-panel"
          icon={<FiBell />}
          title="Recent Notices"
          action="View All"
          to="/student/notices"
        >
          <div className="student-list">
            {visibleNotices.length ? visibleNotices.map((notice, index) => (
              <div className="student-notice-row" key={notice._id}>
                <span className={`student-notice-icon notice-color-${index % 4}`}>
                  <FiFileText />
                </span>
                <div className="student-list-primary">
                  <b>{notice.title}</b>
                  <span>{notice.category || "General"}</span>
                </div>
                <time>{dateLabel(notice.createdAt)}</time>
              </div>
            )) : <EmptyList message={search ? "No notices match your search." : "No recent notices."} />}
          </div>
        </DashboardPanel>
      </section>

      <section className="student-dashboard-grid student-dashboard-bottom-grid">
        <DashboardPanel
          className="student-attendance-panel"
          icon={<FiTrendingUp />}
          title="Attendance Overview"
          action="This Month"
        >
          <div className="student-chart">
            <div className="student-chart-y-labels">
              <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
            </div>
            <div className="student-chart-plot">
              {[100, 75, 50, 25, 0].map((mark) => (
                <span className="student-chart-gridline" style={{ bottom: `${mark}%` }} key={mark} />
              ))}
              {chartData.map((week) => (
                <div className="student-chart-column" key={week.label}>
                  <strong>{week.percentage ? `${week.percentage}%` : ""}</strong>
                  <div className="student-chart-bar-track">
                    <div
                      className="student-chart-bar"
                      style={{ height: `${Math.max(week.percentage, 3)}%` }}
                      title={`${week.label}: ${week.percentage}% attendance`}
                    />
                  </div>
                  <span>{week.label}</span>
                </div>
              ))}
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel
          className="student-subjects-panel"
          icon={<FiBookOpen />}
          title="Subjects"
          action="View All"
          to="/student/subjects"
        >
          <div className="student-subject-grid">
            {visibleSubjects.length ? visibleSubjects.map((subject, index) => (
              <div className="student-subject-chip" key={subject._id}>
                <span className={`student-subject-icon subject-color-${index % 4}`}>
                  <FiBookOpen />
                </span>
                <span>
                  <strong>{subject.name}</strong>
                  <small>{subject.code || `Semester ${subject.semester || student.semester || "—"}`}</small>
                </span>
              </div>
            )) : <EmptyList message={search ? "No subjects match your search." : "No subjects available."} />}
          </div>
        </DashboardPanel>

        <DashboardPanel
          className="student-quick-panel"
          icon={<FiPlus />}
          title="Quick Actions"
        >
          <div className="student-quick-grid">
            {quickActions.map((action) => (
              <button
                className="student-quick-action"
                type="button"
                key={action.label}
                onClick={() => navigate(action.path)}
              >
                <span className={`student-quick-icon ${action.color}`}>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </DashboardPanel>
      </section>

      <footer className="student-dashboard-quote">
        <span className="student-quote-cap">
          <FiBookOpen />
        </span>
        <strong>“Discipline today leads to a brighter tomorrow.”</strong>
        <small>— SmartCampus</small>
      </footer>
    </div>
  );
};

const StatCard = ({ icon, title, value, note, color, progress }) => (
  <article className="student-stat-card">
    <span className={`student-stat-icon ${color}`}>{icon}</span>
    <div className="student-stat-copy">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{note}</small>
      {progress !== undefined && (
        <span className="student-stat-progress">
          <i style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
        </span>
      )}
    </div>
  </article>
);

const DashboardPanel = ({ className = "", icon, title, action, to, children }) => (
  <section className={`student-dashboard-panel ${className}`}>
    <header className="student-panel-heading">
      <div>
        <span className="student-panel-heading-icon">{icon}</span>
        <h2>{title}</h2>
      </div>
      {action && (to ? (
        <Link className="student-panel-action" to={to}>
          {action}<FiArrowRight />
        </Link>
      ) : (
        <span className="student-panel-period">{action}</span>
      ))}
    </header>
    {children}
  </section>
);

const EmptyList = ({ message }) => (
  <p className="student-dashboard-empty">{message}</p>
);

export default StudentDashboard;
