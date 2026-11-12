import { useEffect, useMemo, useState } from "react";
import DatePickerInput from "../../components/DatePickerInput";
import api from "../../services/api";
import "./AssignmentManagement.css";

const initialForm = {
  title: "",
  description: "",
  subject: "",
  semester: "",
  dueDate: "",
  totalMarks: 100,
  attachmentUrl: "",
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const toInputDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getStatus = (assignment) => {
  if (assignment.status === "closed") return "Closed";
  if (assignment.dueDate && new Date(assignment.dueDate) < new Date()) {
    return "Overdue";
  }
  return "Active";
};

const getSubjectName = (subject) => {
  if (!subject) return "—";
  if (typeof subject === "object") return subject.name || subject.code || "Subject";
  return "Subject";
};

const getSubjectId = (subject) => {
  if (!subject) return "";
  return typeof subject === "object" ? subject._id || "" : subject;
};

function StatCard({ icon, value, label, note, tone }) {
  return (
    <article className="assignment-stat-card">
      <div className={`assignment-stat-icon ${tone}`}>{icon}</div>
      <div className="assignment-stat-content">
        <strong>{value}</strong>
        <span>{label}</span>
        <small>{note}</small>
      </div>
    </article>
  );
}

function AssignmentManagement() {
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewAssignment, setViewAssignment] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [assignmentAnalytics, setAssignmentAnalytics] = useState(null);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [submissionLoading, setSubmissionLoading] = useState(true);
  const [submissionError, setSubmissionError] = useState("");
  const [evaluatingSubmission, setEvaluatingSubmission] = useState(null);
  const [evaluationMarks, setEvaluationMarks] = useState("");
  const [evaluationFeedback, setEvaluationFeedback] = useState("");
  const [evaluationSaving, setEvaluationSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [assignmentResponse, subjectsResponse] = await Promise.all([
        api.get("/assignments"),
        api.get("/faculty/subjects").catch(() => null),
      ]);

      let subs = subjectsResponse?.data?.subjects;
      if (!subs || subs.length === 0) {
        const dashboardResponse = await api.get("/faculty/dashboard").catch(() => null);
        subs = dashboardResponse?.data?.dashboard?.subjects || [];
      }

      setAssignments(assignmentResponse.data?.assignments || []);
      setSubjects(subs);
    } catch (err) {
      console.error("Fetch assignments error:", err);
      setError(err.response?.data?.message || "Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectsOnly = async () => {
    try {
      const res = await api.get("/faculty/subjects");
      if (res.data?.subjects?.length) {
        setSubjects(res.data.subjects);
        setNotice("Subjects refreshed successfully.");
      }
    } catch (err) {
      console.error("Refresh subjects error:", err);
    }
  };

  const fetchSubmissionData = async () => {
    try {
      setSubmissionLoading(true);
      setSubmissionError("");

      const [analyticsResponse, recentResponse] = await Promise.all([
        api.get("/submissions/faculty/analytics"),
        api.get("/submissions/faculty/recent"),
      ]);

      setAssignmentAnalytics(
        analyticsResponse.data
      );

      setRecentSubmissions(
        recentResponse.data?.submissions || []
      );
    } catch (err) {
      console.error("Fetch submission data error:", err);
      setSubmissionError(
        err.response?.data?.message ||
          "Failed to load submission analysis."
      );
    } finally {
      setSubmissionLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchSubmissionData();
  }, []);

  const stats = useMemo(() => {
    const active = assignments.filter((item) => getStatus(item) === "Active").length;
    const overdue = assignments.filter((item) => getStatus(item) === "Overdue").length;
    const closed = assignments.filter((item) => getStatus(item) === "Closed").length;
    return { total: assignments.length, active, overdue, closed };
  }, [assignments]);

  const analyticsTotals = assignmentAnalytics?.totals || {};
  const analyticsAssignments = assignmentAnalytics?.assignments || [];
  const totalEligibleStudents = analyticsAssignments.reduce(
    (total, item) => total + (item.eligibleStudents || 0),
    0
  );
  const totalSubmissions = analyticsTotals.submitted || 0;
  const submissionRate = totalEligibleStudents
    ? Math.round((totalSubmissions / totalEligibleStudents) * 100)
    : 0;

  const subjectOptions = useMemo(() => {
    const byId = new Map();
    subjects.forEach((item) => {
      if (item?._id) byId.set(String(item._id), item);
    });
    assignments.forEach((item) => {
      const subject = item.subject;
      if (subject && typeof subject === "object" && subject._id) {
        const id = String(subject._id);
        byId.set(id, { ...byId.get(id), ...subject });
      }
    });
    return [...byId.values()].sort((a, b) => {
      if (Boolean(a.isAssigned) !== Boolean(b.isAssigned)) {
        return a.isAssigned ? -1 : 1;
      }
      if (Number(a.semester || 0) !== Number(b.semester || 0)) {
        return Number(a.semester || 0) - Number(b.semester || 0);
      }
      return String(a.name || a.code || "").localeCompare(String(b.name || b.code || ""));
    });
  }, [subjects, assignments]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return assignments.filter((item) => {
      const subjectName = getSubjectName(item.subject);
      const subjectCode = item.subject?.code || "";
      const matchesSearch =
        !query ||
        [item.title, item.description, subjectName, subjectCode]
          .some((value) => String(value || "").toLowerCase().includes(query));
      const matchesSubject =
        subjectFilter === "all" || getSubjectId(item.subject) === subjectFilter;
      const matchesStatus =
        statusFilter === "all" || getStatus(item).toLowerCase() === statusFilter;
      return matchesSearch && matchesSubject && matchesStatus;
    });
  }, [assignments, search, subjectFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const resetFilters = () => {
    setSearch("");
    setSubjectFilter("all");
    setStatusFilter("all");
    setPage(1);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const openCreateForm = () => {
    setError("");
    setNotice("");
    setEditingId(null);
    setForm({
      ...initialForm,
      subject: subjectOptions[0]?._id || "",
      semester: subjectOptions[0]?.semester ?? "",
    });
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setError("");
    setNotice("");
    setEditingId(item._id);
    setForm({
      title: item.title || "",
      description: item.description || "",
      subject: getSubjectId(item.subject),
      semester: item.semester ?? "",
      dueDate: toInputDate(item.dueDate),
      totalMarks: item.totalMarks ?? 100,
      attachmentUrl: item.attachmentUrl || "",
    });
    setViewAssignment(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    if (name === "subject") {
      const selected = subjectOptions.find((item) => item._id === value);
      setForm((previous) => ({
        ...previous,
        subject: value,
        semester: selected?.semester ?? "",
      }));
      return;
    }
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const saveAssignment = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.subject ||
      !form.semester ||
      !form.dueDate ||
      Number(form.totalMarks) < 1
    ) {
      setError("Please complete all required fields correctly.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      subject: form.subject,
      semester: Number(form.semester),
      dueDate: new Date(`${form.dueDate}T23:59:59`).toISOString(),
      totalMarks: Number(form.totalMarks),
      attachmentUrl: form.attachmentUrl.trim(),
    };

    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/assignments/${editingId}`, payload);
        setNotice("Assignment updated successfully.");
      } else {
        await api.post("/assignments", payload);
        setNotice("Assignment created successfully.");
      }
      closeForm();
      await fetchData();
    } catch (err) {
      console.error("Save assignment error:", err);
      setError(err.response?.data?.message || "Failed to save assignment.");
    } finally {
      setSaving(false);
    }
  };

  const deleteAssignment = async (item) => {
    if (!window.confirm(`Delete "${item.title}"? This action cannot be undone.`)) return;
    setError("");
    setNotice("");
    try {
      await api.delete(`/assignments/${item._id}`);
      if (viewAssignment?._id === item._id) setViewAssignment(null);
      setNotice("Assignment deleted successfully.");
      await fetchData();
    } catch (err) {
      console.error("Delete assignment error:", err);
      setError(err.response?.data?.message || "Failed to delete assignment.");
    }
  };

  const toggleStatus = async (item) => {
    const nextStatus = item.status === "closed" ? "active" : "closed";
    setError("");
    setNotice("");
    try {
      await api.put(`/assignments/${item._id}`, { status: nextStatus });
      setNotice(nextStatus === "closed" ? "Assignment closed." : "Assignment reopened.");
      await fetchData();
      if (viewAssignment?._id === item._id) {
        setViewAssignment((previous) => previous ? { ...previous, status: nextStatus } : null);
      }
    } catch (err) {
      console.error("Update assignment status error:", err);
      setError(err.response?.data?.message || "Failed to update assignment status.");
    }
  };

  const exportReport = () => {
    const rows = [
      ["Title", "Subject", "Semester", "Due Date", "Total Marks", "Status", "Attachment URL"],
      ...filtered.map((item) => [
        item.title,
        getSubjectName(item.subject),
        item.semester,
        formatDate(item.dueDate),
        item.totalMarks,
        getStatus(item),
        item.attachmentUrl || "",
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "assignment-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const openEvaluation = (item) => {
    setEvaluatingSubmission(item);
    setEvaluationMarks(item.marks ?? "");
    setEvaluationFeedback(item.feedback || "");
    setError("");
    setNotice("");
  };

  const saveEvaluation = async (status) => {
    if (!evaluatingSubmission) return;

    if (status === "rejected" && !evaluationFeedback.trim()) {
      setError("Please enter a reason for rejection.");
      return;
    }

    const maximumMarks = Number(
      evaluatingSubmission.assignment?.totalMarks ?? 100
    );

    if (
      status === "graded" &&
      (evaluationMarks === "" ||
        !Number.isFinite(Number(evaluationMarks)) ||
        Number(evaluationMarks) < 0 ||
        Number(evaluationMarks) > maximumMarks)
    ) {
      setError("Enter valid marks within the assignment's maximum marks.");
      return;
    }

    try {
      setEvaluationSaving(true);
      setError("");
      setNotice("");

      await api.patch(
        `/submissions/${evaluatingSubmission._id}/evaluate`,
        {
          status,
          ...(evaluationMarks !== ""
            ? { marks: Number(evaluationMarks) }
            : {}),
          feedback: evaluationFeedback.trim(),
        }
      );

      setNotice(`Submission ${status} successfully.`);
      setEvaluatingSubmission(null);
      await fetchSubmissionData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to evaluate submission."
      );
    } finally {
      setEvaluationSaving(false);
    }
  };

  const removeSubmission = async (item) => {
    const confirmed = window.confirm(
      `Delete the submission from ${item.student?.user?.name || "this student"}? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setError("");
      setNotice("");

      await api.delete(`/submissions/${item._id}`);

      setNotice("Submission deleted successfully.");
      await fetchSubmissionData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete submission."
      );
    }
  };

  if (loading) {
    return (
      <div className="assignment-page-only">
        <main className="assignment-content">
          <div className="assignment-empty">
            <h3>Loading assignments...</h3>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="assignment-page-only">
      <div className="assignment-main">
        <main className="assignment-content">
          <div className="assignment-page-heading">
            <div>
              <div className="assignment-breadcrumb">
                <span>⌂</span> Dashboard <b>›</b> <strong>Assignments</strong>
              </div>
              <h1>Assignments</h1>
              <p>Create, manage, and evaluate student assignments.</p>
            </div>
            <div className="assignment-heading-right">
              <span>{new Date().toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</span>
              <button
                type="button"
                className="assignment-reset-button"
                style={{ padding: "0.6rem 0.9rem" }}
                onClick={fetchData}
              >
                ↻ Refresh All
              </button>
              <button className="assignment-create-button" onClick={openCreateForm}>
                <span>＋</span> Create Assignment
              </button>
            </div>
          </div>

          {error && (
            <div className="assignment-notice" role="alert">
              <span>{error}</span>
              <button onClick={() => setError("")} aria-label="Dismiss error">×</button>
            </div>
          )}
          {notice && (
            <div className="assignment-notice" role="status">
              <span>{notice}</span>
              <button onClick={() => setNotice("")} aria-label="Dismiss message">×</button>
            </div>
          )}

          <section className="assignment-stats-grid">
            <StatCard icon="▤" value={stats.total} label="Total Assignments" note="From your saved assignments" tone="stat-blue" />
            <StatCard icon="✓" value={totalSubmissions} label="Submitted" note="Student submissions received" tone="stat-green" />
            <StatCard icon="◷" value={analyticsTotals.pending || 0} label="Pending" note="Expected submissions remaining" tone="stat-orange" />
            <StatCard icon="×" value={stats.overdue} label="Overdue" note="Past the due date" tone="stat-red" />
          </section>

          {showForm && (
            <section className="assignment-form-panel">
              <div className="assignment-section-heading">
                <div>
                  <h2>{editingId ? "Edit Assignment" : "Create Assignment"}</h2>
                  <p>Enter the details saved by the assignment API.</p>
                </div>
                <button className="assignment-close-button" onClick={closeForm} aria-label="Close form">×</button>
              </div>
              <form className="assignment-form-grid" onSubmit={saveAssignment}>
                <label>
                  Assignment title
                  <input name="title" value={form.title} onChange={handleFormChange} required maxLength={150} placeholder="Enter assignment title" />
                </label>
                <label>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Subject *</span>
                    <button
                      type="button"
                      onClick={fetchSubjectsOnly}
                      style={{ background: "none", border: "none", color: "#4361ee", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}
                    >
                      ↻ Refresh
                    </button>
                  </div>
                  <select name="subject" value={form.subject} onChange={handleFormChange} required>
                    <option value="">Select subject ({subjectOptions.length} available)</option>
                    {subjectOptions.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name || item.code || "Subject"} {item.code ? `(${item.code})` : ""} [Sem {item.semester ?? "?"}{item.department?.code ? ` · ${item.department.code}` : ""}]{item.isAssigned ? " · Assigned" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Semester
                  <input name="semester" type="number" value={form.semester} readOnly required />
                </label>
                <label>
                  Due date
                  <DatePickerInput name="dueDate" value={form.dueDate} onChange={handleFormChange} required />
                </label>
                <label>
                  Total marks
                  <input name="totalMarks" type="number" min="1" value={form.totalMarks} onChange={handleFormChange} required />
                </label>
                <label>
                  Attachment URL (optional)
                  <input name="attachmentUrl" type="url" value={form.attachmentUrl} onChange={handleFormChange} placeholder="https://..." />
                </label>
                <label className="assignment-form-full">
                  Description
                  <textarea name="description" value={form.description} onChange={handleFormChange} required placeholder="Describe the assignment..." rows={3} />
                </label>
                <div className="assignment-form-actions assignment-form-full">
                  <button type="button" className="assignment-reset-button" onClick={closeForm}>Cancel</button>
                  <button type="submit" className="assignment-create-button" disabled={saving}>
                    {saving ? "Saving..." : editingId ? "Save Changes" : "Create Assignment"}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="assignment-filter-panel">
            <label className="assignment-filter-field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Select Subject</span>
                <button
                  type="button"
                  onClick={fetchSubjectsOnly}
                  style={{ background: "none", border: "none", color: "#4361ee", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}
                >
                  ↻ Refresh
                </button>
              </div>
              <select value={subjectFilter} onChange={(event) => { setSubjectFilter(event.target.value); setPage(1); }}>
                <option value="all">All Subjects ({subjectOptions.length})</option>
                {subjectOptions.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name || item.code || "Subject"} {item.code ? `(${item.code})` : ""} [Sem {item.semester ?? "?"}{item.department?.code ? ` · ${item.department.code}` : ""}]
                  </option>
                ))}
              </select>
            </label>
            <label className="assignment-filter-field">
              <span>Select Status</span>
              <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="overdue">Overdue</option>
                <option value="closed">Closed</option>
              </select>
            </label>
            <label className="assignment-search-field">
              <span className="assignment-search-icon">⌕</span>
              <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search assignments..." />
            </label>
            <button type="button" className="assignment-filter-button" onClick={() => setPage(1)}>▽ Filter</button>
            <button type="button" className="assignment-reset-button" onClick={resetFilters}>↻ Reset</button>
          </section>

          <section className="assignment-dashboard-grid">
            <section className="assignment-table-card">
              <div className="assignment-section-heading assignment-table-heading">
                <div>
                  <h2>Assignment List</h2>
                  <p>Showing {filtered.length} assignment{filtered.length === 1 ? "" : "s"}</p>
                </div>
                <button className="assignment-refresh-button" onClick={fetchData}>↻ Refresh</button>
              </div>
              {filtered.length === 0 ? (
                <div className="assignment-empty">
                  <span>▤</span>
                  <h3>No assignments found</h3>
                  <p>Try another search or create an assignment.</p>
                  <button className="assignment-create-button" onClick={openCreateForm}>＋ Create Assignment</button>
                </div>
              ) : (
                <>
                  <div className="assignment-table-scroll">
                    <table className="assignment-table">
                      <thead>
                        <tr>
                          <th>#</th><th>Title</th><th>Subject</th><th>Semester</th><th>Due Date</th><th>Total Marks</th><th>Status</th><th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map((item, index) => {
                          const displayStatus = getStatus(item);
                          return (
                            <tr key={item._id}>
                              <td>{(page - 1) * pageSize + index + 1}</td>
                              <td><button className="assignment-title-link" onClick={() => setViewAssignment(item)}>{item.title}</button></td>
                              <td>{getSubjectName(item.subject)}</td>
                              <td>{item.semester ?? "—"}</td>
                              <td className="assignment-date-cell">{formatDate(item.dueDate)}</td>
                              <td>{item.totalMarks ?? 100}</td>
                              <td><span className={`assignment-status-pill status-${displayStatus.toLowerCase()}`}>{displayStatus}</span></td>
                              <td>
                                <div className="assignment-row-actions">
                                  <button title="View" aria-label="View assignment" onClick={() => setViewAssignment(item)}>◉</button>
                                  <button title="Edit" aria-label="Edit assignment" onClick={() => openEditForm(item)}>✎</button>
                                  <button title={item.status === "closed" ? "Reopen" : "Close"} aria-label={item.status === "closed" ? "Reopen assignment" : "Close assignment"} onClick={() => toggleStatus(item)}>{item.status === "closed" ? "↻" : "✓"}</button>
                                  <button title="Delete" aria-label="Delete assignment" className="action-delete" onClick={() => deleteAssignment(item)}>▤</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="assignment-pagination">
                    <label>
                      Show{" "}
                      <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
                        <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option>
                      </select>{" "}entries
                    </label>
                    <div className="assignment-pagination-controls">
                      <button disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>‹</button>
                      <span>Page {page} of {totalPages}</span>
                      <button disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>›</button>
                    </div>
                  </div>
                </>
              )}
            </section>

            <aside className="assignment-right-column">
              <section className="assignment-analysis-panel assignment-side-card">
                <div className="assignment-side-heading">
                  <h2>Assignment Analytics</h2>
                  <button
                    type="button"
                    className="assignment-refresh-button"
                    onClick={fetchSubmissionData}
                    disabled={submissionLoading}
                  >
                    {submissionLoading ? "…" : "↻"}
                  </button>
                </div>
                {submissionError && (
                  <p className="assignment-analysis-error" role="alert">
                    {submissionError}
                  </p>
                )}
                {submissionLoading ? (
                  <p>Loading analysis...</p>
                ) : (
                  <div className="assignment-analysis-grid">
                    <article className="assignment-analysis-card">
                      <span>Total Submissions</span>
                      <strong>{totalSubmissions}</strong>
                    </article>
                    <article className="assignment-analysis-card">
                      <span>Pending</span>
                      <strong>{analyticsTotals.pending || 0}</strong>
                    </article>
                    <article className="assignment-analysis-card">
                      <span>Late</span>
                      <strong>{analyticsTotals.late || 0}</strong>
                    </article>
                    <article className="assignment-analysis-card">
                      <span>Submission Rate</span>
                      <strong>{submissionRate}%</strong>
                    </article>
                  </div>
                )}
              </section>

              <section className="assignment-side-card">
                <div className="assignment-side-heading"><h2>Quick Actions</h2></div>
                <div className="assignment-quick-grid">
                  <button className="quick-blue" onClick={openCreateForm}><span>▤</span>Create Assignment</button>
                  <button className="quick-green" onClick={exportReport}><span>⇩</span>Download Report</button>
                  <button className="quick-orange" onClick={fetchData}><span>↻</span>Refresh Data</button>
                </div>
              </section>

              <section className="assignment-analysis-panel assignment-side-card assignment-recent-card">
                <div className="assignment-side-heading">
                  <h2>Recent Submissions</h2>
                  <button
                    type="button"
                    onClick={fetchSubmissionData}
                    disabled={submissionLoading}
                  >
                    View All →
                  </button>
                </div>
                {submissionError && (
                  <p className="assignment-analysis-error" role="alert">
                    {submissionError}
                  </p>
                )}
                {submissionLoading ? (
                  <p>Loading submissions...</p>
                ) : recentSubmissions.length > 0 ? (
                  <div className="assignment-recent-list">
                    {recentSubmissions.slice(0, 5).map((item) => (
                      <div className="assignment-recent-item" key={item._id}>
                        <div className="assignment-recent-icon">▤</div>

                        <div className="assignment-recent-info">
                          <strong>{item.student?.user?.name || "Unknown Student"}</strong>
                          <span>{item.assignment?.title || "Assignment"}</span>
                          <small>
                            {item.submittedAt
                              ? new Date(item.submittedAt).toLocaleDateString("en-IN")
                              : "Date unavailable"}
                          </small>
                        </div>

                        <span className={`submission-status submission-status-${item.status || "submitted"}`}>
                          {item.status || "submitted"}
                        </span>
                        <div className="submission-action-buttons">
                          <button
                            type="button"
                            onClick={() => openEvaluation(item)}
                          >
                            Evaluate
                          </button>
                          <button
                            type="button"
                            className="submission-delete-button"
                            onClick={() => removeSubmission(item)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No submissions yet.</p>
                )}
              </section>
            </aside>
          </section>

          <footer className="assignment-footer">
            <div className="assignment-footer-brand"><span>◆</span><strong>SmartCampus</strong></div>
            <span className="assignment-footer-divider" />
            <span>Empowering Education Through Technology</span>
            <div className="assignment-footer-right"><span>v1.0.0</span><span>Gandhi Engineering College</span></div>
          </footer>
        </main>
      </div>

      {viewAssignment && (
        <div className="assignment-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setViewAssignment(null);
        }}>
          <section className="assignment-detail-modal">
            <div className="assignment-section-heading">
              <div><h2>{viewAssignment.title}</h2><p>Assignment details</p></div>
              <button className="assignment-close-button" onClick={() => setViewAssignment(null)} aria-label="Close details">×</button>
            </div>
            <div className="assignment-detail-grid">
              <div><span>Subject</span><strong>{getSubjectName(viewAssignment.subject)}</strong></div>
              <div><span>Semester</span><strong>{viewAssignment.semester ?? "—"}</strong></div>
              <div><span>Due Date</span><strong>{formatDate(viewAssignment.dueDate)}</strong></div>
              <div><span>Total Marks</span><strong>{viewAssignment.totalMarks ?? 100}</strong></div>
              <div><span>Status</span><strong>{getStatus(viewAssignment)}</strong></div>
              <div><span>Created</span><strong>{formatDate(viewAssignment.createdAt)}</strong></div>
            </div>
            {viewAssignment.description && <p className="assignment-detail-description">{viewAssignment.description}</p>}
            {viewAssignment.attachmentUrl && <p className="assignment-detail-description"><a href={viewAssignment.attachmentUrl} target="_blank" rel="noreferrer">Open attachment</a></p>}
            <div className="assignment-form-actions">
              <button className="assignment-reset-button" onClick={() => setViewAssignment(null)}>Close</button>
              <button className="assignment-create-button" onClick={() => openEditForm(viewAssignment)}>✎ Edit Assignment</button>
            </div>
          </section>
        </div>
      )}

      {evaluatingSubmission && (
        <div
          className="assignment-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !evaluationSaving
            ) {
              setEvaluatingSubmission(null);
              setError("");
            }
          }}
        >
          <section
            className="assignment-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="evaluate-submission-title"
          >
            <div className="assignment-section-heading">
              <div>
                <h2 id="evaluate-submission-title">Evaluate Submission</h2>
                <p>
                  {evaluatingSubmission.student?.user?.name || "Student"} —{" "}
                  {evaluatingSubmission.assignment?.title || "Assignment"}
                </p>
              </div>

              <button
                type="button"
                className="assignment-close-button"
                disabled={evaluationSaving}
                onClick={() => {
                  setEvaluatingSubmission(null);
                  setError("");
                }}
                aria-label="Close evaluation"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="assignment-notice" role="alert">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError("")}
                  aria-label="Dismiss error"
                >
                  ×
                </button>
              </div>
            )}

            {evaluatingSubmission.fileUrl && (
              <p className="assignment-detail-description">
                <a
                  href={evaluatingSubmission.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open submitted file
                </a>
              </p>
            )}

            {evaluatingSubmission.answer && (
              <div className="assignment-detail-description">
                <strong>Student Answer</strong>
                <p>{evaluatingSubmission.answer}</p>
              </div>
            )}

            <form
              className="assignment-form-grid"
              onSubmit={(event) => {
                event.preventDefault();
                saveEvaluation("graded");
              }}
            >
              <label>
                Marks (maximum{" "}
                {evaluatingSubmission.assignment?.totalMarks ?? 100})
                <input
                  type="number"
                  min="0"
                  max={evaluatingSubmission.assignment?.totalMarks ?? 100}
                  value={evaluationMarks}
                  onChange={(event) =>
                    setEvaluationMarks(event.target.value)
                  }
                />
              </label>

              <label className="assignment-form-full">
                Feedback / rejection reason
                <textarea
                  rows={3}
                  value={evaluationFeedback}
                  onChange={(event) =>
                    setEvaluationFeedback(event.target.value)
                  }
                  placeholder="Enter feedback for the student..."
                />
              </label>

              <div className="assignment-form-actions assignment-form-full">
                <button
                  type="button"
                  className="assignment-reset-button"
                  disabled={evaluationSaving}
                  onClick={() => saveEvaluation("rejected")}
                >
                  Reject
                </button>

                <button
                  type="button"
                  className="assignment-reset-button"
                  disabled={evaluationSaving}
                  onClick={() => saveEvaluation("accepted")}
                >
                  Accept
                </button>

                <button
                  type="submit"
                  className="assignment-create-button"
                  disabled={evaluationSaving}
                >
                  {evaluationSaving ? "Saving..." : "Save Grade"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default AssignmentManagement;
