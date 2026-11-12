import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiRefreshCw,
  FiSearch,
  FiX,
} from "react-icons/fi";
import api from "../../services/api";
import "./Exams.css";

const TABS = [
  ["upcoming", "Upcoming"],
  ["all", "All Exams"],
  ["past", "Past Exams"],
];

const TYPE_LABELS = {
  internal: "Internal",
  midterm: "Midterm",
  "end-semester": "End Semester",
  practical: "Practical",
};

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const formatDate = (value, options = {}) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        ...options,
      });
};

const isUpcoming = (exam) => {
  const date = new Date(exam.date);
  return (
    !Number.isNaN(date.getTime()) &&
    date >= startOfToday() &&
    !["completed", "closed", "cancelled"].includes(
      String(exam.status || "").toLowerCase()
    )
  );
};

const getExamStatus = (exam) => {
  if (["completed", "closed", "cancelled"].includes(String(exam.status || "").toLowerCase())) {
    return String(exam.status);
  }
  return isUpcoming(exam) ? "Upcoming" : "Completed";
};

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [search, setSearch] = useState("");
  const [selectedExam, setSelectedExam] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchExams = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/students/exams", {
          signal: controller.signal,
        });
        if (!Array.isArray(response.data?.exams)) {
          throw new Error("Exams response has an invalid format.");
        }
        setExams(response.data.exams);
        setStudent(response.data.student || null);
      } catch (requestError) {
        if (requestError.code === "ERR_CANCELED") return;
        console.error("Student exams error:", requestError);
        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Unable to load the exam schedule."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchExams();
    return () => controller.abort();
  }, [reloadKey]);

  const stats = useMemo(
    () => ({
      total: exams.length,
      upcoming: exams.filter(isUpcoming).length,
      completed: exams.filter(
        (exam) => !isUpcoming(exam) && !["cancelled", "closed"].includes(String(exam.status || "").toLowerCase())
      ).length,
    }),
    [exams]
  );

  const visibleExams = useMemo(() => {
    const query = search.trim().toLowerCase();
    return exams
      .filter((exam) => {
        if (activeTab === "upcoming" && !isUpcoming(exam)) return false;
        if (activeTab === "past" && isUpcoming(exam)) return false;
        if (!query) return true;
        return [
          exam.title,
          exam.subject?.name,
          exam.subject?.code,
          exam.examType,
          exam.room,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      })
      .sort((left, right) => new Date(left.date) - new Date(right.date));
  }, [activeTab, exams, search]);

  return (
    <div className="student-exams-page">
      <div className="student-exams-breadcrumb">
        <Link to="/student">Dashboard</Link>
        <span aria-hidden="true">›</span>
        <strong>Exams</strong>
      </div>

      <header className="student-exams-heading">
        <div>
          <h1>Exam Schedule</h1>
          <p>Keep track of your upcoming examinations and plan ahead.</p>
        </div>
        {student?.semester && (
          <span className="student-exams-semester">Semester {student.semester}</span>
        )}
      </header>

      <section className="student-exams-stats" aria-label="Exam summary">
        <StatCard icon={<FiCalendar />} tone="blue" label="Total Exams" value={loading ? "—" : stats.total} />
        <StatCard icon={<FiClock />} tone="orange" label="Upcoming" value={loading ? "—" : stats.upcoming} />
        <StatCard icon={<FiCheckCircle />} tone="green" label="Completed" value={loading ? "—" : stats.completed} />
      </section>

      <section className="student-exams-panel">
        <div className="student-exams-toolbar">
          <div className="student-exams-tabs" role="tablist" aria-label="Exam schedule">
            {TABS.map(([value, label]) => (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === value}
                className={activeTab === value ? "active" : ""}
                key={value}
                onClick={() => setActiveTab(value)}
              >
                {label}
                <span>
                  {value === "upcoming"
                    ? stats.upcoming
                    : value === "past"
                      ? stats.total - stats.upcoming
                      : stats.total}
                </span>
              </button>
            ))}
          </div>
          <label className="student-exams-search">
            <FiSearch aria-hidden="true" />
            <span className="sr-only">Search exams</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search exams..."
            />
          </label>
        </div>

        {loading ? (
          <div className="student-exams-state" role="status">Loading your exam schedule…</div>
        ) : error ? (
          <div className="student-exams-state error" role="alert">
            <FiAlertCircle aria-hidden="true" />
            <strong>Exams could not be loaded</strong>
            <span>{error}</span>
            <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
              <FiRefreshCw aria-hidden="true" /> Try again
            </button>
          </div>
        ) : visibleExams.length ? (
          <div className="student-exams-grid">
            {visibleExams.map((exam) => {
              const status = getExamStatus(exam);
              const date = new Date(exam.date);
              const validDate = !Number.isNaN(date.getTime());
              return (
                <article className={`student-exam-card ${status.toLowerCase()}`} key={exam._id}>
                  <div className="student-exam-date-block">
                    <strong>{validDate ? date.toLocaleDateString("en-IN", { day: "2-digit" }) : "—"}</strong>
                    <span>{validDate ? date.toLocaleDateString("en-IN", { month: "short" }) : "TBD"}</span>
                    <small>{validDate ? date.getFullYear() : ""}</small>
                  </div>
                  <div className="student-exam-card-content">
                    <div className="student-exam-title-line">
                      <span className={`student-exam-type ${exam.examType || "other"}`}>
                        {TYPE_LABELS[exam.examType] || "Exam"}
                      </span>
                      <span className={`student-exam-status ${status.toLowerCase().replace(/\s+/g, "-")}`}>
                        {status}
                      </span>
                    </div>
                    <h2>{exam.title}</h2>
                    <p className="student-exam-subject">
                      {exam.subject?.name || "Subject unavailable"}
                      {exam.subject?.code && <span> · {exam.subject.code}</span>}
                    </p>
                    <div className="student-exam-meta">
                      <span><FiClock aria-hidden="true" /> {exam.startTime || "Time TBD"}{exam.endTime ? ` – ${exam.endTime}` : ""}</span>
                      {exam.room && <span><FiMapPin aria-hidden="true" /> {exam.room}</span>}
                      {exam.totalMarks !== null && exam.totalMarks !== undefined && (
                        <span><FiBookOpen aria-hidden="true" /> {exam.totalMarks} marks</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="student-exam-details-button"
                      onClick={() => setSelectedExam(exam)}
                    >
                      View details
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="student-exams-state">
            <FiCalendar aria-hidden="true" />
            <strong>
              {search
                ? "No matching exams"
                : activeTab === "upcoming"
                  ? "No upcoming exams"
                  : activeTab === "past"
                    ? "No past exams"
                    : "No exams scheduled"}
            </strong>
            <span>
              {search
                ? "Try a different title, subject, or exam type."
                : "Exam schedules for your current semester will appear here when published."}
            </span>
            {search && (
              <button type="button" onClick={() => setSearch("")}>Clear search</button>
            )}
          </div>
        )}
      </section>

      <footer className="student-exams-footer">
        <FiBookOpen aria-hidden="true" />
        <span>Prepare consistently. Do your best.</span>
        <em>— SmartCampus</em>
      </footer>

      {selectedExam && (
        <div
          className="student-exam-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedExam(null);
          }}
        >
          <section
            className="student-exam-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-exam-modal-title"
          >
            <header>
              <div>
                <span className={`student-exam-type ${selectedExam.examType || "other"}`}>
                  {TYPE_LABELS[selectedExam.examType] || "Exam"}
                </span>
                <h2 id="student-exam-modal-title">{selectedExam.title}</h2>
              </div>
              <button type="button" aria-label="Close exam details" onClick={() => setSelectedExam(null)}>
                <FiX aria-hidden="true" />
              </button>
            </header>
            <div className="student-exam-detail-grid">
              <Detail label="Subject" value={selectedExam.subject?.name || "Subject unavailable"} />
              <Detail label="Subject code" value={selectedExam.subject?.code || "—"} />
              <Detail label="Date" value={formatDate(selectedExam.date, { weekday: "long" })} />
              <Detail label="Time" value={`${selectedExam.startTime || "TBD"}${selectedExam.endTime ? ` – ${selectedExam.endTime}` : ""}`} />
              <Detail label="Room" value={selectedExam.room || "Not announced"} />
              <Detail label="Total marks" value={selectedExam.totalMarks ?? "—"} />
              <Detail label="Status" value={getExamStatus(selectedExam)} />
            </div>
            {selectedExam.instructions && (
              <div className="student-exam-instructions">
                <h3>Instructions</h3>
                <p>{selectedExam.instructions}</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, tone, label, value }) => (
  <div className="student-exam-stat-card">
    <span className={`student-exam-stat-icon ${tone}`}>{icon}</span>
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  </div>
);

const Detail = ({ label, value }) => (
  <div>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

export default Exams;
