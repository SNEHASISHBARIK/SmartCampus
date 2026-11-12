
import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "./MarksManagement.css";

const INITIAL_FORM = {
  student: "",
  subject: "",
  semester: "",
  examType: "internal",
  marksObtained: "",
  totalMarks: 100,
  grade: "",
  gradePoint: "",
  published: true,
};

const EXAM_LABELS = {
  internal: "Internal",
  midterm: "Midterm",
  "end-semester": "End Semester",
  practical: "Practical",
};

const getStudentName = (student) =>
  student?.user?.name || student?.name || "Unknown Student";

const getStudentId = (student) =>
  student?.studentId || student?.rollNumber || "N/A";

const getSubjectName = (subject) =>
  subject?.name || "Unknown Subject";

const getSubjectCode = (subject) =>
  subject?.code || "";

const getGrade = (marks, totalMarks) => {
  const total = Number(totalMarks);
  const obtained = Number(marks);

  if (!Number.isFinite(obtained) || !Number.isFinite(total) || total <= 0) {
    return { grade: "", gradePoint: "" };
  }

  const percentage = (obtained / total) * 100;

  if (percentage >= 90) return { grade: "O", gradePoint: 10 };
  if (percentage >= 80) return { grade: "A", gradePoint: 9 };
  if (percentage >= 70) return { grade: "B", gradePoint: 8 };
  if (percentage >= 60) return { grade: "C", gradePoint: 7 };
  if (percentage >= 50) return { grade: "D", gradePoint: 6 };
  if (percentage >= 40) return { grade: "E", gradePoint: 5 };

  return { grade: "F", gradePoint: 0 };
};

