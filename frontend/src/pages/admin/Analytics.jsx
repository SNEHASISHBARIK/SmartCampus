import { useEffect, useMemo, useState } from "react";

import api from "../../services/api";

import {

  FiUsers,

  FiUserCheck,

  FiHome,

  FiBookOpen,

  FiDollarSign,

  FiCalendar,

  FiChevronDown,

  FiFileText,

  FiMessageSquare,

  FiBarChart2,

  FiCheckCircle,

  FiClock,

  FiAlertCircle,

} from "react-icons/fi";

import "./Analytics.css";

const Analytics = () => {

  const [analytics, setAnalytics] = useState({});

  const [, setError] = useState("");

  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("Overview");

  useEffect(() => {

    fetchAnalytics();

  }, []);

  const fetchAnalytics = async () => {

    try {

      const response = await api.get("/analytics/dashboard");

      const data = response.data;

      setAnalytics(
        data.dashboard ||
          data.analytics ||
          data.statistics ||
          {}
      );
      setError("");

    } catch (error) {

      console.error("Failed to load analytics:", error);

    } finally {

      setLoading(false);

    }

  };

  const stats = useMemo(

    () => ({

      students: analytics.statistics?.totalStudents || 0,

      faculty: analytics.statistics?.totalFaculty || 0,

      departments: analytics.statistics?.totalDepartments || 0,

      subjects: analytics.statistics?.totalSubjects || 0,

      fees: analytics.statistics?.totalFees || 0,

      assignments: analytics.statistics?.totalAssignments || 0,

      exams: analytics.statistics?.totalExams || 0,

      results: analytics.statistics?.totalResults || 0,

      attendance: analytics.statistics?.totalAttendanceRecords || 0,

      complaints: analytics.statistics?.totalComplaints || 0,

      leaves: analytics.statistics?.totalLeaves || 0,

      notices: analytics.statistics?.totalNotices || 0,

    }),

    [analytics]

  );

  if (loading) {

    return (

      <div className="analytics-page">

        <div className="analytics-loading">

          Loading SmartCampus Analytics...

        </div>

      </div>

    );

  }

  return (

    <div className="analytics-page">

      {/* ================= MAIN ================= */}

      <main className="analytics-main">

        {/* Breadcrumb */}

        <div className="analytics-breadcrumb">

          <span>⌂</span>

          <span>Dashboard</span>

          <b>›</b>

          <strong>Analytics</strong>

        </div>

        {/* Heading */}

        <div className="analytics-heading">

          <div>

            <h1>Analytics</h1>

            <p>

              Insights and reports to help you make better decisions for

              your campus.

            </p>

          </div>

          <button className="date-filter">

            <FiCalendar />

            1 Jan 2026 - 6 Oct 2026

            <FiChevronDown />

          </button>

        </div>

        {/* Tabs */}

        <div className="analytics-tabs">

          {[

            "Overview",

            "Students",

            "Faculty",

            "Academics",

            "Fees",

            "Complaints",

            "Placements",

          ].map((tab) => (

            <button

              key={tab}

              className={activeTab === tab ? "active" : ""}

              onClick={() => setActiveTab(tab)}

            >

              {tab}

            </button>

          ))}

        </div>

        {/* ================= STAT CARDS ================= */}

        <section className="analytics-stat-grid">

          <StatCard

            icon={<FiUsers />}

            title="Total Students"

            value={stats.students}

            color="blue"

            growth="5% from last semester"

          />

          <StatCard

            icon={<FiUserCheck />}

            title="Total Faculty"

            value={stats.faculty}

            color="green"

            growth="3% from last semester"

          />

          <StatCard

            icon={<FiHome />}

            title="Departments"

            value={stats.departments}

            color="orange"

            growth="No change"

          />

          <StatCard

            icon={<FiBookOpen />}

            title="Subjects"

            value={stats.subjects}

            color="purple"

            growth="4% from last semester"

          />

          <StatCard

            icon={<FiDollarSign />}

            title="Fee Collection"

            value={`₹${Number(stats.fees).toLocaleString("en-IN")}`}

            color="red"

            growth="12% from last semester"

          />

        </section>

        {/* ================= FIRST ROW ================= */}

        <section className="analytics-chart-grid">

          <ChartCard title="Student Enrollment Trend">

            <EnrollmentChart students={stats.students} />

          </ChartCard>

          <ChartCard title="Department-wise Students">

            <DepartmentChart
              total={stats.students}
              data={analytics.studentsByDepartment || []}
            />

          </ChartCard>

          <ChartCard title="Fee Collection Trend">

            <FeeChart data={analytics.feeSummary || []} />

          </ChartCard>

        </section>

        {/* ================= SECOND ROW ================= */}

        <section className="analytics-chart-grid">

          <ChartCard title="Student Status Distribution">

            <DonutChart

              value={stats.students}

              label="Students"

              items={[

                ["Active", 91, "green"],

                ["On Leave", 4, "orange"],

                ["Suspended", 2, "red"],

                ["Graduated", 3, "purple"],

              ]}

            />

          </ChartCard>

          <ChartCard title="Complaints Analysis">

            <DonutChart

              value={stats.complaints}

              label="Complaints"

              items={[

                [

                  "Resolved",

                  analytics.statistics?.resolvedComplaints || 0,

                  "green",

                ],

                [

                  "In Progress",

                  analytics.statistics?.inProgressComplaints || 0,

                  "blue",

                ],

                [

                  "Pending",

                  analytics.statistics?.pendingComplaints || 0,

                  "orange",

                ],

                ["Rejected", analytics.statistics?.rejectedComplaints || 0, "red"],

              ]}

            />

          </ChartCard>

          <ChartCard title="Faculty Workload">

            <FacultyWorkloadChart total={stats.faculty} />

          </ChartCard>

        </section>

        {/* ================= THIRD ROW ================= */}

        <section className="analytics-bottom-grid">

          {/* Top Departments */}

          <div className="analytics-panel">

            <div className="panel-title">

              <h3>Top Performing Departments</h3>

            </div>

            <table className="performance-table">

              <thead>

                <tr>

                  <th>#</th>

                  <th>Department</th>

                  <th>Pass %</th>

                  <th>Avg. CGPA</th>

                </tr>

              </thead>

              <tbody>

                <tr>

                  <td>1</td>

                  <td>CSE</td>

                  <td>92%</td>

                  <td>8.4</td>

                </tr>

                <tr>

                  <td>2</td>

                  <td>ECE</td>

                  <td>89%</td>

                  <td>8.1</td>

                </tr>

                <tr>

                  <td>3</td>

                  <td>IT</td>

                  <td>87%</td>

                  <td>7.9</td>

                </tr>

                <tr>

                  <td>4</td>

                  <td>ME</td>

                  <td>84%</td>

                  <td>7.6</td>

                </tr>

                <tr>

                  <td>5</td>

                  <td>CE</td>

                  <td>82%</td>

                  <td>7.4</td>

                </tr>

              </tbody>

            </table>

          </div>

          {/* Recent Activities */}

          <div className="analytics-panel">

            <div className="panel-title">

              <h3>Recent Activities</h3>

            </div>

            <div className="activities">

              <Activity

                color="blue"

                text="New student admission"

                time="10 min ago"

              />

              <Activity

                color="green"

                text="Fee payment received"

                time="1 hour ago"

              />

              <Activity

                color="orange"

                text="New complaint raised"

                time="2 hours ago"

              />

              <Activity

                color="purple"

                text="Faculty added"

                time="5 hours ago"

              />

              <Activity

                color="gray"

                text="Subject updated"

                time="1 day ago"

              />

            </div>

          </div>

          {/* Quick Reports */}

          <div className="analytics-panel">

            <div className="panel-title quick-title">

              <h3>Quick Reports</h3>

              <span>View All</span>

            </div>

            <Report

              icon={<FiUsers />}

              title="Student Summary Report"

              subtitle="Complete student statistics"

            />

            <Report

              icon={<FiDollarSign />}

              title="Fee Collection Report"

              subtitle="Monthly and department-wise"

            />

            <Report

              icon={<FiMessageSquare />}

              title="Complaints Report"

              subtitle="Category-wise analysis"

            />

            <Report

              icon={<FiUserCheck />}

              title="Faculty Workload Report"

              subtitle="Subject and department-wise"

            />

          </div>

        </section>

        {/* ================= FOOTER ================= */}

        <footer className="analytics-footer">

          <div>

            <span className="footer-cap">🎓</span>

            <strong>SmartCampus</strong>

            <span>|</span>

            <span>Empowering Education Through Technology</span>

          </div>

          <div>

            <span>v1.0.0</span>

            <span>|</span>

            <span>Gandhi Engineering College</span>

          </div>

        </footer>

      </main>

    </div>

  );

};

