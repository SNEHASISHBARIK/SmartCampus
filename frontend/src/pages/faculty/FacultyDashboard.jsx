import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiBookOpen,
  FiFileText,
  FiCalendar,
  FiCheckCircle,
  FiPlusCircle,
  FiEdit3,
  FiUpload,
  FiBarChart2,
  FiArrowRight,
  FiAlertCircle,
} from "react-icons/fi";

import api from "../../services/api";
import "./FacultyDashboard.css";

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
    setReloadKey((prev) => prev + 1);
  };

  useEffect(() => {
    const controller = new AbortController();

    const fetchDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/faculty/dashboard", {
          signal: controller.signal,
        });
        const data = response.data?.dashboard;

        if (!response.data?.success || !data || !data.statistics || !data.faculty) {
          throw new Error("The faculty dashboard response is incomplete.");
        }

        setDashboard(data);
      } catch (requestError) {
        if (requestError.code === "ERR_CANCELED") return;
        console.error("Failed to load faculty dashboard:", requestError);
        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Failed to load faculty dashboard."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    fetchDashboard();
    return () => controller.abort();
  }, [reloadKey]);

  const statistics = dashboard?.statistics || {};
  const faculty = dashboard?.faculty || {};
  const upcomingExams = Array.isArray(dashboard?.upcomingExams)
    ? dashboard.upcomingExams
    : [];

  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const todaysExams = upcomingExams.filter((exam) => {
    if (!exam.date) return false;

    const examDate = new Date(exam.date);

    return (
      !Number.isNaN(examDate.getTime()) &&
      examDate >= todayStart &&
      examDate < todayEnd &&
      !["completed", "closed", "cancelled"].includes(
        String(exam.status || "").toLowerCase()
      )
    );
  });

  const facultyName =
    faculty?.user?.name || "Faculty";

  const firstName = facultyName.split(" ")[0];

  const department =
    faculty?.department?.code ||
    faculty?.department?.name ||
    "Faculty";

  const currentDate = new Date().toLocaleDateString(
    "en-IN",
    {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

  const statData = [
      {
        title: "Total Students",
        value: statistics.totalStudents || 0,
        icon: <FiUsers />,
        color: "blue",
        note: "Students under your access",
      },
      {
        title: "Subjects Handled",
        value: statistics.totalSubjects || 0,
        icon: <FiBookOpen />,
        color: "green",
        note: "Subjects assigned",
      },
      {
        title: "Assignments",
        value: statistics.totalAssignments || 0,
        icon: <FiFileText />,
        color: "orange",
        note: "Total assignments",
      },
      {
        title: "Upcoming Exams",
        value: statistics.totalExams || 0,
        icon: <FiCalendar />,
        color: "purple",
        note: "Exam records",
      },
    ];

  if (loading) {
    return (
      <div className="faculty-dashboard-page">
        <div className="faculty-dashboard-loading">
          <div className="faculty-loader"></div>
          <h3>Loading Faculty Dashboard...</h3>
          <p>Please wait while we load your dashboard.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="faculty-dashboard-page">
        <div className="faculty-dashboard-error">
          <FiAlertCircle />
          <h2>Unable to load dashboard</h2>
          <p>{error}</p>

          <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="faculty-dashboard-page">
        <div className="faculty-empty-state">
          <FiAlertCircle />
          <h2>No dashboard data available</h2>
          <p>
            Faculty dashboard information could not be
            found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="faculty-dashboard-page">

      {/* ================= HEADER ================= */}

      <div className="faculty-dashboard-heading">

        <div className="faculty-dashboard-title-area">
          <h1>
            Welcome Back, {firstName}! 👋
          </h1>

          <p>
            Here's what's happening with your classes today.
          </p>
        </div>

        <div className="faculty-heading-actions">
          <div className="faculty-current-date">
            <FiCalendar />
            <span>{currentDate}</span>
          </div>

          <button
            className={`faculty-action-btn ${refreshing ? "spinning" : ""}`}
            onClick={handleRefresh}
            title="Refresh Dashboard Data"
            aria-label="Refresh dashboard"
          >
            <span className="btn-icon">🔄</span>
            <span className="btn-text">Refresh</span>
          </button>

          <button
            className="faculty-action-btn fullscreen-action-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen Mode" : "Enter Fullscreen Mode"}
            aria-label="Toggle full screen"
          >
            <span className="btn-icon">{isFullscreen ? "🗗" : "⛶"}</span>
            <span className="btn-text">{isFullscreen ? "Exit Full" : "Full Screen"}</span>
          </button>
        </div>

      </div>

      {/* ================= STATISTICS ================= */}

      <section className="faculty-stat-grid">

        {statData.map((stat) => (
          <div
            className="faculty-stat-card"
            key={stat.title}
          >

            <div
              className={`faculty-stat-icon ${stat.color}`}
            >
              {stat.icon}
            </div>

            <div className="faculty-stat-content">

              <strong>{stat.value}</strong>

              <span>{stat.title}</span>

              <small>{stat.note}</small>

            </div>

          </div>
        ))}

      </section>

      {/* ================= MAIN GRID ================= */}

      <section className="faculty-main-grid">

        {/* TODAY'S SCHEDULE */}

        <div className="faculty-panel schedule-panel">

          <div className="faculty-panel-header">

            <div>
              <h2>Today's Schedule</h2>
              <p>Your classes and activities for today</p>
            </div>

            <button
              type="button"
              className="panel-link"
              onClick={() => navigate("/faculty/exams")}
            >
              View Exams
              <FiArrowRight />
            </button>

          </div>

          <div className="schedule-list">
            {todaysExams.length === 0 ? (
              <div className="empty-dashboard-content">
                <div className="empty-dashboard-icon">
                  <FiCalendar />
                </div>
                <strong>No exams scheduled for today</strong>
                <span>
                  Today's exam schedule will appear here when available.
                </span>
              </div>
            ) : (
              todaysExams.map((exam) => (
                <div className="schedule-item" key={exam._id}>
                  <div className="empty-dashboard-icon">
                    <FiCalendar />
                  </div>
                  <div>
                    <strong>{exam.title}</strong>
                    <span>
                      {exam.subject?.name || "Subject unavailable"}
                    </span>
                    <span>
                      {exam.startTime} – {exam.endTime}
                    </span>
                    {exam.room && <span>Room: {exam.room}</span>}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* RECENT ACTIVITIES */}

        <div className="faculty-panel activities-panel">

          <div className="faculty-panel-header">

            <div>
              <h2>Recent Activities</h2>
              <p>Your latest faculty activities</p>
            </div>

            <button
              type="button"
              className="panel-link"
              onClick={() => navigate("/faculty/assignments")}
            >
              View Assignments
              <FiArrowRight />
            </button>

          </div>

          <div className="activity-list">
            {[
              ...(dashboard?.recentAssignments || []).map((assignment) => ({
                id: `assignment-${assignment._id}`,
                icon: <FiFileText />,
                title: assignment.title || "Assignment created",
                text: `Subject: ${assignment.subject?.name || "Not specified"}`,
                color: "orange",
                date: assignment.createdAt,
              })),
              ...(dashboard?.upcomingExams || []).map((exam) => ({
                id: `exam-${exam._id}`,
                icon: <FiCalendar />,
                title: exam.title || "Exam scheduled",
                text: `Subject: ${exam.subject?.name || "Not specified"}`,
                color: "purple",
                date: exam.createdAt,
              })),
            ]
              .sort(
                (a, b) =>
                  new Date(b.date || 0).getTime() -
                  new Date(a.date || 0).getTime()
              )
              .slice(0, 5)
              .map((activity) => (
                <ActivityItem
                  key={activity.id}
                  icon={activity.icon}
                  title={activity.title}
                  text={activity.text}
                  color={activity.color}
                />
              ))}

            {(dashboard?.recentAssignments || []).length === 0 &&
              (dashboard?.upcomingExams || []).length === 0 && (
                <p>No recent activities available.</p>
              )}
          </div>

        </div>

        {/* UPCOMING EVENTS */}

        <div className="faculty-panel events-panel">

          <div className="faculty-panel-header">

            <div>
              <h2>Upcoming Events</h2>
              <p>Important academic activities</p>
            </div>

            <button
              type="button"
              className="panel-link"
              onClick={() => navigate("/faculty/exams")}
            >
              View Exams
              <FiArrowRight />
            </button>

          </div>

          <div className="upcoming-events-list">
            {upcomingExams.length === 0 ? (
              <div className="empty-dashboard-content compact">
                <div className="empty-dashboard-icon">
                  <FiCalendar />
                </div>
                <strong>No upcoming exams</strong>
                <span>
                  Upcoming exams will appear here when you schedule them.
                </span>
              </div>
            ) : (
              upcomingExams.map((exam) => (
                <div className="upcoming-event-item" key={exam._id}>
                  <div className="empty-dashboard-icon">
                    <FiCalendar />
                  </div>
                  <div className="upcoming-event-details">
                    <strong>{exam.title}</strong>
                    <span>{exam.subject?.name || "Subject unavailable"}</span>
                    <span>
                      {new Date(exam.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span>
                      {exam.startTime} – {exam.endTime}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </section>

      {/* ================= SECOND ROW ================= */}

      <section className="faculty-secondary-grid">

        {/* STUDENT OVERVIEW */}

        <div className="faculty-panel student-overview-panel">

          <div className="faculty-panel-header">

            <div>
              <h2>Student Overview</h2>
              <p>Students currently available</p>
            </div>

          </div>

          <div className="overview-content">

            <div className="overview-number">

              <span>
                Total Students
              </span>

              <strong>
                {statistics.totalStudents || 0}
              </strong>

            </div>

            <div className="overview-progress">

              <div className="progress-label">
                <span>Student Records</span>
                <strong>
                  {statistics.totalStudents || 0}
                </strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width:
                      statistics.totalStudents > 0
                        ? "100%"
                        : "0%",
                  }}
                />
              </div>

            </div>

          </div>

        </div>

        {/* PENDING TASKS */}

        <div className="faculty-panel tasks-panel">

          <div className="faculty-panel-header">

            <div>
              <h2>Pending Tasks</h2>
              <p>Faculty activities</p>
            </div>

            <button className="panel-link">
              View All
              <FiArrowRight />
            </button>

          </div>

          <div className="task-list">

            <TaskItem
              icon={<FiFileText />}
              title="Manage assignments"
              subtitle={`${statistics.totalAssignments || 0} assignment records`}
              color="orange"
              onClick={() => navigate("/faculty/assignments")}
            />

            <TaskItem
              icon={<FiCalendar />}
              title="Review examinations"
              subtitle={`${statistics.totalExams || 0} exam records`}
              color="purple"
              onClick={() => navigate("/faculty/exams")}
            />

            <TaskItem
              icon={<FiBarChart2 />}
              title="Review attendance"
              subtitle={`${statistics.totalAttendanceRecords || 0} attendance records`}
              color="blue"
              onClick={() => navigate("/faculty/attendance")}
            />

          </div>

        </div>

        {/* QUICK ACTIONS */}

        <div className="faculty-panel quick-actions-panel">

          <div className="faculty-panel-header">

            <div>
              <h2>Quick Actions</h2>
              <p>Frequently used faculty tools</p>
            </div>

          </div>

          <div className="quick-action-grid">

            <QuickAction
              icon={<FiUpload />}
              title="Upload Notes"
              color="blue"
              onClick={() => navigate("/faculty/notes")}
            />

            <QuickAction
              icon={<FiPlusCircle />}
              title="Create Assignment"
              color="green"
              onClick={() => navigate("/faculty/assignments")}
            />

            <QuickAction
              icon={<FiEdit3 />}
              title="Enter Marks"
              color="purple"
              onClick={() => navigate("/faculty/marks")}
            />

            <QuickAction
              icon={<FiCheckCircle />}
              title="Take Attendance"
              color="orange"
              onClick={() => navigate("/faculty/attendance")}
            />

          </div>

        </div>

      </section>

      {/* ================= FACULTY INFORMATION ================= */}

      <section className="faculty-information-panel">

        <div className="faculty-information-header">

          <div>
            <h2>Faculty Information</h2>
            <p>Your registered faculty details</p>
          </div>

          <div className="faculty-profile-badge">
            {facultyName.charAt(0).toUpperCase()}
          </div>

        </div>

        <div className="faculty-information-grid">

          <InfoItem
            label="Name"
            value={faculty?.user?.name}
          />

          <InfoItem
            label="Email"
            value={faculty?.user?.email}
          />

          <InfoItem
            label="Employee ID"
            value={faculty?.employeeId}
          />

          <InfoItem
            label="Designation"
            value={faculty?.designation}
          />

          <InfoItem
            label="Department"
            value={department}
          />

          <InfoItem
            label="Specialization"
            value={faculty?.specialization}
          />

        </div>

      </section>

      {/* ================= FOOTER ================= */}

      <footer className="faculty-dashboard-footer">

        <div>
          <strong>🎓 SmartCampus</strong>
          <span>
            Empowering Education Through Technology
          </span>
        </div>

        <div>
          <span>v1.0.0</span>
          <span>|</span>
          <span>Gandhi Engineering College</span>
        </div>

      </footer>

    </div>
  );
};


/* =========================================================
   ACTIVITY ITEM
========================================================= */

const ActivityItem = ({
  icon,
  title,
  text,
  color,
}) => {
  return (
    <div className="faculty-activity-item">

      <div
        className={`activity-icon ${color}`}
      >
        {icon}
      </div>

      <div className="activity-content">

        <strong>{title}</strong>

        <span>{text}</span>

      </div>

      <FiArrowRight className="activity-arrow" />

    </div>
  );
};


/* =========================================================
   TASK ITEM
========================================================= */

const TaskItem = ({
  icon,
  title,
  subtitle,
  color,
  onClick,
}) => {
  return (
    <button
      className="faculty-task-item"
      type="button"
      onClick={onClick}
    >

      <div
        className={`task-icon ${color}`}
      >
        {icon}
      </div>

      <div>

        <strong>{title}</strong>

        <span>{subtitle}</span>

      </div>

      <FiArrowRight />

    </button>
  );
};


/* =========================================================
   QUICK ACTION
========================================================= */

const QuickAction = ({
  icon,
  title,
  color,
  onClick,
}) => {
  return (
    <button
      className={`quick-action ${color}`}
      type="button"
      onClick={onClick}
    >

      <div className="quick-action-icon">
        {icon}
      </div>

      <span>{title}</span>

    </button>
  );
};


/* =========================================================
   INFORMATION ITEM
========================================================= */

const InfoItem = ({
  label,
  value,
}) => {
  return (
    <div className="faculty-info-item">

      <span>{label}</span>

      <strong>
        {value || "-"}
      </strong>

    </div>
  );
};

export default FacultyDashboard;