const MarksManagement = () => {
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [examFilter, setExamFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [resultsResponse, subjectsResponse, dashboardResponse] = await Promise.all([
        api.get("/results"),
        api.get("/faculty/subjects").catch(() => null),
        api.get("/faculty/dashboard").catch(() => null),
      ]);

      const dashboard = dashboardResponse?.data?.dashboard;
      let subs = subjectsResponse?.data?.subjects;
      if (!subs || subs.length === 0) {
        subs = dashboard?.subjects || [];
      }

      setResults(resultsResponse.data?.results || []);
      setStudents(dashboard?.students || []);
      setSubjects(subs);
    } catch (err) {
      console.error("Fetch marks data error:", err);
      setError(
        err.response?.data?.message || "Failed to load marks data."
      );
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

  const uniqueStudentsWithMarks = useMemo(
    () =>
      new Set(
        results
          .map((result) => result.student?._id || result.student)
          .filter(Boolean)
          .map(String)
      ).size,
    [results]
  );

  const pendingStudents = Math.max(
    students.length - uniqueStudentsWithMarks,
    0
  );

  const averagePercentage = useMemo(() => {
    const validResults = results.filter(
      (result) =>
        Number(result.totalMarks) > 0 &&
        Number.isFinite(Number(result.marksObtained))
    );

    if (!validResults.length) return 0;

    const sum = validResults.reduce(
      (total, result) =>
        total +
        (Number(result.marksObtained) / Number(result.totalMarks)) * 100,
      0
    );

    return sum / validResults.length;
  }, [results]);

  const gradeCounts = useMemo(() => {
    const counts = { O: 0, A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };

    results.forEach((result) => {
      const grade = result.grade || getGrade(
        result.marksObtained,
        result.totalMarks
      ).grade;

      if (Object.prototype.hasOwnProperty.call(counts, grade)) {
        counts[grade] += 1;
      }
    });

    return counts;
  }, [results]);

  const filteredResults = useMemo(() => {
    const query = search.trim().toLowerCase();

    return results.filter((result) => {
      const studentName = getStudentName(result.student).toLowerCase();
      const studentId = getStudentId(result.student).toLowerCase();
      const subjectName = getSubjectName(result.subject).toLowerCase();
      const subjectCode = getSubjectCode(result.subject).toLowerCase();
      const examType = String(result.examType || "").toLowerCase();

      const matchesSearch =
        !query ||
        studentName.includes(query) ||
        studentId.includes(query) ||
        subjectName.includes(query) ||
        subjectCode.includes(query);

      const resultSubjectId =
        result.subject?._id || result.subject || "";

      const matchesSubject =
        subjectFilter === "all" ||
        String(resultSubjectId) === String(subjectFilter);

      const matchesExam =
        examFilter === "all" ||
        examType === examFilter.toLowerCase();

      const matchesSemester =
        semesterFilter === "all" ||
        String(result.semester) === String(semesterFilter);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && result.published) ||
        (statusFilter === "unpublished" && !result.published);

      return (
        matchesSearch &&
        matchesSubject &&
        matchesExam &&
        matchesSemester &&
        matchesStatus
      );
    });
  }, [
    results,
    search,
    subjectFilter,
    examFilter,
    semesterFilter,
    statusFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredResults.length / pageSize)
  );

  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, subjectFilter, examFilter, semesterFilter, statusFilter, pageSize]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (name === "subject") {
      const selectedSubject = subjects.find(
        (subject) => String(subject._id) === String(value)
      );

      setFormData((previous) => ({
        ...previous,
        subject: value,
        semester: selectedSubject?.semester ?? previous.semester,
      }));

      if (value) {
        api
          .get(`/faculty/attendance/students?subjectId=${value}`)
          .then((res) => {
            if (res.data?.students?.length) {
              setStudents((prev) => {
                const map = new Map();
                res.data.students.forEach((s) => map.set(String(s._id), s));
                prev.forEach((s) => {
                  if (!map.has(String(s._id))) map.set(String(s._id), s);
                });
                return [...map.values()];
              });
            }
          })
          .catch(() => {});
      }
      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "totalMarks" && formData.marksObtained !== "") {
      const grade = getGrade(formData.marksObtained, value);
      setFormData((previous) => ({
        ...previous,
        totalMarks: value,
        ...grade,
      }));
    }
  };

  const handleMarksChange = (event) => {
    const marks = event.target.value;
    const grade = getGrade(marks, formData.totalMarks);

    setFormData((previous) => ({
      ...previous,
      marksObtained: marks,
      ...grade,
    }));
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setError("");
    setSuccess("");
    setFormData(INITIAL_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (result) => {
    setEditingId(result._id);
    setFormData({
      student: result.student?._id || result.student || "",
      subject: result.subject?._id || result.subject || "",
      semester: result.semester ?? "",
      examType: result.examType || "internal",
      marksObtained: result.marksObtained ?? "",
      totalMarks: result.totalMarks || 100,
      grade: result.grade || "",
      gradePoint: result.gradePoint ?? "",
      published: result.published ?? true,
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
      !formData.student ||
      !formData.subject ||
      formData.semester === "" ||
      !formData.examType ||
      formData.marksObtained === "" ||
      !formData.totalMarks
    ) {
      setError("Please fill all required fields.");
      return;
    }

    const obtained = Number(formData.marksObtained);
    const total = Number(formData.totalMarks);

    if (total <= 0 || obtained < 0 || obtained > total) {
      setError("Marks obtained must be between 0 and total marks.");
      return;
    }

    try {
      setSubmitting(true);

      const grade = getGrade(obtained, total);

      const payload = {
        student: formData.student,
        subject: formData.subject,
        semester: Number(formData.semester),
        examType: formData.examType,
        marksObtained: obtained,
        totalMarks: total,
        grade: grade.grade,
        gradePoint: Number(grade.gradePoint),
        published: formData.published,
      };

      if (editingId) {
        await api.put(`/results/${editingId}`, payload);
        setSuccess("Marks updated successfully.");
      } else {
        await api.post("/results", payload);
        setSuccess("Marks added successfully.");
      }

      resetForm();
      await fetchData();
    } catch (err) {
      console.error("Save marks error:", err);
      setError(err.response?.data?.message || "Failed to save marks.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSubjectFilter("all");
    setExamFilter("all");
    setSemesterFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const exportCsv = () => {
    const headers = [
      "Student ID",
      "Student Name",
      "Subject",
      "Semester",
      "Exam Type",
      "Marks Obtained",
      "Total Marks",
      "Grade",
      "Grade Point",
      "Published",
    ];

    const rows = filteredResults.map((result) => [
      getStudentId(result.student),
      getStudentName(result.student),
      getSubjectName(result.subject),
      result.semester ?? "",
      result.examType ?? "",
      result.marksObtained ?? "",
      result.totalMarks ?? "",
      result.grade ?? "",
      result.gradePoint ?? "",
      result.published ? "Yes" : "No",
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
    link.download = "marks-results.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatExamType = (value) =>
    EXAM_LABELS[value] ||
    String(value || "N/A")
      .replaceAll("-", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  if (loading) {
    return (
      <div className="marks-loading">
        <span className="marks-spinner" />
        <p>Loading marks dashboard...</p>
      </div>
    );
  }

  return (
    <div className="marks-page">
      <div className="marks-page-heading">
        <div>
          <div className="marks-breadcrumb">
            <span>⌂</span>
            <span>Dashboard</span>
            <span>›</span>
            <strong>Marks</strong>
          </div>
          <h1>Marks Entry &amp; Management</h1>
          <p>
            Add, update, and view student marks for internal and external
            examinations.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            type="button"
            className="marks-reset-button"
            style={{ margin: 0, padding: "0.55rem 0.9rem" }}
            onClick={fetchData}
          >
            ↻ Refresh All
          </button>
          <button className="marks-primary-button" onClick={openCreateForm}>
            <span>＋</span> Add Marks
          </button>
        </div>
      </div>

      {error && (
        <div className="marks-alert marks-alert-error">
          <span>!</span>
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="marks-alert marks-alert-success">
          <span>✓</span>
          <span>{success}</span>
          <button onClick={() => setSuccess("")} aria-label="Dismiss message">
            ×
          </button>
        </div>
      )}

      <section className="marks-stat-grid">
        <article className="marks-stat-card">
          <div className="marks-stat-icon blue">▤</div>
          <div className="marks-stat-copy">
            <strong>{students.length}</strong>
            <span>Total Students</span>
            <small>Students in faculty dashboard</small>
          </div>
        </article>

        <article className="marks-stat-card">
          <div className="marks-stat-icon green">✓</div>
          <div className="marks-stat-copy">
            <strong>{results.length}</strong>
            <span>Marks Records</span>
            <small>{uniqueStudentsWithMarks} students with marks</small>
          </div>
        </article>

        <article className="marks-stat-card">
          <div className="marks-stat-icon orange">◷</div>
          <div className="marks-stat-copy">
            <strong>{pendingStudents}</strong>
            <span>Without Marks</span>
            <small>Based on available student records</small>
          </div>
        </article>

        <article className="marks-stat-card">
          <div className="marks-stat-icon purple">▥</div>
          <div className="marks-stat-copy">
            <strong>{averagePercentage.toFixed(1)}%</strong>
            <span>Average Percentage</span>
            <small>Across available marks records</small>
          </div>
        </article>
      </section>

      <section className="marks-filter-panel">
        <div className="marks-filter-field">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label htmlFor="marks-subject-filter">Select Subject</label>
            <button
              type="button"
              onClick={fetchSubjectsOnly}
              style={{ background: "none", border: "none", color: "#4361ee", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}
            >
              ↻ Refresh
            </button>
          </div>
          <select
            id="marks-subject-filter"
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

        <div className="marks-filter-field">
          <label htmlFor="marks-exam-filter">Select Exam Type</label>
          <select
            id="marks-exam-filter"
            value={examFilter}
            onChange={(event) => setExamFilter(event.target.value)}
          >
            <option value="all">All Exam Types</option>
            <option value="internal">Internal</option>
            <option value="midterm">Midterm</option>
            <option value="end-semester">End Semester</option>
            <option value="practical">Practical</option>
          </select>
        </div>

        <div className="marks-filter-field">
          <label htmlFor="marks-semester-filter">Select Semester</label>
          <select
            id="marks-semester-filter"
            value={semesterFilter}
            onChange={(event) => setSemesterFilter(event.target.value)}
          >
            <option value="all">All Semesters</option>
            {[...new Set(subjects.map((subject) => subject.semester).filter(
              (semester) => semester !== undefined && semester !== null
            ))]
              .sort((a, b) => Number(a) - Number(b))
              .map((semester) => (
                <option key={semester} value={semester}>
                  Semester {semester}
                </option>
              ))}
          </select>
        </div>

        <div className="marks-filter-field">
          <label htmlFor="marks-status-filter">Result Status</label>
          <select
            id="marks-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All Results</option>
            <option value="published">Published</option>
            <option value="unpublished">Not Published</option>
          </select>
        </div>

        <div className="marks-search-field">
          <label htmlFor="marks-search">Search</label>
          <div className="marks-search-input">
            <span>⌕</span>
            <input
              id="marks-search"
              type="search"
              placeholder="Search name or roll number..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <button className="marks-reset-button" onClick={resetFilters}>
          ↻ Reset
        </button>
      </section>

      {showForm && (
        <section className="marks-form-panel" id="marks-entry-form">
          <div className="marks-panel-heading">
            <div>
              <h2>{editingId ? "Update Student Marks" : "Enter Student Marks"}</h2>
              <p>
                {editingId
                  ? "Update the selected student's result."
                  : "Complete the fields below to add a result."}
              </p>
            </div>
            <button
              className="marks-close-button"
              type="button"
              onClick={resetForm}
              aria-label="Close form"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="marks-form-grid">
            <div className="marks-form-field">
              <label htmlFor="marks-student">Student *</label>
              <select
                id="marks-student"
                name="student"
                value={formData.student}
                onChange={handleChange}
                required
              >
                <option value="">Select Student</option>
                {students.map((student) => (
                  <option key={student._id} value={student._id}>
                    {getStudentName(student)} — {getStudentId(student)}
                  </option>
                ))}
              </select>
            </div>

            <div className="marks-form-field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label htmlFor="marks-subject">Subject *</label>
                <button
                  type="button"
                  onClick={fetchSubjectsOnly}
                  style={{ background: "none", border: "none", color: "#4361ee", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}
                >
                  ↻ Refresh
                </button>
              </div>
              <select
                id="marks-subject"
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

            <div className="marks-form-field">
              <label htmlFor="marks-semester">Semester *</label>
              <input
                id="marks-semester"
                name="semester"
                type="number"
                min="1"
                max="12"
                value={formData.semester}
                onChange={handleChange}
                required
                readOnly={Boolean(
                  subjects.find(
                    (subject) =>
                      String(subject._id) === String(formData.subject)
                  )?.semester
                )}
              />
            </div>

            <div className="marks-form-field">
              <label htmlFor="marks-exam-type">Exam Type *</label>
              <select
                id="marks-exam-type"
                name="examType"
                value={formData.examType}
                onChange={handleChange}
                required
              >
                <option value="internal">Internal</option>
                <option value="midterm">Midterm</option>
                <option value="end-semester">End Semester</option>
                <option value="practical">Practical</option>
              </select>
            </div>

            <div className="marks-form-field">
              <label htmlFor="marks-obtained">Marks Obtained *</label>
              <input
                id="marks-obtained"
                type="number"
                min="0"
                max={formData.totalMarks}
                step="any"
                value={formData.marksObtained}
                onChange={handleMarksChange}
                placeholder="Enter marks obtained"
                required
              />
            </div>

            <div className="marks-form-field">
              <label htmlFor="marks-total">Total Marks *</label>
              <input
                id="marks-total"
                name="totalMarks"
                type="number"
                min="1"
                value={formData.totalMarks}
                onChange={handleChange}
                required
              />
            </div>

            <div className="marks-form-field">
              <label htmlFor="marks-grade">Grade</label>
              <input
                id="marks-grade"
                value={formData.grade}
                readOnly
                placeholder="Auto calculated"
              />
            </div>

            <div className="marks-form-field">
              <label htmlFor="marks-grade-point">Grade Point</label>
              <input
                id="marks-grade-point"
                value={formData.gradePoint}
                readOnly
                placeholder="Auto calculated"
              />
            </div>

            <label className="marks-publish-toggle">
              <input
                type="checkbox"
                name="published"
                checked={formData.published}
                onChange={handleChange}
              />
              <span>
                <strong>Publish result</strong>
                <small>Make this result published</small>
              </span>
            </label>

            <div className="marks-form-actions">
              <button
                type="button"
                className="marks-secondary-button"
                onClick={resetForm}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="marks-primary-button"
                disabled={submitting}
              >
                {submitting
                  ? "Saving..."
                  : editingId
                  ? "Save Changes"
                  : "Save Marks"}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="marks-dashboard-layout">
        <section className="marks-table-panel">
          <div className="marks-panel-heading marks-table-heading">
            <div>
              <h2>Student Marks</h2>
              <p>
                Showing {filteredResults.length} matching result
                {filteredResults.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="marks-table-tools">
              <button
                className="marks-secondary-button"
                onClick={fetchData}
                type="button"
              >
                ↻ Refresh
              </button>
              <button
                className="marks-secondary-button"
                onClick={exportCsv}
                type="button"
              >
                ↓ Export CSV
              </button>
            </div>
          </div>

          <div className="marks-table-scroll">
            <table className="marks-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Roll No.</th>
                  <th>Student Name</th>
                  <th>Subject</th>
                  <th>Semester</th>
                  <th>Exam Type</th>
                  <th>Marks</th>
                  <th>Grade</th>
                  <th>Grade Point</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedResults.map((result, index) => {
                  const percentage =
                    Number(result.totalMarks) > 0
                      ? (Number(result.marksObtained) /
                          Number(result.totalMarks)) *
                        100
                      : 0;

                  return (
                    <tr key={result._id}>
                      <td>{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="marks-roll-cell">
                        {getStudentId(result.student)}
                      </td>
                      <td className="marks-student-cell">
                        <div className="marks-student-avatar">
                          {getStudentName(result.student).charAt(0).toUpperCase()}
                        </div>
                        <span>{getStudentName(result.student)}</span>
                      </td>
                      <td>
                        <strong className="marks-subject-name">
                          {getSubjectName(result.subject)}
                        </strong>
                        <small className="marks-subject-code">
                          {getSubjectCode(result.subject)}
                        </small>
                      </td>
                      <td>{result.semester ?? "—"}</td>
                      <td>{formatExamType(result.examType)}</td>
                      <td>
                        <span
                          className={`marks-score ${
                            percentage >= 60
                              ? "score-good"
                              : percentage >= 40
                              ? "score-average"
                              : "score-low"
                          }`}
                        >
                          {result.marksObtained ?? "—"} / {result.totalMarks ?? "—"}
                        </span>
                      </td>
                      <td>
                        <span className="marks-grade-badge">
                          {result.grade || "—"}
                        </span>
                      </td>
                      <td>{result.gradePoint ?? "—"}</td>
                      <td>
                        <span
                          className={`marks-status-badge ${
                            result.published ? "published" : "unpublished"
                          }`}
                        >
                          {result.published ? "Published" : "Pending"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="marks-edit-button"
                          onClick={() => handleEdit(result)}
                          type="button"
                        >
                          ✎ Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {paginatedResults.length === 0 && (
                  <tr>
                    <td colSpan="11" className="marks-empty-cell">
                      <span className="marks-empty-icon">▤</span>
                      <strong>No marks records found</strong>
                      <span>Try changing your filters or add marks for a student.</span>
                      <button
                        className="marks-primary-button"
                        type="button"
                        onClick={openCreateForm}
                      >
                        ＋ Add Marks
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="marks-table-footer">
            <div className="marks-page-size">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                aria-label="Rows per page"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>

            <div className="marks-pagination">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((page) => page - 1)}
                aria-label="Previous page"
              >
                ‹
              </button>
              <span>
                Page <strong>{currentPage}</strong> of{" "}
                <strong>{totalPages}</strong>
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

        <aside className="marks-right-column">
          <section className="marks-side-panel">
            <div className="marks-side-heading">
              <div>
                <h2>Marks Analytics</h2>
                <p>Overview of available results</p>
              </div>
              <span className="marks-side-heading-icon">▥</span>
            </div>

            <div className="marks-average-display">
              <div
                className="marks-average-ring"
                style={{
                  "--average-angle": `${Math.min(averagePercentage, 100) * 3.6}deg`,
                }}
              >
                <div className="marks-average-ring-inner">
                  <strong>{averagePercentage.toFixed(1)}%</strong>
                  <span>Average</span>
                </div>
              </div>
              <div className="marks-average-details">
                <span>
                  <i className="legend-dot dot-blue" />
                  Total records <strong>{results.length}</strong>
                </span>
                <span>
                  <i className="legend-dot dot-green" />
                  Published{" "}
                  <strong>{results.filter((item) => item.published).length}</strong>
                </span>
                <span>
                  <i className="legend-dot dot-orange" />
                  Pending{" "}
                  <strong>{results.filter((item) => !item.published).length}</strong>
                </span>
              </div>
            </div>

            <div className="marks-side-note">
              Statistics are calculated from records returned by the backend.
            </div>
          </section>

          <section className="marks-side-panel">
            <div className="marks-side-heading">
              <div>
                <h2>Grade Distribution</h2>
                <p>Grades in available marks records</p>
              </div>
            </div>

            <div className="marks-grade-list">
              {Object.entries(gradeCounts).map(([grade, count]) => {
                const percent = results.length
                  ? (count / results.length) * 100
                  : 0;

                return (
                  <div className="marks-grade-row" key={grade}>
                    <span className={`marks-grade-letter grade-${grade}`}>
                      {grade}
                    </span>
                    <div className="marks-grade-track">
                      <div
                        className={`marks-grade-fill grade-fill-${grade}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <strong>{count}</strong>
                    <small>{Math.round(percent)}%</small>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="marks-side-panel">
            <div className="marks-side-heading">
              <div>
                <h2>Quick Actions</h2>
                <p>Common marks tasks</p>
              </div>
            </div>

            <div className="marks-quick-actions">
              <button
                className="marks-quick-action quick-blue"
                type="button"
                onClick={openCreateForm}
              >
                <span>＋</span>
                <strong>Add Marks</strong>
                <small>Enter a student result</small>
              </button>

              <button
                className="marks-quick-action quick-green"
                type="button"
                onClick={exportCsv}
              >
                <span>⇩</span>
                <strong>Export Marks</strong>
                <small>Download filtered CSV</small>
              </button>

              <button
                className="marks-quick-action quick-purple"
                type="button"
                onClick={() => {
                  resetFilters();
                  setStatusFilter("published");
                }}
              >
                <span>✓</span>
                <strong>Published Results</strong>
                <small>View published records</small>
              </button>

              <button
                className="marks-quick-action quick-orange"
                type="button"
                onClick={() => {
                  resetFilters();
                  setStatusFilter("unpublished");
                }}
              >
                <span>◷</span>
                <strong>Pending Results</strong>
                <small>View unpublished records</small>
              </button>
            </div>
          </section>

          <section className="marks-side-panel marks-subject-panel">
            <div className="marks-side-heading">
              <div>
                <h2>Assigned Subjects</h2>
                <p>Records grouped by subject</p>
              </div>
            </div>

            {subjects.length ? (
              <div className="marks-assigned-subjects">
                {subjects.map((subject) => {
                  const count = results.filter(
                    (result) =>
                      String(result.subject?._id || result.subject) ===
                      String(subject._id)
                  ).length;

                  return (
                    <button
                      type="button"
                      className="marks-assigned-subject"
                      key={subject._id}
                      onClick={() => {
                        setSubjectFilter(subject._id);
                        setCurrentPage(1);
                      }}
                    >
                      <span className="marks-subject-initial">
                        {(subject.name || "S").charAt(0).toUpperCase()}
                      </span>
                      <span className="marks-assigned-subject-info">
                        <strong>{subject.name}</strong>
                        <small>
                          {subject.code || "Subject"}
                          {subject.semester
                            ? ` · Semester ${subject.semester}`
                            : ""}
                        </small>
                      </span>
                      <span className="marks-subject-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="marks-no-subjects">No subjects available.</p>
            )}
          </section>
        </aside>
      </div>

      <footer className="marks-page-footer">
        <div className="marks-footer-brand">
          <span>◆</span>
          <strong>SmartCampus</strong>
        </div>
        <span>Empowering Education Through Technology</span>
        <span>Faculty Portal</span>
      </footer>
    </div>
  );
};

export default MarksManagement;
