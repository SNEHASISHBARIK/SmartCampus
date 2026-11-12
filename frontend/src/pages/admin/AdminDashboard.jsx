import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetchDashboard();

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

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/analytics/dashboard");

      const dashboard = response.data?.dashboard || {};

      setDashboardData(dashboard);
      setStats(dashboard.statistics || {});
    } catch (error) {
      console.error("Failed to load dashboard:", error);
      setError(
        error.response?.data?.message ||
        "Failed to load dashboard data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
  };

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

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner" aria-hidden="true"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-error" role="alert">
          <h2>Unable to load dashboard</h2>
          <p>{error}</p>
          <button onClick={fetchDashboard}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalStudents = stats.totalStudents || 0;
  const totalFaculty = stats.totalFaculty || 0;
  const totalDepartments = stats.totalDepartments || 0;
  const totalSubjects = stats.totalSubjects || 0;

  const studentsByDepartment =
    dashboardData?.studentsByDepartment || [];

  const feeCollection = dashboardData?.feeCollection || {
    totalAmount: 0,
    totalPaidAmount: 0,
    totalPendingAmount: 0,
    collectionPercentage: 0,
  };

  const feeSummary = dashboardData?.feeSummary || [];

  const attendanceSummary =
    dashboardData?.attendanceSummary || [];

  const leaveSummary =
    dashboardData?.leaveSummary || [];

  const assignmentSummary =
    dashboardData?.assignmentSummary || [];

  const resultSummary =
    dashboardData?.resultSummary || [];

  const examSummary =
    dashboardData?.examSummary || [];



  const recentStudents =
  dashboardData?.recentStudents || [];

const recentFaculty =
  dashboardData?.recentFaculty || [];

const recentComplaints =
  dashboardData?.recentComplaints || [];

const recentLeaves =
  dashboardData?.recentLeaves || [];

const recentNotices =
  dashboardData?.recentNotices || [];

const upcomingExams =
  dashboardData?.upcomingExams || [];

const recentResults =
  dashboardData?.recentResults || [];

  const formatCurrency = (amount) => {
    return `₹ ${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const feePending = Number(
    feeSummary.find((item) => item.status === "pending")?.totalAmount || 0
  );

  const feePaid = Number(
    feeSummary.find((item) => item.status === "paid")?.totalAmount || 0
  );

  const feeOverdue = Number(
    feeSummary.find((item) => item.status === "overdue")?.totalAmount || 0
  );

  const feePartial = Number(
    feeSummary.find((item) => item.status === "partial")?.totalAmount || 0
  );

  const feeTotal =
    feePaid + feePending + feeOverdue + feePartial;

  const attendancePresent = Number(
    attendanceSummary.find((item) => item.status === "present")?.count || 0
  );

  const attendanceAbsent = Number(
    attendanceSummary.find((item) => item.status === "absent")?.count || 0
  );

  const attendanceTotal =
    attendancePresent + attendanceAbsent;

  const attendancePercentage =
    attendanceTotal > 0
      ? Math.round((attendancePresent / attendanceTotal) * 100)
      : 0;

  const leavePending = Number(
    leaveSummary.find((item) => item.status === "pending")?.count || 0
  );

  const leaveApproved = Number(
    leaveSummary.find((item) => item.status === "approved")?.count || 0
  );

  const leaveRejected = Number(
    leaveSummary.find((item) => item.status === "rejected")?.count || 0
  );

  const leaveTotal =
    leavePending + leaveApproved + leaveRejected;

  const assignmentActive = Number(
    assignmentSummary.find((item) => item.status === "active")?.count || 0
  );

  const assignmentClosed = Number(
    assignmentSummary.find((item) => item.status === "closed")?.count || 0
  );

  const assignmentTotal = assignmentSummary.reduce(
    (total, item) => total + Number(item.count || 0),
    0
  );

  const publishedResults = Number(
    resultSummary.find((item) => item.published === true)?.count || 0
  );

  const unpublishedResults = Number(
    resultSummary.find((item) => item.published === false)?.count || 0
  );

  const totalResults =
    publishedResults + unpublishedResults;

  const examTypeCounts = examSummary.map((item) => ({
    type: item.examType || item._id || "Other",
    count: Number(item.count || 0),
  }));

  const totalExamsFromSummary = examTypeCounts.reduce(
    (total, item) => total + item.count,
    0
  );


  const formatActivityTime = (date) => {
  if (!date) return "";

  const activityDate = new Date(date);
  const now = new Date();

  const difference =
    now.getTime() - activityDate.getTime();

  const hours =
    difference / (1000 * 60 * 60);

  if (hours < 24) {
    return activityDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (hours < 48) {
    return "Yesterday";
  }

  return activityDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatEventDate = (date) => {
  if (!date) {
    return {
      month: "--",
      day: "--",
      fullDate: "Date not available",
    };
  }

  const eventDate = new Date(date);

  return {
    month: eventDate
      .toLocaleDateString("en-IN", {
        month: "short",
      })
      .toUpperCase(),

    day: eventDate.toLocaleDateString("en-IN", {
      day: "2-digit",
    }),

    fullDate: eventDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };
};


const recentActivities = [
  ...recentStudents.map((student) => ({
    id: `student-${student._id}`,
    type: "student",
    icon: "👤",
    iconClass: "green-icon",
    title: "New student registered",
    description:
      `${student.user?.name || "Student"}` +
      `${
        student.department?.code
          ? ` (${student.department.code})`
          : ""
      }`,
    date: student.createdAt,
  })),

  ...recentFaculty.map((faculty) => ({
    id: `faculty-${faculty._id}`,
    type: "faculty",
    icon: "👨‍🏫",
    iconClass: "blue-icon",
    title: "New faculty added",
    description:
      `${faculty.user?.name || "Faculty"}` +
      `${
        faculty.department?.code
          ? ` (${faculty.department.code})`
          : ""
      }`,
    date: faculty.createdAt,
  })),

  ...recentComplaints.map((complaint) => ({
    id: `complaint-${complaint._id}`,
    type: "complaint",
    icon: "✓",
    iconClass: "green-icon",
    title:
      complaint.status === "resolved"
        ? "Complaint resolved"
        : "New complaint",
    description:
      complaint.subject ||
      complaint.description ||
      "Complaint",
    date: complaint.createdAt,
  })),

  ...recentLeaves.map((leave) => ({
    id: `leave-${leave._id}`,
    type: "leave",
    icon: "📄",
    iconClass: "orange-icon",
    title: "Leave request submitted",
    description:
      leave.reason ||
      "Leave request",
    date: leave.createdAt,
  })),

  ...recentNotices.map((notice) => ({
    id: `notice-${notice._id}`,
    type: "notice",
    icon: "📢",
    iconClass: "purple-icon",
    title: "New notice published",
    description:
      notice.title ||
      "New notice",
    date: notice.createdAt,
  })),
]
  .sort(
    (a, b) =>
      new Date(b.date || 0) -
      new Date(a.date || 0)
  )
  .slice(0, 5);

  /* =========================
     DEPARTMENT DATA
  ========================= */

  const departmentTotal = studentsByDepartment.reduce(
    (total, department) =>
      total + Number(department.totalStudents || 0),
    0
  );

  const departmentColors = [
    "blue",
    "green",
    "orange",
    "purple",
    "pink",
    "cyan",
    "gray",
  ];

  const departmentPercentages =
    studentsByDepartment.map((department, index) => ({
      ...department,

      percentage:
        departmentTotal > 0
          ? Math.round(
              (Number(department.totalStudents || 0) /
                departmentTotal) *
                100
            )
          : 0,

      color:
        departmentColors[
          index % departmentColors.length
        ],
    }));

  /* =========================
     DEPARTMENT DONUT GRADIENT
  ========================= */

  const colorMap = {
    blue: "#1976e8",
    green: "#34a853",
    orange: "#f59e0b",
    purple: "#8b5cf6",
    pink: "#ec4899",
    cyan: "#06b6d4",
    gray: "#9ca3af",
  };

  const departmentGradient =
    departmentPercentages.length > 0
      ? `conic-gradient(${departmentPercentages
          .map((department, index, array) => {
            const start = array
              .slice(0, index)
              .reduce(
                (sum, item) =>
                  sum + item.percentage,
                0
              );

            const end =
              start + department.percentage;

            return `${colorMap[department.color]} ${start}% ${end}%`;
          })
          .join(", ")})`
      : "#e5e7eb";

  return (
    <div className="admin-dashboard">

      {/* =========================
          PAGE HEADER
      ========================= */}

      <div className="dashboard-header">

        <div className="dashboard-header-text">
          <h1>
            Welcome Back, Admin! 👋
          </h1>

          <p>
            Real-time campus intelligence & institutional operations
          </p>
        </div>

        <div className="dashboard-header-actions">
          <div className="dashboard-date-chip">
            <span>📅</span>
            <span>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          <button
            className={`dashboard-action-btn ${refreshing ? "spinning" : ""}`}
            onClick={handleRefresh}
            title="Refresh Dashboard Data"
            aria-label="Refresh dashboard"
          >
            <span className="btn-icon">🔄</span>
            <span className="btn-text">Refresh</span>
          </button>

          <button
            className="dashboard-action-btn fullscreen-action-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen Mode" : "Enter Fullscreen Mode"}
            aria-label="Toggle full screen"
          >
            <span className="btn-icon">{isFullscreen ? "🗗" : "⛶"}</span>
            <span className="btn-text">{isFullscreen ? "Exit Full" : "Full Screen"}</span>
          </button>
        </div>

      </div>


      {/* =========================
          KPI CARDS
      ========================= */}

      <div className="dashboard-kpi-grid">

        {/* STUDENTS */}

        <div className="dashboard-kpi student">

          <div className="kpi-icon">
            👥
          </div>

          <div>

            <strong>
              {totalStudents.toLocaleString()}
            </strong>

            <span>
              Total Students
            </span>

            <small>
              ↑ 5% from last month
            </small>

          </div>

        </div>


        {/* FACULTY */}

        <div className="dashboard-kpi faculty">

          <div className="kpi-icon">
            👤
          </div>

          <div>

            <strong>
              {totalFaculty}
            </strong>

            <span>
              Total Faculty
            </span>

            <small>
              ↑ 2% from last month
            </small>

          </div>

        </div>


        {/* DEPARTMENTS */}

        <div className="dashboard-kpi department">

          <div className="kpi-icon">
            🏢
          </div>

          <div>

            <strong>
              {totalDepartments}
            </strong>

            <span>
              Departments
            </span>

            <small className="neutral">
              — No change
            </small>

          </div>

        </div>


        {/* SUBJECTS */}

        <div className="dashboard-kpi subject">

          <div className="kpi-icon">
            📚
          </div>

          <div>

            <strong>
              {totalSubjects}
            </strong>

            <span>
              Total Subjects
            </span>

            <small>
              ↑ 3% from last month
            </small>

          </div>

        </div>


        {/* FEES */}

        <div className="dashboard-kpi fees">

          <div className="kpi-icon">
            ₹
          </div>

          <div>

            <strong>
              {formatCurrency(
                feeCollection.totalAmount
              )}
            </strong>

            <span>
              Total Fee
            </span>

            <small>
              {feeCollection.collectionPercentage || 0}%
              {" "}collected
            </small>

          </div>

        </div>

      </div>


      {/* =========================
          MAIN GRID
      ========================= */}

      <div className="dashboard-main-grid">


        {/* =========================
            STUDENT ENROLLMENT
        ========================= */}

        <div className="dashboard-card enrollment-card">

          <div className="card-header">

            <div>

              <h2>
                📅 Student Enrollment Trend
              </h2>

              <p>
                Student growth over the last 6 months
              </p>

            </div>

            <select defaultValue="6">

              <option value="6">
                Last 6 Months
              </option>

              <option value="12">
                Last 12 Months
              </option>

            </select>

          </div>


          <div className="line-chart">

            <div className="chart-y">

              <span>3,000</span>
              <span>2,500</span>
              <span>2,000</span>
              <span>1,500</span>
              <span>1,000</span>
              <span>500</span>
              <span>0</span>

            </div>


            <div className="chart-content">

              <div className="chart-grid-lines">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>


              <svg
                className="enrollment-svg"
                viewBox="0 0 700 250"
                preserveAspectRatio="none"
              >

                <defs>

                  <linearGradient
                    id="studentGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >

                    <stop
                      offset="0%"
                      stopColor="#1976e8"
                      stopOpacity="0.25"
                    />

                    <stop
                      offset="100%"
                      stopColor="#1976e8"
                      stopOpacity="0"
                    />

                  </linearGradient>

                </defs>


                <path
                  d="
                    M 0 150
                    L 140 125
                    L 280 102
                    L 420 80
                    L 560 57
                    L 700 35
                    L 700 250
                    L 0 250
                    Z
                  "
                  fill="url(#studentGradient)"
                />


                <polyline
                  points="
                    0,150
                    140,125
                    280,102
                    420,80
                    560,57
                    700,35
                  "
                  fill="none"
                  stroke="#1479e8"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />


                {[
                  [0, 150],
                  [140, 125],
                  [280, 102],
                  [420, 80],
                  [560, 57],
                  [700, 35],
                ].map(([x, y], index) => (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="6"
                    fill="#ffffff"
                    stroke="#1479e8"
                    strokeWidth="4"
                  />
                ))}

              </svg>


              <div className="chart-months">

                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Aug</span>

              </div>

            </div>

          </div>

        </div>


        {/* =========================
            DEPARTMENT DONUT
        ========================= */}

        <div className="dashboard-card department-card">

          <div className="card-header">

            <div>

              <h2>
                🏢 Department-wise Students
              </h2>

              <p>
                Distribution of students
              </p>

            </div>

          </div>


          <div className="department-content">


            <div className="donut-wrapper">

              <div
                className="donut-chart"
                style={{
                  background: departmentGradient,
                }}
              >

                <div>

                  <strong>
                    {totalStudents.toLocaleString()}
                  </strong>

                  <span>
                    Students
                  </span>

                </div>

              </div>

            </div>


            <div className="department-legend">

              {departmentPercentages.length > 0 ? (

                departmentPercentages.map(
                  (department) => (

                    <div
                      key={
                        department.departmentId ||
                        department.departmentCode ||
                        department.departmentName
                      }
                    >

                      <i
                        className={
                          department.color
                        }
                      />

                      <span>
                        {department.departmentCode ||
                          department.departmentName ||
                          "Unknown"}
                      </span>

                      <strong>
                        {department.percentage}%
                      </strong>

                    </div>

                  )
                )

              ) : (

                <div className="department-empty">

                  <span>
                    No department data available
                  </span>

                </div>

              )}

            </div>

          </div>

        </div>


        {/* =========================
            ATTENDANCE OVERVIEW
        ========================= */}

        <div className="dashboard-card attendance-card">

          <div className="card-header">

            <div>
              <h2>
                📊 Attendance Overview
              </h2>

              <p>
                Overall student attendance
              </p>
            </div>

          </div>

          <div className="attendance-overview">

            <div
              className="attendance-circle"
              style={{
                background: `conic-gradient(#16a765 ${attendancePercentage}%, #e5e7eb ${attendancePercentage}% 100%)`,
              }}
            >

              <div>
                <strong>
                  {attendancePercentage}%
                </strong>

                <span>
                  Attendance
                </span>
              </div>

            </div>

            <div className="attendance-stats">

              <div className="attendance-stat">

                <span className="attendance-dot present-dot" />

                <div>
                  <strong>
                    {attendancePresent.toLocaleString()}
                  </strong>

                  <span>
                    Present
                  </span>
                </div>

              </div>

              <div className="attendance-stat">

                <span className="attendance-dot absent-dot" />

                <div>
                  <strong>
                    {attendanceAbsent.toLocaleString()}
                  </strong>

                  <span>
                    Absent
                  </span>
                </div>

              </div>

              <div className="attendance-stat">

                <span className="attendance-dot total-dot" />

                <div>
                  <strong>
                    {attendanceTotal.toLocaleString()}
                  </strong>

                  <span>
                    Total Records
                  </span>
                </div>

              </div>

            </div>

          </div>

        </div>


        {/* =========================
            LEAVE SUMMARY
        ========================= */}

        <div className="dashboard-card leave-summary-card">

          <div className="card-header">

            <div>
              <h2>
                📝 Leave Summary
              </h2>

              <p>
                Leave request status overview
              </p>
            </div>

          </div>

          <div className="leave-summary-grid">

            <div className="leave-summary-stat">
              <span className="leave-summary-dot pending-dot" />
              <div>
                <strong>
                  {leavePending.toLocaleString()}
                </strong>
                <span>Pending</span>
              </div>
            </div>

            <div className="leave-summary-stat">
              <span className="leave-summary-dot approved-dot" />
              <div>
                <strong>
                  {leaveApproved.toLocaleString()}
                </strong>
                <span>Approved</span>
              </div>
            </div>

            <div className="leave-summary-stat">
              <span className="leave-summary-dot rejected-dot" />
              <div>
                <strong>
                  {leaveRejected.toLocaleString()}
                </strong>
                <span>Rejected</span>
              </div>
            </div>

            <div className="leave-summary-stat">
              <span className="leave-summary-dot total-leave-dot" />
              <div>
                <strong>
                  {leaveTotal.toLocaleString()}
                </strong>
                <span>Total Requests</span>
              </div>
            </div>

          </div>

        </div>


        {/* =========================
            ASSIGNMENT SUMMARY
        ========================= */}

        <div className="dashboard-card assignment-summary-card">

          <div className="card-header">

            <div>
              <h2>
                📚 Assignment Summary
              </h2>

              <p>
                Assignment status overview
              </p>
            </div>

          </div>

          <div className="assignment-summary-grid">

            <div className="assignment-summary-stat">
              <span className="assignment-summary-dot active-assignment-dot" />
              <div>
                <strong>
                  {assignmentActive.toLocaleString()}
                </strong>
                <span>Active</span>
              </div>
            </div>

            <div className="assignment-summary-stat">
              <span className="assignment-summary-dot closed-assignment-dot" />
              <div>
                <strong>
                  {assignmentClosed.toLocaleString()}
                </strong>
                <span>Closed</span>
              </div>
            </div>

            <div className="assignment-summary-stat">
              <span className="assignment-summary-dot total-assignment-dot" />
              <div>
                <strong>
                  {assignmentTotal.toLocaleString()}
                </strong>
                <span>Total Assignments</span>
              </div>
            </div>

          </div>

        </div>


        {/* =========================
            RESULT SUMMARY
        ========================= */}

        <div className="dashboard-card leave-summary-card">

          <div className="card-header">

            <div>
              <h2>
                📊 Result Summary
              </h2>

              <p>
                Published result overview
              </p>
            </div>

          </div>

          <div className="leave-summary-grid">

            <div className="leave-summary-stat">
              <span className="leave-summary-dot approved-dot" />
              <div>
                <strong>
                  {publishedResults.toLocaleString()}
                </strong>
                <span>Published</span>
              </div>
            </div>

            <div className="leave-summary-stat">
              <span className="leave-summary-dot rejected-dot" />
              <div>
                <strong>
                  {unpublishedResults.toLocaleString()}
                </strong>
                <span>Unpublished</span>
              </div>
            </div>

            <div className="leave-summary-stat">
              <span className="leave-summary-dot total-leave-dot" />
              <div>
                <strong>
                  {totalResults.toLocaleString()}
                </strong>
                <span>Total Results</span>
              </div>
            </div>

          </div>

        </div>


        {/* =========================
            EXAM SUMMARY
        ========================= */}

        <div className="dashboard-card leave-summary-card">

          <div className="card-header">

            <div>
              <h2>
                📝 Exam Summary
              </h2>

              <p>
                Exams grouped by type
              </p>
            </div>

          </div>

          <div className="leave-summary-grid">

            {examTypeCounts.map((item) => (
              <div className="leave-summary-stat" key={item.type}>
                <span className="leave-summary-dot approved-dot" />
                <div>
                  <strong>
                    {item.count.toLocaleString()}
                  </strong>
                  <span>
                    {item.type
                      .split("-")
                      .map(
                        (word) =>
                          word.charAt(0).toUpperCase() +
                          word.slice(1)
                      )
                      .join(" ")}
                  </span>
                </div>
              </div>
            ))}

            <div className="leave-summary-stat">
              <span className="leave-summary-dot total-leave-dot" />
              <div>
                <strong>
                  {totalExamsFromSummary.toLocaleString()}
                </strong>
                <span>Total Exams</span>
              </div>
            </div>

          </div>

        </div>


        {/* =========================
            RECENT RESULTS
        ========================= */}

        <div className="dashboard-card recent-results-card">

          <div className="card-header">

            <div>
              <h2>
                👥 Recent Results
              </h2>

              <p>
                Latest student result records
              </p>
            </div>

          </div>

          <div className="results-list">

            {recentResults.length > 0 ? (
              recentResults.map((result) => (
                <div className="result-item" key={result._id}>

                  <div>
                    <strong>
                      {result.student?.studentId ||
                        result.student?.rollNumber ||
                        "Student"}
                    </strong>

                    <span>
                      {result.subject?.name ||
                        result.subject?.code ||
                        "Subject"}
                    </span>
                  </div>

                  <div>
                    <strong>
                      {result.marksObtained ?? "-"}
                      {result.totalMarks != null
                        ? ` / ${result.totalMarks}`
                        : ""}
                    </strong>

                    <span>
                      {result.grade || result.examType || "Result"}
                    </span>
                  </div>

                </div>
              ))
            ) : (
              <div className="result-item">
                <div>
                  <strong>No recent results</strong>
                  <span>No result records available.</span>
                </div>
              </div>
            )}

          </div>

        </div>


        {/* =========================
            RECENT ACTIVITIES
        ========================= */}

        <div className="dashboard-card activity-card">

          <div className="card-header">

            <h2>
              🔔 Recent Activities
            </h2>

            <button
              onClick={() =>
                navigate("/admin/analytics")
              }
            >
              View All
            </button>

          </div>


         <div className="activity-list">

  {recentActivities.length > 0 ? (

    recentActivities.map((activity) => (

      <div
        className="activity-row"
        key={activity.id}
      >

        <div
          className={`activity-icon ${activity.iconClass}`}
        >
          {activity.icon}
        </div>

        <div>

          <strong>
            {activity.title}
          </strong>

          <span>
            {activity.description}
          </span>

        </div>

        <time>
          {formatActivityTime(activity.date)}
        </time>

      </div>

    ))

  ) : (

    <div className="activity-row">

      <div className="activity-icon blue-icon">
        ℹ️
      </div>

      <div>

        <strong>
          No recent activities
        </strong>

        <span>
          There are no recent activities to display.
        </span>

      </div>

    </div>

  )}

</div>

        </div>


        {/* =========================
            QUICK ACTIONS
        ========================= */}

        <div className="dashboard-card quick-actions-card">

          <div className="card-header">

            <h2>
              ⚡ Quick Actions
            </h2>

          </div>


          <div className="quick-actions">


            <button
              onClick={() =>
                navigate("/admin/students")
              }
            >

              <span>
                👤+
              </span>

              <strong>
                Add Student
              </strong>

            </button>


            <button
              onClick={() =>
                navigate("/admin/faculty")
              }
            >

              <span>
                👨‍🏫
              </span>

              <strong>
                Add Faculty
              </strong>

            </button>


            <button
              onClick={() =>
                navigate("/admin/departments")
              }
            >

              <span>
                🏢
              </span>

              <strong>
                Manage Departments
              </strong>

            </button>


            <button
              onClick={() =>
                navigate("/admin/subjects")
              }
            >

              <span>
                📚
              </span>

              <strong>
                Manage Subjects
              </strong>

            </button>


            <button
              onClick={() =>
                navigate("/admin/fees")
              }
            >

              <span>
                💰
              </span>

              <strong>
                Fee Management
              </strong>

            </button>


            <button
              onClick={() =>
                navigate("/admin/complaints")
              }
            >

              <span>
                💬
              </span>

              <strong>
                View Complaints
              </strong>

            </button>


            <button
              onClick={() =>
                navigate("/admin/analytics")
              }
            >

              <span>
                📊
              </span>

              <strong>
                Generate Reports
              </strong>

            </button>


            <button>

              <span>
                ⚙️
              </span>

              <strong>
                System Settings
              </strong>

            </button>


          </div>

        </div>


        {/* =========================
            FEES OVERVIEW
        ========================= */}

        <div className="dashboard-card fees-card">

          <div className="card-header">

            <div>

              <h2>
                💳 Fees Overview
              </h2>

              <p>
                Overall fee collection
              </p>

            </div>

          </div>


          <div className="fee-chart">


            {/* TOTAL FEE */}

            <div className="fee-column">

              <div
                className="fee-bar tuition"
                style={{
                  height: `${
                    feeTotal > 0
                      ? Math.max(
                          20,
                          (feeTotal /
                            Math.max(
                              feeTotal,
                              feePaid
                            )) *
                            145
                        )
                      : 20
                  }px`,
                }}
              />

              <span>
                Total Fee
              </span>

              <strong>
                {formatCurrency(feeTotal)}
              </strong>

            </div>


            {/* COLLECTED */}

            <div className="fee-column">

              <div
                className="fee-bar hostel"
                style={{
                  height: `${
                    feeTotal > 0
                      ? Math.max(
                          20,
                          (feePaid / feeTotal) *
                            145
                        )
                      : 20
                  }px`,
                }}
              />

              <span>
                Collected
              </span>

              <strong>
                {formatCurrency(feePaid)}
              </strong>

            </div>


            {/* PENDING */}

            <div className="fee-column">

              <div
                className="fee-bar library"
                style={{
                  height: `${
                    feeTotal > 0
                      ? Math.max(
                          20,
                          (feePending / feeTotal) *
                            145
                        )
                      : 20
                  }px`,
                }}
              />

              <span>
                Pending
              </span>

              <strong>
                {formatCurrency(feePending)}
              </strong>

            </div>


          </div>


          <div className="fee-total">

            <div>
              ₹
            </div>

            <span>

              <strong>
                {formatCurrency(feePaid)}
              </strong>

              Total Collection

            </span>

            <b>
              {feeCollection.collectionPercentage || 0}%
            </b>

          </div>

        </div>


        {/* =========================
            UPCOMING EVENTS
        ========================= */}

        <div className="dashboard-card events-card">

          <div className="card-header">

            <h2>
              📅 Upcoming Events
            </h2>

            <button>
              View All
            </button>

          </div>


         <div className="events-list">

  {upcomingExams.length > 0 ? (

    upcomingExams.slice(0, 5).map((exam) => {

      const eventDate = formatEventDate(
        exam.date
      );

      return (
        <div
          className="event-item"
          key={exam._id}
        >

          <div className="event-date">

            <strong>
              {eventDate.month}
            </strong>

            <span>
              {eventDate.day}
            </span>

          </div>


          <div>

            <strong>
              {exam.name ||
                exam.title ||
                exam.examName ||
                exam.subject?.name ||
                "Upcoming Examination"}
            </strong>

            <span>
              {exam.examType
                ? `${exam.examType} • `
                : ""}
              {eventDate.fullDate}
            </span>

          </div>

        </div>
      );
    })

  ) : (

    <div className="event-item">

      <div className="event-date">
        <strong>
          --
        </strong>

        <span>
          --
        </span>
      </div>

      <div>

        <strong>
          No upcoming exams
        </strong>

        <span>
          There are no upcoming events available.
        </span>

      </div>

    </div>

  )}



        </div>


      </div>

      </div>

      {/* =========================
          FOOTER
      ========================= */}

      <div className="dashboard-footer">

        <div>

          🎓 <strong>
            SmartCampus
          </strong>

          <span>
            |
          </span>

          Empowering Education Through Technology

        </div>


        <div>

          v1.0.0

          <span>
            |
          </span>

          Gandhi Engineering College

        </div>

      </div>


    </div>
  );
};

export default AdminDashboard;