/* =========================================================

   STAT CARD

   ========================================================= */

const StatCard = ({ icon, title, value, color, growth }) => {

  return (

    <div className="analytics-stat-card">

      <div className={`analytics-stat-icon ${color}`}>

        {icon}

      </div>

      <div>

        <span>{title}</span>

        <strong>{value}</strong>

        <small>

          ↑ {growth}

        </small>

      </div>

    </div>

  );

};

/* =========================================================

   CHART CARD

   ========================================================= */

const ChartCard = ({ title, children }) => {

  return (

    <div className="analytics-chart-card">

      <div className="analytics-chart-title">

        <h3>{title}</h3>

      </div>

      {children}

    </div>

  );

};

/* =========================================================

   ENROLLMENT CHART

   ========================================================= */

const EnrollmentChart = ({ students }) => {

  const value = students || 0;

  return (

    <div className="line-chart">

      <div className="line-y-axis">

        <span>3200</span>

        <span>2400</span>

        <span>1600</span>

        <span>800</span>

        <span>0</span>

      </div>

      <div className="line-chart-area">

        <svg viewBox="0 0 600 210" preserveAspectRatio="none">

          <polyline

            points="0,160 75,145 150,130 225,115 300,100 375,85 450,70 525,55 600,45"

            fill="none"

            stroke="currentColor"

            strokeWidth="4"

          />

          <polyline

            points="0,190 75,192 150,184 225,176 300,160 375,170 450,166 525,165 600,158"

            fill="none"

            stroke="currentColor"

            strokeWidth="3"

            opacity="0.35"

          />

        </svg>

        <div className="chart-tooltip">

          Aug 2026

          <br />

          <strong>Total: {value}</strong>

        </div>

        <div className="chart-months">

          <span>Jan</span>

          <span>Feb</span>

          <span>Mar</span>

          <span>Apr</span>

          <span>May</span>

          <span>Jun</span>

          <span>Jul</span>

          <span>Aug</span>

          <span>Sep</span>

        </div>

      </div>

    </div>

  );

};

