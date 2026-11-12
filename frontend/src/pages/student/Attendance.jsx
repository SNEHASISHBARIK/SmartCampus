import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiBookOpen,
  FiCalendar,
  FiCheck,
  FiClock,
  FiTrendingUp,
  FiX,
} from "react-icons/fi";
import api from "../../services/api";
import "./Attendance.css";

const STATUS_LABELS = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  leave: "Leave",
};

const getDateKey = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDate = (value, options = {}) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        ...options,
      });
};

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState("");
  const [showAllRecords, setShowAllRecords] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchAttendance = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/students/attendance");
        if (!active) return;
        setAttendance(response.data?.attendance || []);
        setSummary(response.data?.summary || null);
      } catch (requestError) {
        if (!active) return;
        console.error("Student attendance error:", requestError);
        setError(
          requestError.response?.data?.message ||
            "Unable to load your attendance records."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchAttendance();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const sortedAttendance = useMemo(
    () =>
      [...attendance].sort(
        (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
      ),
    [attendance]
  );

  const counts = useMemo(() => {
    const total = summary?.total ?? attendance.length;
    const present =
      summary?.present ??
      attendance.filter((record) => record.status === "present").length;
    const absent =
      summary?.absent ??
      attendance.filter((record) => record.status === "absent").length;
    const late =
      summary?.late ??
      attendance.filter((record) => record.status === "late").length;
    const leave = attendance.filter((record) => record.status === "leave").length;
    const percentage =
      summary?.percentage ??
      (total ? Number(((present / total) * 100).toFixed(1)) : 0);

    return { total, present, absent, late, leave, percentage };
  }, [attendance, summary]);

  const subjectRows = useMemo(() => {
    const subjects = new Map();
    attendance.forEach((record) => {
      const id = record.subject?._id || record.subject?.code || "unknown";
      const subject = subjects.get(id) || {
        id,
        name: record.subject?.name || record.subject?.code || "Unknown subject",
        code: record.subject?.code || "",
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
      };
      subject.total += 1;
      if (record.status === "present") subject.present += 1;
      if (record.status === "absent") subject.absent += 1;
      if (record.status === "late") subject.late += 1;
      if (record.status === "leave") subject.leave += 1;
      subjects.set(id, subject);
    });

    return [...subjects.values()]
      .map((subject) => ({
        ...subject,
        percentage: subject.total
          ? Math.round((subject.present / subject.total) * 100)
          : 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [attendance]);

  const monthData = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const recordsByDay = new Map();

    attendance.forEach((record) => {
      const key = getDateKey(record.date);
      if (!key.startsWith(`${year}-${String(month + 1).padStart(2, "0")}-`)) {
        return;
      }
      const dayRecords = recordsByDay.get(key) || [];
      dayRecords.push(record);
      recordsByDay.set(key, dayRecords);
    });

    return {
      year,
      month,
      firstWeekday,
      daysInMonth,
      recordsByDay,
    };
  }, [attendance, calendarMonth]);

  const trendData = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    currentWeekStart.setHours(0, 0, 0, 0);

    return Array.from({ length: 8 }, (_, index) => {
      const start = new Date(currentWeekStart);
      start.setDate(currentWeekStart.getDate() - (7 - index) * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      const weekRecords = attendance.filter((record) => {
        const date = new Date(record.date);
        return !Number.isNaN(date.getTime()) && date >= start && date < end;
      });
      const present = weekRecords.filter(
        (record) => record.status === "present"
      ).length;

      return {
        label: `Week ${index + 1}`,
        percentage: weekRecords.length
          ? Math.round((present / weekRecords.length) * 100)
          : 0,
        total: weekRecords.length,
      };
    });
  }, [attendance]);

  const displayedRecords = useMemo(() => {
    const filtered = selectedDate
      ? sortedAttendance.filter((record) => getDateKey(record.date) === selectedDate)
      : sortedAttendance;
    return showAllRecords ? filtered : filtered.slice(0, 6);
  }, [selectedDate, showAllRecords, sortedAttendance]);

  if (loading) {
    return (
      <div className="student-attendance-state">
        <span className="student-attendance-spinner" />
        <p>Loading your attendance...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-attendance-state student-attendance-error">
        <FiAlertCircle />
        <h2>{error}</h2>
        <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
          Try again
        </button>
      </div>
    );
  }

  const monthTitle = calendarMonth.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  const todayKey = getDateKey(new Date());
  const days = [
    ...Array(monthData.firstWeekday).fill(null),
    ...Array.from({ length: monthData.daysInMonth }, (_, index) => index + 1),
  ];

  return (
    <div className="student-attendance-page">
      <header className="student-attendance-heading">
        <div>
          <div className="student-attendance-breadcrumb">
            <Link to="/student">Dashboard</Link>
            <span>›</span>
            <strong>Attendance</strong>
          </div>
          <h1>Attendance</h1>
          <p>Track your class attendance and stay on top of your academic progress.</p>
        </div>
        <time>{formatDate(new Date(), { weekday: "short" })}</time>
      </header>

      <section className="student-attendance-stats">
        <StatCard
          icon={<FiCheck />}
          title="Overall Attendance"
          value={`${counts.percentage}%`}
          note={counts.percentage >= 75 ? "Good attendance" : "Below required 75%"}
          color="green"
        />
        <StatCard
          icon={<FiBookOpen />}
          title="Total Classes"
          value={counts.total}
          note="Recorded this semester"
          color="blue"
        />
        <StatCard
          icon={<FiCheck />}
          title="Classes Attended"
          value={counts.present}
          note="Marked present"
          color="mint"
        />
        <StatCard
          icon={<FiX />}
          title="Classes Missed"
          value={counts.absent}
          note="Marked absent"
          color="red"
        />
      </section>

      <section className="student-attendance-main-grid">
        <article className="student-attendance-card student-calendar-card">
          <CardHeading icon={<FiCalendar />} title="Attendance Calendar">
            <div className="student-calendar-controls">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() =>
                  setCalendarMonth(
                    (month) =>
                      new Date(month.getFullYear(), month.getMonth() - 1, 1)
                  )
                }
              >
                <FiArrowLeft />
              </button>
              <strong>{monthTitle}</strong>
              <button
                type="button"
                aria-label="Next month"
                onClick={() =>
                  setCalendarMonth(
                    (month) =>
                      new Date(month.getFullYear(), month.getMonth() + 1, 1)
                  )
                }
              >
                <FiArrowRight />
              </button>
            </div>
          </CardHeading>
          <div className="student-calendar-layout">
            <div className="student-calendar">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <span className="student-calendar-weekday" key={day}>{day}</span>
              ))}
              {days.map((day, index) => {
                if (!day) {
                  return <span className="student-calendar-blank" key={`blank-${index}`} />;
                }
                const key = `${monthData.year}-${String(monthData.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayRecords = monthData.recordsByDay.get(key) || [];
                const statuses = [...new Set(dayRecords.map((record) => record.status))];
                const isSelected = selectedDate === key;
                return (
                  <button
                    className={`student-calendar-day${key === todayKey ? " is-today" : ""}${isSelected ? " is-selected" : ""}${statuses.length ? " has-record" : ""}`}
                    type="button"
                    key={key}
                    onClick={() => setSelectedDate(isSelected ? "" : key)}
                    aria-label={`${monthTitle} ${day}${statuses.length ? `, ${statuses.map((status) => STATUS_LABELS[status] || status).join(", ")}` : ", no attendance recorded"}`}
                    aria-pressed={isSelected}
                  >
                    <span>{day}</span>
                    {statuses.length > 0 && (
                      <i className={`attendance-day-marker marker-${statuses[0]}`} />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="student-calendar-legend">
              {Object.entries(STATUS_LABELS).map(([status, label]) => (
                <span key={status}>
                  <i className={`marker-${status}`} />{label}
                </span>
              ))}
              <span><i className="marker-today" />Today</span>
            </div>
          </div>
          {selectedDate && (
            <button
              className="student-calendar-clear"
              type="button"
              onClick={() => setSelectedDate("")}
            >
              Clear selected date
            </button>
          )}
        </article>

        <article className="student-attendance-card student-subject-attendance-card">
          <CardHeading
            icon={<FiBookOpen />}
            title="Subject-wise Attendance"
          >
            <span className="student-attendance-table-caption">
              {subjectRows.length} subjects
            </span>
          </CardHeading>
          {subjectRows.length ? (
            <div className="student-attendance-table-wrap">
              <table className="student-attendance-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Present</th>
                    <th>Total</th>
                    <th>Percentage</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectRows.map((subject) => {
                    const status =
                      subject.percentage >= 90
                        ? "Excellent"
                        : subject.percentage >= 75
                          ? "Good"
                          : "Low";
                    return (
                      <tr key={subject.id}>
                        <td>
                          <strong>{subject.name}</strong>
                          {subject.code && <small>{subject.code}</small>}
                        </td>
                        <td>{subject.present}</td>
                        <td>{subject.total}</td>
                        <td>{subject.percentage}%</td>
                        <td>
                          <span className={`student-attendance-quality ${status.toLowerCase()}`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="No subject attendance records yet." />
          )}
        </article>
      </section>

      <section className="student-attendance-bottom-grid">
        <article className="student-attendance-card student-recent-records-card">
          <CardHeading icon={<FiClock />} title="Recent Attendance Records">
            <button
              className="student-attendance-view-all"
              type="button"
              onClick={() => setShowAllRecords((value) => !value)}
              disabled={sortedAttendance.length <= 6 && !selectedDate}
            >
              {showAllRecords ? "Show Less" : "View All"}
              <FiArrowRight />
            </button>
          </CardHeading>
          {selectedDate && (
            <div className="student-record-filter">
              Showing records for {formatDate(`${selectedDate}T12:00:00`)}
              <button type="button" onClick={() => setSelectedDate("")}>Clear</button>
            </div>
          )}
          {displayedRecords.length ? (
            <div className="student-attendance-table-wrap">
              <table className="student-attendance-table student-recent-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Time / Period</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRecords.map((record) => (
                    <tr key={record._id}>
                      <td>{formatDate(record.date)}</td>
                      <td>{record.subject?.name || record.subject?.code || "Unknown subject"}</td>
                      <td>{record.period || "—"}</td>
                      <td>
                        <span className={`student-attendance-status status-${record.status}`}>
                          <i />
                          {STATUS_LABELS[record.status] || record.status || "Unknown"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              message={
                selectedDate
                  ? "No attendance records on the selected date."
                  : "No attendance records found."
              }
            />
          )}
        </article>

        <article className="student-attendance-card student-trend-card">
          <CardHeading icon={<FiTrendingUp />} title="Attendance Trend">
            <span className="student-attendance-table-caption">Last 8 Weeks</span>
          </CardHeading>
          <div className="student-attendance-chart">
            <div className="student-chart-axis">
              {[100, 75, 50, 25, 0].map((value) => (
                <span key={value}>{value}%</span>
              ))}
            </div>
            <div className="student-chart-bars">
              {[100, 75, 50, 25, 0].map((value) => (
                <i
                  className="student-chart-line"
                  style={{ bottom: `${value}%` }}
                  key={value}
                />
              ))}
              {trendData.map((week) => (
                <div className="student-trend-bar-column" key={week.label}>
                  <strong>{week.total ? `${week.percentage}%` : "—"}</strong>
                  <div className="student-trend-bar-track">
                    {week.total > 0 && (
                      <i style={{ height: `${week.percentage}%` }} />
                    )}
                  </div>
                  <span>{week.label.replace("Week ", "W")}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="student-trend-note">
            Based on attendance records available from the backend.
          </p>
        </article>
      </section>

      <footer className="student-attendance-footer">
        <span><FiCheck /></span>
        <strong>“Consistent attendance builds a stronger future.”</strong>
        <small>— SmartCampus</small>
      </footer>
    </div>
  );
};

const StatCard = ({ icon, title, value, note, color }) => (
  <article className="student-attendance-stat-card">
    <span className={`student-attendance-stat-icon ${color}`}>{icon}</span>
    <div>
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  </article>
);

const CardHeading = ({ icon, title, action, children }) => (
  <header className="student-attendance-card-heading">
    <div>
      <span>{icon}</span>
      <h2>{title}</h2>
    </div>
    {action || children}
  </header>
);

const EmptyState = ({ message }) => (
  <div className="student-attendance-empty">
    <FiCalendar />
    <span>{message}</span>
  </div>
);

export default Attendance;
