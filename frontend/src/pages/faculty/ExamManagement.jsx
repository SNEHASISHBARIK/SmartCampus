
import { useEffect, useMemo, useState } from "react";
import DatePickerInput from "../../components/DatePickerInput";
import TimePickerInput from "../../components/TimePickerInput";
import api from "../../services/api";
import "./ExamManagement.css";

const INITIAL_FORM = {
  title: "",
  subject: "",
  semester: "",
  examType: "internal",
  date: "",
  startTime: "",
  endTime: "",
  room: "",
  totalMarks: 100,
  instructions: "",
};

const EXAM_TYPES = [
  { value: "internal", label: "Internal" },
  { value: "midterm", label: "Midterm" },
  { value: "end-semester", label: "End Semester" },
  { value: "practical", label: "Practical" },
];

const formatDate = (date) => {
  if (!date) return "—";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const getExamStatus = (exam) => {
  const date = exam.date ? new Date(exam.date) : null;

  if (exam.status) {
    const status = String(exam.status).toLowerCase();
    if (["completed", "closed", "cancelled"].includes(status)) {
      return status === "closed" ? "Closed" : status === "cancelled" ? "Cancelled" : "Completed";
    }
  }

  if (!date || Number.isNaN(date.getTime())) return "Scheduled";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const examDay = new Date(date);
  examDay.setHours(0, 0, 0, 0);

  return examDay < today ? "Completed" : "Upcoming";
};

const getAcademicYear = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const startYear = date.getMonth() >= 3 ? year : year - 1;
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
};

const ExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [refreshingSubjects, setRefreshingSubjects] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchSubjectsOnly = async () => {
    try {
      setRefreshingSubjects(true);
      const res = await api.get("/faculty/subjects");
      if (Array.isArray(res.data?.subjects)) {
        setSubjects(res.data.subjects);
      }
    } catch (err) {
      console.warn("Refresh subjects error:", err);
    } finally {
      setRefreshingSubjects(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [examResponse, dashboardResponse, subjectsResponse] = await Promise.all([
        api.get("/exams"),
        api.get("/faculty/dashboard"),
        api.get("/faculty/subjects").catch((err) => {
          console.warn("Faculty subjects API fallback:", err);
          return null;
        }),
      ]);

      const examsData = examResponse.data?.exams || [];
      const dashboard = dashboardResponse.data?.dashboard || {};
      const subjectsData =
        subjectsResponse?.data?.subjects || dashboard.subjects || [];

      setExams(Array.isArray(examsData) ? examsData : []);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
    } catch (err) {
      console.error("Fetch exams error:", err);
      setError(err.response?.data?.message || "Failed to load exams.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const upcoming = exams.filter(
      (exam) => getExamStatus(exam) === "Upcoming"
    ).length;

    const completed = exams.filter(
      (exam) => getExamStatus(exam) === "Completed"
    ).length;

    const scheduled = exams.filter(
      (exam) => getExamStatus(exam) === "Scheduled"
    ).length;

    const assignedCount = subjects.filter((s) => s.isAssigned).length;

    return {
      total: exams.length,
      upcoming,
      completed,
      scheduled,
      subjects: subjects.length,
      assignedSubjects: assignedCount,
    };
  }, [exams, subjects]);

  const academicYears = useMemo(() => {
    return [
      ...new Set(exams.map((exam) => getAcademicYear(exam.date)).filter(Boolean)),
    ].sort((a, b) => b.localeCompare(a));
  }, [exams]);

  const filteredExams = useMemo(() => {
    const query = search.trim().toLowerCase();

    return exams.filter((exam) => {
      const subjectId = exam.subject?._id || exam.subject || "";
      const subjectName = exam.subject?.name || "";
      const subjectCode = exam.subject?.code || "";
      const examStatus = getExamStatus(exam);
      const academicYear = getAcademicYear(exam.date);

      const matchesSearch =
        !query ||
        [exam.title, subjectName, subjectCode, exam.examType, exam.room]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesSubject =
        subjectFilter === "all" || String(subjectId) === subjectFilter;

      const matchesType =
        typeFilter === "all" ||
        String(exam.examType || "").toLowerCase() === typeFilter;

      const matchesStatus =
        statusFilter === "all" ||
        examStatus.toLowerCase() === statusFilter;

      const matchesYear =
        yearFilter === "all" || academicYear === yearFilter;

      return (
        matchesSearch &&
        matchesSubject &&
        matchesType &&
        matchesStatus &&
        matchesYear
      );
    });
  }, [exams, search, subjectFilter, typeFilter, statusFilter, yearFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredExams.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleExams = filteredExams.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [search, subjectFilter, typeFilter, statusFilter, yearFilter, pageSize]);

  const resetFilters = () => {
    setSearch("");
    setSubjectFilter("all");
    setTypeFilter("all");
    setStatusFilter("all");
    setYearFilter("all");
    setPage(1);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "subject") {
      const selectedSubject = subjects.find(
        (subject) => subject._id === value
      );

      setFormData((previous) => ({
        ...previous,
        subject: value,
        semester: selectedSubject?.semester || "",
      }));
      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setEditingId(null);
    setFormOpen(false);
  };

  const openCreateForm = () => {
    setError("");
    setSuccess("");
    setFormData(INITIAL_FORM);
    setEditingId(null);
    setFormOpen(true);
  };

  const handleEdit = (exam) => {
    setEditingId(exam._id);
    setFormData({
      title: exam.title || "",
      subject: exam.subject?._id || exam.subject || "",
      semester: exam.semester || "",
      examType: exam.examType || "internal",
      date: exam.date ? String(exam.date).substring(0, 10) : "",
      startTime: exam.startTime || "",
      endTime: exam.endTime || "",
      room: exam.room || "",
      totalMarks: exam.totalMarks ?? 100,
      instructions: exam.instructions || "",
    });

    setError("");
    setSuccess("");
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      !formData.title.trim() ||
      !formData.subject ||
      !formData.semester ||
      !formData.examType ||
      !formData.date ||
      !formData.startTime ||
      !formData.endTime ||
      Number(formData.totalMarks) < 1
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (formData.endTime <= formData.startTime) {
      setError("End time must be later than start time.");
      return;
    }

    const payload = {
      title: formData.title.trim(),
      subject: formData.subject,
      semester: Number(formData.semester),
      examType: formData.examType,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      room: formData.room.trim(),
      totalMarks: Number(formData.totalMarks),
      instructions: formData.instructions.trim(),
    };

    try {
      setSubmitting(true);

      if (editingId) {
        await api.put(`/exams/${editingId}`, payload);
        setSuccess("Exam updated successfully.");
      } else {
        await api.post("/exams", payload);
        setSuccess("Exam created successfully.");
      }

      resetForm();
      await fetchData();
    } catch (err) {
      console.error("Save exam error:", err);
      setError(err.response?.data?.message || "Failed to save exam.");
    } finally {
      setSubmitting(false);
    }
  };

  const upcomingExams = useMemo(() => {
    return exams
      .filter((exam) => getExamStatus(exam) === "Upcoming")
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 4);
  }, [exams]);

  const typeCounts = useMemo(() => {
    return EXAM_TYPES.map((type) => ({
      ...type,
      count: exams.filter(
        (exam) =>
          String(exam.examType || "").toLowerCase() === type.value
      ).length,
    })).filter((type) => type.count > 0);
  }, [exams]);

  const maxTypeCount = Math.max(1, ...typeCounts.map((item) => item.count));

  if (loading) {
    return (
      <div className="exam-loading">
        <span className="exam-spinner" />
        <p>Loading examination management...</p>
      </div>
    );
  }

  return (
    <main className="exam-page">
      <header className="exam-page-heading">
        <div>
          <div className="exam-breadcrumb">
            <span>⌂</span>
            <span>Dashboard</span>
            <span className="exam-breadcrumb-chevron">›</span>
            <strong>Exams</strong>
          </div>
          <h1>Examination Management</h1>
          <p>Create, schedule, and manage internal and external examinations.</p>
        </div>

        <div className="exam-heading-actions">
          <button
            type="button"
            className="exam-secondary-button"
            onClick={async () => {
              await Promise.all([fetchData(), fetchSubjectsOnly()]);
            }}
            title="Refresh exams and subjects"
            disabled={refreshingSubjects}
          >
            <span className={`exam-refresh-icon ${refreshingSubjects ? "spinning" : ""}`}>↻</span> Refresh All
          </button>
          <button className="exam-primary-button" onClick={openCreateForm}>
            <span className="exam-plus">＋</span> Create Exam
          </button>
        </div>
      </header>

      {error && (
        <div className="exam-alert exam-alert-error" role="alert">
          <span>!</span>
          <p>{error}</p>
          <button onClick={() => setError("")} aria-label="Dismiss error">×</button>
        </div>
      )}

      {success && (
        <div className="exam-alert exam-alert-success" role="status">
          <span>✓</span>
          <p>{success}</p>
          <button onClick={() => setSuccess("")} aria-label="Dismiss message">×</button>
        </div>
      )}

      <section className="exam-stats-grid">
        <article className="exam-stat-card">
          <div className="exam-stat-icon exam-stat-blue">▤</div>
          <div className="exam-stat-copy">
            <strong>{stats.total}</strong>
            <span>Total Exams</span>
            <small>All scheduled exams</small>
          </div>
        </article>

        <article className="exam-stat-card">
          <div className="exam-stat-icon exam-stat-red">▦</div>
          <div className="exam-stat-copy">
            <strong>{stats.upcoming}</strong>
            <span>Upcoming Exams</span>
            <small>Future exam dates</small>
          </div>
        </article>

        <article className="exam-stat-card">
          <div className="exam-stat-icon exam-stat-green">✓</div>
          <div className="exam-stat-copy">
            <strong>{stats.completed}</strong>
            <span>Completed Exams</span>
            <small>Past exam dates</small>
          </div>
        </article>

        <article className="exam-stat-card">
          <div className="exam-stat-icon exam-stat-purple">▥</div>
          <div className="exam-stat-copy">
            <strong>{stats.subjects}</strong>
            <span>Available Subjects</span>
            <small>
              {stats.assignedSubjects} assigned · {Math.max(0, stats.subjects - stats.assignedSubjects)} other
            </small>
          </div>
        </article>
      </section>

      <section className="exam-filter-panel">
        <div className="exam-filter-field">
          <div className="exam-filter-label-row">
            <label htmlFor="exam-subject-filter">Filter Subject</label>
            <button
              type="button"
              className="exam-refresh-link"
              onClick={fetchSubjectsOnly}
              title="Refresh subjects list from backend"
              disabled={refreshingSubjects}
            >
              <span className={`exam-refresh-icon ${refreshingSubjects ? "spinning" : ""}`}>↻</span> Refresh
            </button>
          </div>
          <select
            id="exam-subject-filter"
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
          >
            <option value="all">All Subjects ({subjects.length})</option>
            {subjects.map((subject) => {
              const semText = subject.semester ? `Sem ${subject.semester}` : "";
              const deptCode =
                subject.department?.code ||
                (typeof subject.department === "string" ? subject.department : "");
              const tag = subject.isAssigned ? " [Assigned]" : "";
              return (
                <option key={subject._id} value={subject._id}>
                  {subject.name} {subject.code ? `(${subject.code})` : ""}
                  {semText ? ` · ${semText}` : ""}
                  {deptCode ? ` · ${deptCode}` : ""}
                  {tag}
                </option>
              );
            })}
          </select>
        </div>

        <div className="exam-filter-field">
          <label htmlFor="exam-type-filter">Select Exam Type</label>
          <select
            id="exam-type-filter"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="all">All Types</option>
            {EXAM_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div className="exam-filter-field">
          <label htmlFor="exam-status-filter">Select Status</label>
          <select
            id="exam-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="exam-filter-field">
          <label htmlFor="exam-year-filter">Academic Year</label>
          <select
            id="exam-year-filter"
            value={yearFilter}
            onChange={(event) => setYearFilter(event.target.value)}
          >
            <option value="all">All Years</option>
            {academicYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="exam-search-field">
          <label htmlFor="exam-search">Search Exams</label>
          <div className="exam-search-box">
            <span>⌕</span>
            <input
              id="exam-search"
              type="search"
              placeholder="Search exams, subjects..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <button className="exam-filter-reset" onClick={resetFilters}>
          ↻ Reset
        </button>
      </section>

      {formOpen && (
        <section className="exam-form-panel" id="exam-form">
          <div className="exam-panel-heading">
            <div>
              <h2>{editingId ? "Update Exam" : "Create Exam"}</h2>
              <p>Enter the examination details below.</p>
            </div>
            <button
              type="button"
              className="exam-close-button"
              onClick={resetForm}
              aria-label="Close form"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="exam-form-grid">
            <div className="exam-form-field exam-form-title">
              <label htmlFor="exam-title">Exam Title *</label>
              <input
                id="exam-title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter exam title"
                required
              />
            </div>

            <div className="exam-form-field">
              <div className="exam-filter-label-row">
                <label htmlFor="exam-subject">Subject *</label>
                <button
                  type="button"
                  className="exam-refresh-link"
                  onClick={fetchSubjectsOnly}
                  title="Reload new subjects from backend"
                  disabled={refreshingSubjects}
                >
                  <span className={`exam-refresh-icon ${refreshingSubjects ? "spinning" : ""}`}>↻</span> Refresh Subjects
                </button>
              </div>
              <select
                id="exam-subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select Subject ({subjects.length} Available)
                </option>
                {subjects.map((subject) => {
                  const deptCode =
                    subject.department?.code ||
                    (typeof subject.department === "string"
                      ? subject.department
                      : "");
                  const semText = subject.semester ? `Sem ${subject.semester}` : "";
                  const badge = [semText, deptCode].filter(Boolean).join(" · ");
                  const tag = subject.isAssigned
                    ? "Assigned"
                    : subject.isDepartment
                    ? "Dept"
                    : "";
                  const labelTag = tag ? ` [${tag}]` : "";

                  return (
                    <option key={subject._id} value={subject._id}>
                      {subject.name} {subject.code ? `(${subject.code})` : ""}
                      {badge ? ` — ${badge}` : ""}
                      {labelTag}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="exam-form-field">
              <label htmlFor="exam-semester">Semester *</label>
              <input
                id="exam-semester"
                name="semester"
                type="number"
                value={formData.semester}
                readOnly
                placeholder="Select a subject first"
                required
              />
            </div>

            <div className="exam-form-field">
              <label htmlFor="exam-type">Exam Type *</label>
              <select
                id="exam-type"
                name="examType"
                value={formData.examType}
                onChange={handleChange}
                required
              >
                {EXAM_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="exam-form-field">
              <label htmlFor="exam-date">Date *</label>
              <DatePickerInput
                id="exam-date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="exam-form-field">
              <label htmlFor="exam-start-time">Start Time *</label>
              <TimePickerInput
                id="exam-start-time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="exam-form-field">
              <label htmlFor="exam-end-time">End Time *</label>
              <TimePickerInput
                id="exam-end-time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="exam-form-field">
              <label htmlFor="exam-room">Room</label>
              <input
                id="exam-room"
                name="room"
                value={formData.room}
                onChange={handleChange}
                placeholder="Room 301"
              />
            </div>

            <div className="exam-form-field">
              <label htmlFor="exam-total-marks">Total Marks *</label>
              <input
                id="exam-total-marks"
                name="totalMarks"
                type="number"
                min="1"
                value={formData.totalMarks}
                onChange={handleChange}
                required
              />
            </div>

            <div className="exam-form-field exam-form-instructions">
              <label htmlFor="exam-instructions">Instructions</label>
              <textarea
                id="exam-instructions"
                name="instructions"
                rows="3"
                value={formData.instructions}
                onChange={handleChange}
                placeholder="Enter exam instructions"
              />
            </div>

            <div className="exam-form-actions">
              <button
                type="button"
                className="exam-secondary-button"
                onClick={resetForm}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="exam-primary-button"
                disabled={submitting}
              >
                {submitting
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Create Exam"}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="exam-content-layout">
        <section className="exam-table-panel">
          <div className="exam-panel-heading">
            <div>
              <h2>Exams List</h2>
              <p>
                Showing {filteredExams.length ? (currentPage - 1) * pageSize + 1 : 0}
                {"–"}
                {Math.min(currentPage * pageSize, filteredExams.length)} of{" "}
                {filteredExams.length} exams
              </p>
            </div>
            <button
              className="exam-secondary-button"
              onClick={fetchData}
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>

          <div className="exam-table-scroll">
            <table className="exam-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Exam Title</th>
                  <th>Subject</th>
                  <th>Type</th>
                  <th>Date &amp; Time</th>
                  <th>Duration</th>
                  <th>Total Marks</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleExams.map((exam, index) => {
                  const status = getExamStatus(exam);
                  const subjectName = exam.subject?.name || "—";
                  const subjectCode = exam.subject?.code || "";
                  const start = exam.startTime || "";
                  const end = exam.endTime || "";

                  return (
                    <tr key={exam._id}>
                      <td>{(currentPage - 1) * pageSize + index + 1}</td>
                      <td>
                        <div className="exam-title-cell">
                          <strong>{exam.title || "Untitled Exam"}</strong>
                          <small>{exam.room || "Room not specified"}</small>
                        </div>
                      </td>
                      <td>
                        <div className="exam-subject-cell">
                          <strong>{subjectName}</strong>
                          <div className="exam-subject-sub">
                            {subjectCode && <span className="exam-subject-code">{subjectCode}</span>}
                            {exam.semester && <span className="exam-sem-badge">Sem {exam.semester}</span>}
                            {exam.isAssigned ? (
                              <span className="exam-assigned-tag">Assigned</span>
                            ) : exam.isDepartment ? (
                              <span className="exam-dept-tag">Dept</span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`exam-type-badge exam-type-${String(exam.examType || "").toLowerCase().replace(/[^a-z0-9]/g, "")}`}>
                          {EXAM_TYPES.find((item) => item.value === exam.examType)?.label || exam.examType || "—"}
                        </span>
                      </td>
                      <td>
                        <div className="exam-date-cell">
                          <strong>{formatDate(exam.date)}</strong>
                          <small>{start || "—"}{end ? ` – ${end}` : ""}</small>
                        </div>
                      </td>
                      <td>{start && end ? `${start} – ${end}` : "—"}</td>
                      <td><strong>{exam.totalMarks ?? "—"}</strong></td>
                      <td>
                        <span className={`exam-status-badge exam-status-${status.toLowerCase()}`}>
                          {status}
                        </span>
                      </td>
                      <td>
                        <div className="exam-row-actions">
                          <button
                            type="button"
                            className="exam-action-button"
                            title="View exam details"
                            aria-label={`View ${exam.title}`}
                            onClick={() => {
                              setSuccess(
                                `${exam.title}: ${subjectName}, ${formatDate(exam.date)}, ${exam.totalMarks ?? "—"} total marks.`
                              );
                              setError("");
                            }}
                          >
                            ◉
                          </button>
                          <button
                            type="button"
                            className="exam-action-button"
                            title="Edit exam"
                            aria-label={`Edit ${exam.title}`}
                            onClick={() => handleEdit(exam)}
                          >
                            ✎
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {visibleExams.length === 0 && (
                  <tr>
                    <td colSpan="9" className="exam-empty-cell">
                      <span>▤</span>
                      <strong>No exams found</strong>
                      <p>Try changing your filters or create a new exam.</p>
                      <button className="exam-primary-button" onClick={openCreateForm}>
                        ＋ Create Exam
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="exam-table-footer">
            <label className="exam-page-size">
              Show
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              entries
            </label>

            <div className="exam-pagination">
              <button
                disabled={currentPage <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                aria-label="Previous page"
              >
                ‹
              </button>
              <span>Page <strong>{currentPage}</strong> of {totalPages}</span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          </div>
        </section>

        <aside className="exam-sidebar-widgets">
          <section className="exam-widget">
            <div className="exam-widget-heading">
              <div>
                <h2>Exam Analytics</h2>
                <p>Overview of your exams</p>
              </div>
              <span className="exam-widget-icon">▥</span>
            </div>

            <div className="exam-analytics-legend">
              <span><i className="exam-dot exam-dot-blue" />Upcoming</span>
              <strong>{stats.upcoming}</strong>
              <span><i className="exam-dot exam-dot-green" />Completed</span>
              <strong>{stats.completed}</strong>
              <span><i className="exam-dot exam-dot-orange" />Scheduled</span>
              <strong>{stats.scheduled}</strong>
            </div>

            <div className="exam-bar-chart" aria-label="Exam status chart">
              {[
                { label: "Upcoming", count: stats.upcoming, className: "blue" },
                { label: "Completed", count: stats.completed, className: "green" },
                { label: "Scheduled", count: stats.scheduled, className: "orange" },
              ].map((item) => (
                <div className="exam-bar-column" key={item.label}>
                  <strong>{item.count}</strong>
                  <div className="exam-bar-track">
                    <span
                      className={`exam-bar-fill exam-bar-${item.className}`}
                      style={{
                        height: `${Math.max(5, (item.count / Math.max(1, stats.total)) * 100)}%`,
                      }}
                    />
                  </div>
                  <small>{item.label}</small>
                </div>
              ))}
            </div>
            <p className="exam-widget-footnote">
              Status is based on available exam dates and stored status values.
            </p>
          </section>

          <section className="exam-widget">
            <div className="exam-widget-heading">
              <div>
                <h2>Exam Types</h2>
                <p>Distribution by exam type</p>
              </div>
            </div>

            {typeCounts.length ? (
              <div className="exam-type-distribution">
                {typeCounts.map((item, index) => (
                  <div className="exam-type-row" key={item.value}>
                    <span className={`exam-type-dot exam-type-dot-${index % 4}`} />
                    <span className="exam-type-row-name">{item.label}</span>
                    <div className="exam-type-progress">
                      <span style={{ width: `${(item.count / maxTypeCount) * 100}%` }} />
                    </div>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="exam-widget-empty">No exam type data available yet.</p>
            )}

            <div className="exam-total-summary">
              <span>Total exams</span>
              <strong>{stats.total}</strong>
            </div>
          </section>

          <section className="exam-widget">
            <div className="exam-widget-heading">
              <div>
                <h2>Quick Actions</h2>
                <p>Common examination tasks</p>
              </div>
            </div>

            <div className="exam-quick-actions">
              <button className="exam-quick-action quick-blue" onClick={openCreateForm}>
                <span>＋</span>
                <strong>Create Exam</strong>
              </button>
              <button
                className="exam-quick-action quick-orange"
                onClick={() => {
                  setStatusFilter("upcoming");
                  setSuccess("");
                  setError("");
                }}
              >
                <span>▦</span>
                <strong>Exam Schedule</strong>
              </button>
            </div>
          </section>

          <section className="exam-widget">
            <div className="exam-widget-heading">
              <div>
                <h2>Upcoming Exams</h2>
                <p>Next scheduled exam dates</p>
              </div>
              <button
                className="exam-view-all"
                onClick={() => {
                  setStatusFilter("upcoming");
                  setSearch("");
                  setSubjectFilter("all");
                  setTypeFilter("all");
                  setYearFilter("all");
                }}
              >
                View All →
              </button>
            </div>

            {upcomingExams.length ? (
              <div className="exam-upcoming-list">
                {upcomingExams.map((exam) => (
                  <button
                    className="exam-upcoming-item"
                    key={exam._id}
                    onClick={() => handleEdit(exam)}
                  >
                    <span className="exam-upcoming-icon">▦</span>
                    <span className="exam-upcoming-copy">
                      <strong>{exam.title}</strong>
                      <small>
                        {exam.subject?.name || "Subject"} · {formatDate(exam.date)}
                      </small>
                    </span>
                    <span className="exam-upcoming-arrow">›</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="exam-widget-empty">No upcoming exams found.</p>
            )}
          </section>
        </aside>
      </div>

      <footer className="exam-page-footer">
        <div className="exam-footer-brand">
          <span>◆</span>
          <strong>SmartCampus</strong>
        </div>
        <span className="exam-footer-divider" />
        <span>Empowering Education Through Technology</span>
        <span className="exam-footer-right">Faculty Portal</span>
      </footer>
    </main>
  );
};

export default ExamManagement;