/* =========================================================

   DEPARTMENT CHART

   ========================================================= */

const DepartmentChart = ({ total, data }) => {
  const departments = data.map((department) => ({
    name:
      department.departmentCode ||
      department.departmentName ||
      "Other",
    value: Number(department.totalStudents || 0),
  }));

  const maxValue = Math.max(
    ...departments.map((department) => department.value),
    1
  );

  return (
    <div className="department-chart">
      {departments.length > 0 ? (
        departments.map((department) => (
          <div
            className="department-column"
            key={department.name}
          >
            <strong>{department.value}</strong>

            <div
              className="department-bar"
              style={{
                height: `${Math.max(
                  25,
                  (department.value / maxValue) * 150
                )}px`,
              }}
            />

            <span>{department.name}</span>
          </div>
        ))
      ) : (
        <p>No department data available.</p>
      )}
    </div>
  );
};

/* =========================================================

   FEE CHART

   ========================================================= */

const FeeChart = ({ data }) => {
  const statuses = [
    { key: "paid", label: "Paid" },
    { key: "partial", label: "Partial" },
    { key: "pending", label: "Pending" },
    { key: "overdue", label: "Overdue" },
  ];

  const values = statuses.map((status) => {
    const item = data.find(
      (entry) => entry._id === status.key
    );

    return {
      label: status.label,
      amount: Number(item?.totalAmount ?? 0),
    };
  });

  const maxValue = Math.max(
    ...values.map((item) => item.amount),
    1
  );

  return (
    <div className="fee-chart">
      {values.map((item) => (
        <div className="fee-column" key={item.label}>
          <div
            className="fee-bar"
            style={{
              height: `${Math.max(
                10,
                (item.amount / maxValue) * 140
              )}px`,
            }}
            title={`₹${item.amount.toLocaleString("en-IN")}`}
          />

          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

/* =========================================================

   DONUT CHART

   ========================================================= */

const DonutChart = ({ value, label, items }) => {

  return (

    <div className="donut-container">

      <div className="donut-chart">

        <div>

          <strong>{value}</strong>

          <span>{label}</span>

        </div>

      </div>

      <div className="donut-list">

        {items.map(([name, number, color]) => (

          <div key={name}>

            <span className={`legend-dot ${color}`} />

            <span>{name}</span>

            <strong>{number}%</strong>

          </div>

        ))}

      </div>

    </div>

  );

};

/* =========================================================

   FACULTY WORKLOAD

   ========================================================= */

const FacultyWorkloadChart = ({ total }) => {

  const data = [

    ["CSE", 42, 38],

    ["ECE", 36, 32],

    ["ME", 28, 24],

    ["CE", 24, 20],

    ["EE", 22, 18],

    ["IT", 18, 14],

    ["MCA", 6, 5],

  ];

  return (

    <div className="workload-chart">

      {data.map(([name, faculty, assigned]) => (

        <div className="workload-group" key={name}>

          <div className="workload-bars">

            <span style={{ height: `${faculty * 2}px` }} />

            <span style={{ height: `${assigned * 2}px` }} />

          </div>

          <label>{name}</label>

        </div>

      ))}

    </div>

  );

};

/* =========================================================

   ACTIVITY

   ========================================================= */

const Activity = ({ color, text, time }) => {

  return (

    <div className="activity-item">

      <span className={`activity-dot ${color}`} />

      <div>

        <strong>{text}</strong>

        <small>{time}</small>

      </div>

    </div>

  );

};

/* =========================================================

   REPORT

   ========================================================= */

const Report = ({ icon, title, subtitle }) => {

  return (

    <div className="report-item">

      <div className="report-icon">{icon}</div>

      <div className="report-text">

        <strong>{title}</strong>

        <small>{subtitle}</small>

      </div>

      <button>Generate</button>

    </div>

  );

};

export default Analytics;