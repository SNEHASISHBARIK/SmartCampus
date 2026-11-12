
import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "./NotesManagement.css";

const EMPTY_FORM = {
  title: "",
  subject: "",
  semester: "",
  fileUrl: "",
};

const NotesManagement = () => {
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [notesResponse, subjectsResponse, dashboardResponse] = await Promise.all([
        api.get("/notes"),
        api.get("/faculty/subjects").catch(() => null),
        api.get("/faculty/dashboard").catch(() => null),
      ]);

      let subs = subjectsResponse?.data?.subjects;
      if (!subs || subs.length === 0) {
        subs = dashboardResponse?.data?.dashboard?.subjects || [];
      }

      setNotes(notesResponse.data?.notes || []);
      setSubjects(subs);
    } catch (err) {
      console.error("Fetch notes error:", err);
      setError(err.response?.data?.message || "Failed to load notes.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectsOnly = async () => {
    try {
      const res = await api.get("/faculty/subjects");
      if (res.data?.subjects?.length) {
        setSubjects(res.data.subjects);
        setSuccess("Subjects refreshed successfully.");
      }
    } catch (err) {
      console.error("Refresh subjects error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const publishedCount = notes.filter(
    (note) => String(note.status || "").toLowerCase() === "active" ||
              String(note.status || "").toLowerCase() === "published"
  ).length;

  const draftCount = notes.filter(
    (note) => String(note.status || "").toLowerCase() === "draft"
  ).length;

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notes.filter((note) => {
      const title = String(note.title || "").toLowerCase();
      const subjectName = String(note.subject?.name || "").toLowerCase();
      const subjectCode = String(note.subject?.code || "").toLowerCase();
      const noteStatus = String(note.status || "").toLowerCase();
      const subjectId = note.subject?._id || note.subject || "";

      const matchesSearch =
        !query ||
        title.includes(query) ||
        subjectName.includes(query) ||
        subjectCode.includes(query);

      const matchesSubject =
        subjectFilter === "all" ||
        String(subjectId) === String(subjectFilter);

      const matchesStatus =
        statusFilter === "all" ||
        noteStatus === statusFilter;

      return matchesSearch && matchesSubject && matchesStatus;
    });
  }, [notes, search, subjectFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / pageSize));

  const paginatedNotes = filteredNotes.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, subjectFilter, statusFilter, pageSize]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "subject") {
      const selectedSubject = subjects.find(
        (subject) => String(subject._id) === String(value)
      );

      setFormData((previous) => ({
        ...previous,
        subject: value,
        semester: selectedSubject?.semester ?? "",
      }));
      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setError("");
    setSuccess("");
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (note) => {
    setEditingId(note._id);
    setFormData({
      title: note.title || "",
      subject: note.subject?._id || note.subject || "",
      semester: note.semester ?? "",
      fileUrl: note.fileUrl || "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      !formData.title.trim() ||
      !formData.subject ||
      formData.semester === "" ||
      !formData.fileUrl.trim()
    ) {
      setError("Please fill all required fields.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        title: formData.title.trim(),
        subject: formData.subject,
        semester: Number(formData.semester),
        fileUrl: formData.fileUrl.trim(),
      };

      if (editingId) {
        await api.put(`/notes/${editingId}`, payload);
        setSuccess("Note updated successfully.");
      } else {
        await api.post("/notes", payload);
        setSuccess("Note created successfully.");
      }

      resetForm();
      await fetchData();
    } catch (err) {
      console.error("Save note error:", err);
      setError(err.response?.data?.message || "Failed to save note.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSubjectFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const exportCsv = () => {
    const headers = ["Title", "Subject", "Subject Code", "Semester", "Status", "File URL"];

    const rows = filteredNotes.map((note) => [
      note.title || "",
      note.subject?.name || "",
      note.subject?.code || "",
      note.semester ?? "",
      note.status || "",
      note.fileUrl || "",
    ]);

    const escapeCsv = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "study-notes.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatus = (note) => {
    const status = String(note.status || "active").toLowerCase();

    if (status === "draft") return "Draft";
    if (status === "closed") return "Closed";
    if (status === "published") return "Published";

    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getFileType = (fileUrl) => {
    const cleanUrl = String(fileUrl || "").split("?")[0].toLowerCase();
    const extension = cleanUrl.split(".").pop();

    if (["pdf", "ppt", "pptx", "doc", "docx", "zip"].includes(extension)) {
      return extension.toUpperCase();
    }

    return "FILE";
  };

  const getFileClass = (fileType) => {
    if (fileType === "PDF") return "notes-file-pdf";
    if (fileType === "PPT" || fileType === "PPTX") return "notes-file-ppt";
    if (fileType === "DOC" || fileType === "DOCX") return "notes-file-doc";
    if (fileType === "ZIP") return "notes-file-zip";
    return "notes-file-generic";
  };

  if (loading) {
    return (
      <div className="notes-loading">
        <span className="notes-spinner" />
        <p>Loading study notes...</p>
      </div>
    );
  }

  return (
    <main className="notes-page">
      <header className="notes-page-heading">
        <div>
          <nav className="notes-breadcrumb" aria-label="Breadcrumb">
            <span className="notes-home-icon">⌂</span>
            <span>Dashboard</span>
            <span>›</span>
            <strong>Notes</strong>
          </nav>

          <h1>Study Notes</h1>
          <p>Upload, organize, and share study materials for your students.</p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            type="button"
            className="notes-secondary-button"
            style={{ padding: "0.55rem 0.9rem" }}
            onClick={fetchData}
          >
            ↻ Refresh All
          </button>
          <button
            type="button"
            className="notes-primary-button"
            onClick={openCreateForm}
          >
            <span>＋</span> Upload Note
          </button>
        </div>
      </header>

      {error && (
        <div className="notes-alert notes-alert-error" role="alert">
          <span>!</span>
          <p>{error}</p>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="notes-alert notes-alert-success" role="status">
          <span>✓</span>
          <p>{success}</p>
          <button type="button" onClick={() => setSuccess("")} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      <section className="notes-stats-grid">
        <article className="notes-stat-card">
          <div className="notes-stat-icon notes-icon-blue">▤</div>
          <div className="notes-stat-copy">
            <strong>{notes.length}</strong>
            <span>Total Notes</span>
            <small>Notes available in your account</small>
          </div>
        </article>

        <article className="notes-stat-card">
          <div className="notes-stat-icon notes-icon-indigo">♟</div>
          <div className="notes-stat-copy">
            <strong>{subjects.length}</strong>
            <span>Assigned Subjects</span>
            <small>Subjects from faculty dashboard</small>
          </div>
        </article>

        <article className="notes-stat-card">
          <div className="notes-stat-icon notes-icon-green">✓</div>
          <div className="notes-stat-copy">
            <strong>{publishedCount}</strong>
            <span>Active / Published</span>
            <small>Based on note status</small>
          </div>
        </article>

        <article className="notes-stat-card">
          <div className="notes-stat-icon notes-icon-purple">◉</div>
          <div className="notes-stat-copy">
            <strong>{draftCount}</strong>
            <span>Draft Notes</span>
            <small>Notes marked as draft</small>
          </div>
        </article>
      </section>

      <section className="notes-filter-panel">
        <div className="notes-filter-field">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label htmlFor="notes-subject-filter">Select Subject</label>
            <button
              type="button"
              onClick={fetchSubjectsOnly}
              style={{ background: "none", border: "none", color: "#4361ee", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}
            >
              ↻ Refresh
            </button>
          </div>
          <select
            id="notes-subject-filter"
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
          >
            <option value="all">All Subjects ({subjects.length})</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name} {subject.code ? `(${subject.code})` : ""} [Sem {subject.semester ?? "?"}{subject.department?.code ? ` · ${subject.department.code}` : ""}]
              </option>
            ))}
          </select>
        </div>

        <div className="notes-filter-field">
          <label htmlFor="notes-status-filter">Select Note Status</label>
          <select
            id="notes-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="notes-search-field">
          <label htmlFor="notes-search">Search Notes</label>
          <div className="notes-search-box">
            <span>⌕</span>
            <input
              id="notes-search"
              type="search"
              placeholder="Search by title or subject..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <button
          type="button"
          className="notes-filter-reset"
          onClick={resetFilters}
        >
          ↻ Reset
        </button>
      </section>

      {showForm && (
        <section className="notes-form-panel" id="notes-entry-form">
          <div className="notes-panel-heading">
            <div>
              <h2>{editingId ? "Update Study Note" : "Upload Study Note"}</h2>
              <p>
                {editingId
                  ? "Update the details of this study note."
                  : "Add a title, select the subject, and provide the file URL."}
              </p>
            </div>

            <button
              type="button"
              className="notes-close-button"
              onClick={resetForm}
              aria-label="Close form"
            >
              ×
            </button>
          </div>

          <form className="notes-form-grid" onSubmit={handleSubmit}>
            <div className="notes-form-field notes-form-title">
              <label htmlFor="note-title">Note Title *</label>
              <input
                id="note-title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter study note title"
                required
              />
            </div>

            <div className="notes-form-field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label htmlFor="note-subject">Subject *</label>
                <button
                  type="button"
                  onClick={fetchSubjectsOnly}
                  style={{ background: "none", border: "none", color: "#4361ee", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}
                >
                  ↻ Refresh
                </button>
              </div>
              <select
                id="note-subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
              >
                <option value="">Select Subject ({subjects.length} available)</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name} {subject.code ? `(${subject.code})` : ""} [Sem {subject.semester ?? "?"}{subject.department?.code ? ` · ${subject.department.code}` : ""}]{subject.isAssigned ? " · Assigned" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="notes-form-field">
              <label htmlFor="note-semester">Semester *</label>
              <input
                id="note-semester"
                name="semester"
                type="number"
                min="1"
                max="12"
                value={formData.semester}
                onChange={handleChange}
                placeholder="Select a subject first"
                readOnly
                required
              />
            </div>

            <div className="notes-form-field notes-form-file">
              <label htmlFor="note-file-url">File URL *</label>
              <input
                id="note-file-url"
                name="fileUrl"
                type="url"
                value={formData.fileUrl}
                onChange={handleChange}
                placeholder="https://example.com/notes.pdf"
                required
              />
              <small>Paste a link to the study material.</small>
            </div>

            <div className="notes-form-actions">
              <button
                type="button"
                className="notes-secondary-button"
                onClick={resetForm}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="notes-primary-button"
                disabled={submitting}
              >
                {submitting
                  ? "Saving..."
                  : editingId
                  ? "Save Changes"
                  : "Create Note"}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="notes-content-layout">
        <section className="notes-table-panel">
          <div className="notes-panel-heading notes-list-heading">
            <div>
              <h2>Study Notes Library</h2>
              <p>
                Showing {filteredNotes.length} note
                {filteredNotes.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="notes-list-actions">
              <button
                type="button"
                className="notes-secondary-button"
                onClick={fetchData}
              >
                ↻ Refresh
              </button>
              <button
                type="button"
                className="notes-secondary-button"
                onClick={exportCsv}
              >
                ↓ Export CSV
              </button>
            </div>
          </div>

          <div className="notes-table-scroll">
            <table className="notes-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Note Title</th>
                  <th>Subject</th>
                  <th>Type</th>
                  <th>Semester</th>
                  <th>Status</th>
                  <th>File</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {paginatedNotes.map((note, index) => {
                  const fileType = getFileType(note.fileUrl);
                  const status = getStatus(note);

                  return (
                    <tr key={note._id}>
                      <td>{(currentPage - 1) * pageSize + index + 1}</td>

                      <td>
                        <div className="notes-title-cell">
                          <span className={`notes-file-icon ${getFileClass(fileType)}`}>
                            {fileType === "PDF" ? "PDF" : fileType.slice(0, 4)}
                          </span>
                          <strong>{note.title}</strong>
                        </div>
                      </td>

                      <td>
                        <strong className="notes-subject-name">
                          {note.subject?.name || "N/A"}
                        </strong>
                        <small className="notes-subject-code">
                          {note.subject?.code || ""}
                        </small>
                      </td>

                      <td>
                        <span className={`notes-type-badge ${getFileClass(fileType)}`}>
                          {fileType}
                        </span>
                      </td>

                      <td>{note.semester ?? "—"}</td>

                      <td>
                        <span
                          className={`notes-status-badge ${
                            status.toLowerCase() === "draft"
                              ? "notes-status-draft"
                              : status.toLowerCase() === "closed"
                              ? "notes-status-closed"
                              : "notes-status-active"
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td>
                        {note.fileUrl ? (
                          <a
                            className="notes-open-link"
                            href={note.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <span>↗</span> Open File
                          </a>
                        ) : (
                          <span className="notes-no-file">No file</span>
                        )}
                      </td>

                      <td>
                        <div className="notes-row-actions">
                          <button
                            type="button"
                            className="notes-action-button notes-action-view"
                            title="Open file"
                            aria-label={`Open ${note.title}`}
                            disabled={!note.fileUrl}
                            onClick={() =>
                              note.fileUrl &&
                              window.open(note.fileUrl, "_blank", "noopener,noreferrer")
                            }
                          >
                            ↗
                          </button>

                          <button
                            type="button"
                            className="notes-action-button notes-action-edit"
                            title="Edit note"
                            aria-label={`Edit ${note.title}`}
                            onClick={() => handleEdit(note)}
                          >
                            ✎
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {paginatedNotes.length === 0 && (
                  <tr>
                    <td colSpan="8" className="notes-empty-cell">
                      <span className="notes-empty-icon">▤</span>
                      <strong>No study notes found</strong>
                      <p>Try changing your filters or create a new study note.</p>
                      <button
                        type="button"
                        className="notes-primary-button"
                        onClick={openCreateForm}
                      >
                        ＋ Upload Note
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="notes-table-footer">
            <div className="notes-entries-control">
              <span>Show</span>
              <select
                aria-label="Notes per page"
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>

            <div className="notes-pagination">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((page) => page - 1)}
                aria-label="Previous page"
              >
                ‹
              </button>
              <span>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((page) => page + 1)}
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          </div>
        </section>

        <aside className="notes-sidebar-widgets">
          <section className="notes-widget notes-storage-widget">
            <div className="notes-widget-heading">
              <div>
                <h2>Notes Overview</h2>
                <p>Current notes status</p>
              </div>
              <span className="notes-widget-icon">▤</span>
            </div>

            <div className="notes-overview-total">
              <span>Total notes</span>
              <strong>{notes.length}</strong>
            </div>

            <div className="notes-overview-track">
              <span
                style={{
                  width: notes.length
                    ? `${(publishedCount / notes.length) * 100}%`
                    : "0%",
                }}
              />
            </div>

            <div className="notes-overview-line">
              <span><i className="notes-dot notes-dot-green" />Active / Published</span>
              <strong>{publishedCount}</strong>
            </div>
            <div className="notes-overview-line">
              <span><i className="notes-dot notes-dot-orange" />Draft</span>
              <strong>{draftCount}</strong>
            </div>
            <div className="notes-overview-line">
              <span><i className="notes-dot notes-dot-blue" />Other statuses</span>
              <strong>{Math.max(notes.length - publishedCount - draftCount, 0)}</strong>
            </div>

            <p className="notes-widget-footnote">
              Counts reflect notes returned by your backend.
            </p>
          </section>

          <section className="notes-widget">
            <div className="notes-widget-heading">
              <div>
                <h2>Note Categories</h2>
                <p>Filter by assigned subject</p>
              </div>
            </div>

            <div className="notes-category-list">
              {subjects.length ? (
                subjects.map((subject, index) => {
                  const count = notes.filter(
                    (note) =>
                      String(note.subject?._id || note.subject) ===
                      String(subject._id)
                  ).length;

                  return (
                    <button
                      type="button"
                      className={`notes-category-row ${
                        String(subjectFilter) === String(subject._id)
                          ? "notes-category-selected"
                          : ""
                      }`}
                      key={subject._id}
                      onClick={() => setSubjectFilter(subject._id)}
                    >
                      <span className={`notes-category-icon category-color-${index % 4}`}>
                        ▰
                      </span>
                      <span className="notes-category-name">
                        <strong>{subject.name}</strong>
                        <small>{subject.code || "Assigned subject"}</small>
                      </span>
                      <span className="notes-category-count">{count}</span>
                    </button>
                  );
                })
              ) : (
                <p className="notes-widget-empty">No assigned subjects found.</p>
              )}
            </div>

            {subjectFilter !== "all" && (
              <button
                type="button"
                className="notes-clear-category"
                onClick={() => setSubjectFilter("all")}
              >
                Clear subject filter
              </button>
            )}
          </section>

          <section className="notes-widget">
            <div className="notes-widget-heading">
              <div>
                <h2>Quick Actions</h2>
                <p>Common study note tasks</p>
              </div>
            </div>

            <div className="notes-quick-actions">
              <button
                type="button"
                className="notes-quick-action quick-action-blue"
                onClick={openCreateForm}
              >
                <span>↑</span>
                <strong>Upload Note</strong>
                <small>Add study material</small>
              </button>

              <button
                type="button"
                className="notes-quick-action quick-action-green"
                onClick={exportCsv}
              >
                <span>↓</span>
                <strong>Export Notes</strong>
                <small>Download CSV</small>
              </button>

              <button
                type="button"
                className="notes-quick-action quick-action-purple"
                onClick={() => {
                  setSearch("");
                  setSubjectFilter("all");
                  setStatusFilter("all");
                }}
              >
                <span>⚙</span>
                <strong>Reset Filters</strong>
                <small>View all notes</small>
              </button>

              <button
                type="button"
                className="notes-quick-action quick-action-orange"
                onClick={fetchData}
              >
                <span>↻</span>
                <strong>Refresh Notes</strong>
                <small>Reload records</small>
              </button>
            </div>
          </section>

          <section className="notes-widget">
            <div className="notes-widget-heading">
              <div>
                <h2>Recent Notes</h2>
                <p>Latest records in your notes list</p>
              </div>
              <button
                type="button"
                className="notes-view-all"
                onClick={resetFilters}
              >
                View All →
              </button>
            </div>

            <div className="notes-recent-list">
              {[...notes]
                .sort(
                  (a, b) =>
                    new Date(b.createdAt || 0).getTime() -
                    new Date(a.createdAt || 0).getTime()
                )
                .slice(0, 5)
                .map((note) => {
                  const fileType = getFileType(note.fileUrl);

                  return (
                    <div className="notes-recent-item" key={note._id}>
                      <span className={`notes-file-icon ${getFileClass(fileType)}`}>
                        {fileType === "PDF" ? "PDF" : fileType.slice(0, 4)}
                      </span>
                      <div className="notes-recent-copy">
                        <strong>{note.title}</strong>
                        <small>
                          {note.subject?.name || "Subject not available"}
                        </small>
                      </div>
                      <button
                        type="button"
                        className="notes-recent-open"
                        title="Open note"
                        disabled={!note.fileUrl}
                        onClick={() =>
                          note.fileUrl &&
                          window.open(note.fileUrl, "_blank", "noopener,noreferrer")
                        }
                      >
                        ↗
                      </button>
                    </div>
                  );
                })}

              {notes.length === 0 && (
                <p className="notes-widget-empty">No notes have been created yet.</p>
              )}
            </div>
          </section>
        </aside>
      </div>

      <footer className="notes-page-footer">
        <div className="notes-footer-brand">
          <span>◆</span>
          <strong>SmartCampus</strong>
        </div>
        <span>Empowering Education Through Technology</span>
        <span>Faculty Portal</span>
      </footer>
    </main>
  );
};

export default NotesManagement;
