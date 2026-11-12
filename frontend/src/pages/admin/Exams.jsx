import { useEffect, useMemo, useState } from "react";
import DatePickerInput from "../../components/DatePickerInput";
import TimePickerInput from "../../components/TimePickerInput";
import api from "../../services/api";
import "./Exams.css";

const emptyForm = {
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
  status: "Upcoming",
};

const formatDate = (date) => {
  if (!date) return "";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (time) => {
  if (!time) return "";

  const [hours, minutes] = time.split(":");

  if (hours === undefined || minutes === undefined) {
    return time;
  }

  const h = Number(hours);

  const suffix = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 || 12;

  return `${displayHour}:${minutes} ${suffix}`;
};

const examTypeLabel = (type) => {
  const map = {
    internal: "Internal",
    midterm: "Midterm",
    "end-semester": "End Semester",
    practical: "Practical",
  };

  return map[type] || type || "";
};

const examTypeValue = (type) => {
  const map = {
    Internal: "internal",
    Midterm: "midterm",
    "End Semester": "end-semester",
    Practical: "practical",
  };

  return map[type] || type || "internal";
};

const normalizeExam = (exam, index = 0) => {
  const subject =
    exam.subject && typeof exam.subject === "object"
      ? exam.subject
      : null;

  return {
    mongoId: exam._id || exam.id,

    id:
      exam.examId ||
      exam.id ||
      `EXM${String(index + 1).padStart(3, "0")}`,

    title: exam.title || "",

    code:
      exam.code ||
      subject?.code ||
      "",

    subject:
      typeof exam.subject === "string"
        ? exam.subject
        : subject?.name || "",

    subjectId:
      subject?._id ||
      (typeof exam.subject === "string" ? exam.subject : ""),

    semester: exam.semester || "",

    type:
      exam.type ||
      examTypeLabel(exam.examType),

    examType:
      exam.examType || examTypeValue(exam.type),

    date: formatDate(exam.date),

    rawDate: exam.date
      ? new Date(exam.date).toISOString().split("T")[0]
      : "",

    time:
      exam.time ||
      `${formatTime(exam.startTime)}${
        exam.endTime ? ` - ${formatTime(exam.endTime)}` : ""
      }`,

    startTime: exam.startTime || "",

    endTime: exam.endTime || "",

    status: exam.status || "Upcoming",

    room: exam.room || "",

    totalMarks: exam.totalMarks ?? 100,

    instructions: exam.instructions || "",
  };
};

export default function Exams() {
  const [exams, setExams] = useState([]);

  const [subjects, setSubjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [semester, setSemester] = useState("All Semesters");
  const [type, setType] = useState("All Exam Types");
  const [status, setStatus] = useState("All Status");

  const [showModal, setShowModal] = useState(false);

  const [modalMode, setModalMode] = useState("add");

  const [selectedExam, setSelectedExam] = useState(null);

  const [form, setForm] = useState(emptyForm);

  // =========================================================
  // LOAD EXAMS
  // =========================================================

  const loadExams = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/exams");

      const data =
        response.data?.exams ||
        response.data?.data ||
        [];

      setExams(
        Array.isArray(data)
          ? data.map((exam, index) =>
              normalizeExam(exam, index)
            )
          : []
      );
    } catch (err) {
      console.error("Load exams error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load examinations."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD SUBJECTS
  // =========================================================

  const loadSubjects = async () => {
    try {
      const response = await api.get("/admin/subjects");

      const data =
        response.data?.subjects ||
        response.data?.data ||
        [];

      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load subjects error:", err);
    }
  };

  useEffect(() => {
    loadExams();
    loadSubjects();
  }, []);

  // =========================================================
  // STATS
  // =========================================================

  const stats = useMemo(
    () => ({
      total: exams.length,

      scheduled: exams.filter(
        (exam) => exam.status === "Scheduled"
      ).length,

      upcoming: exams.filter(
        (exam) => exam.status === "Upcoming"
      ).length,

      semesters: new Set(
        exams.map((exam) => exam.semester)
      ).size,
    }),
    [exams]
  );

  // =========================================================
  // FILTER
  // =========================================================

  const filteredExams = exams.filter((exam) => {
    const text = search.toLowerCase();

    const matchesSearch =
      exam.id.toLowerCase().includes(text) ||
      exam.title.toLowerCase().includes(text) ||
      exam.subject.toLowerCase().includes(text) ||
      exam.code.toLowerCase().includes(text);

    const matchesSemester =
      semester === "All Semesters" ||
      String(exam.semester) === semester;

    const matchesType =
      type === "All Exam Types" ||
      exam.type === type;

    const matchesStatus =
      status === "All Status" ||
      exam.status === status;

    return (
      matchesSearch &&
      matchesSemester &&
      matchesType &&
      matchesStatus
    );
  });

  // =========================================================
  // FORM HANDLERS
  // =========================================================

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // ADD
  // =========================================================

  const openAddModal = () => {
    setModalMode("add");
    setSelectedExam(null);

    setForm({
      ...emptyForm,
    });

    setError("");
    setShowModal(true);
  };

  // =========================================================
  // VIEW
  // =========================================================

  const viewExam = async (exam) => {
    try {
      setError("");

      const response = await api.get(
        `/admin/exams/${exam.mongoId}`
      );

      const data =
        response.data?.exam ||
        response.data?.data ||
        response.data;

      const normalized = normalizeExam(data);

      setSelectedExam(normalized);

      setModalMode("view");

      setForm({
        title: normalized.title,
        subject: normalized.subjectId,
        semester: normalized.semester,
        examType: normalized.examType,
        date: normalized.rawDate,
        startTime: normalized.startTime,
        endTime: normalized.endTime,
        room: normalized.room,
        totalMarks: normalized.totalMarks,
        instructions: normalized.instructions,
        status: normalized.status,
      });

      setShowModal(true);
    } catch (err) {
      console.error("View exam error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load examination details."
      );
    }
  };

  // =========================================================
  // EDIT
  // =========================================================

  const editExam = async (exam) => {
    try {
      setError("");

      const response = await api.get(
        `/admin/exams/${exam.mongoId}`
      );

      const data =
        response.data?.exam ||
        response.data?.data ||
        response.data;

      const normalized = normalizeExam(data);

      setSelectedExam(normalized);

      setModalMode("edit");

      setForm({
        title: normalized.title,
        subject: normalized.subjectId,
        semester: normalized.semester,
        examType: normalized.examType,
        date: normalized.rawDate,
        startTime: normalized.startTime,
        endTime: normalized.endTime,
        room: normalized.room,
        totalMarks: normalized.totalMarks,
        instructions: normalized.instructions,
        status: normalized.status,
      });

      setShowModal(true);
    } catch (err) {
      console.error("Edit exam error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load examination."
      );
    }
  };

  // =========================================================
  // SAVE
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (modalMode === "view") return;

    if (
      !form.title ||
      !form.subject ||
      !form.semester ||
      !form.date ||
      !form.startTime ||
      !form.endTime
    ) {
      setError("Please fill all required fields.");
      return;
    }

    if (form.startTime >= form.endTime) {
      setError(
        "End time must be later than start time."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        title: form.title,
        subject: form.subject,
        semester: Number(form.semester),
        examType: form.examType,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        room: form.room,
        totalMarks: Number(form.totalMarks),
        instructions: form.instructions,
        status: form.status,
      };

      if (modalMode === "add") {
        await api.post("/admin/exams", payload);
      } else {
        await api.put(
          `/admin/exams/${selectedExam.mongoId}`,
          payload
        );
      }

      setShowModal(false);

      setForm({
        ...emptyForm,
      });

      await loadExams();
    } catch (err) {
      console.error("Save exam error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to save examination."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const deleteExam = async (exam) => {
    const confirmed = window.confirm(
      `Delete "${exam.title}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(
        `/admin/exams/${exam.mongoId}`
      );

      await loadExams();
    } catch (err) {
      console.error("Delete exam error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to delete examination."
      );
    }
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setSelectedExam(null);
    setForm({
      ...emptyForm,
    });
  };

  return (
    <div className="admin-exams-page">

      {/* HEADER */}

      <div className="admin-exams-header">

        <div>
          <div className="admin-exams-breadcrumb">
            Dashboard <span>›</span> Exams
          </div>

          <h1>Exams</h1>

          <p>
            Manage examinations, schedules and academic
            assessments.
          </p>
        </div>

        <button
          className="exam-primary-button"
          onClick={openAddModal}
        >
          <span>+</span>
          Add Examination
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div
          style={{
            margin: "15px 0",
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#fee2e2",
            color: "#b91c1c",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {/* STATS */}

      <div className="exam-stat-grid">

        <div className="exam-stat-card">
          <div className="exam-stat-icon blue">▣</div>

          <div>
            <span>Total Exams</span>
            <strong>{stats.total}</strong>

            <small className="green">
              ↑ 10% this semester
            </small>
          </div>
        </div>

        <div className="exam-stat-card">
          <div className="exam-stat-icon green">✓</div>

          <div>
            <span>Scheduled</span>
            <strong>{stats.scheduled}</strong>

            <small className="green">
              Confirmed examinations
            </small>
          </div>
        </div>

        <div className="exam-stat-card">
          <div className="exam-stat-icon orange">◷</div>

          <div>
            <span>Upcoming</span>
            <strong>{stats.upcoming}</strong>

            <small className="orange">
              Next examinations
            </small>
          </div>
        </div>

        <div className="exam-stat-card">
          <div className="exam-stat-icon purple">
            🎓
          </div>

          <div>
            <span>Semesters</span>
            <strong>{stats.semesters}</strong>

            <small className="blue">
              With examinations
            </small>
          </div>
        </div>

      </div>

      {/* FILTER */}

      <div className="exam-filter-card">

        <div className="exam-search">
          <span>⌕</span>

          <input
            placeholder="Search by exam, subject or code..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <select
          value={semester}
          onChange={(e) =>
            setSemester(e.target.value)
          }
        >
          <option>All Semesters</option>
          <option value="1">Semester 1</option>
          <option value="3">Semester 3</option>
          <option value="5">Semester 5</option>
          <option value="7">Semester 7</option>
        </select>

        <select
          value={type}
          onChange={(e) =>
            setType(e.target.value)
          }
        >
          <option>All Exam Types</option>
          <option>Internal</option>
          <option>Midterm</option>
          <option>End Semester</option>
          <option>Practical</option>
        </select>

        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value)
          }
        >
          <option>All Status</option>
          <option>Scheduled</option>
          <option>Upcoming</option>
        </select>

        <button
          className="exam-filter-button"
          type="button"
        >
          ⚱ Filter
        </button>

        <button
          className="exam-reset-button"
          type="button"
          onClick={() => {
            setSearch("");
            setSemester("All Semesters");
            setType("All Exam Types");
            setStatus("All Status");
          }}
        >
          ↻ Reset
        </button>

      </div>

      {/* TABLE */}

      <div className="admin-exams-table-card">

        <div className="exam-table-top">

          <div>
            <h2>Examination Schedule</h2>

            <p>
              Manage all upcoming and scheduled
              examinations.
            </p>
          </div>

          <span>
            {filteredExams.length} Records
          </span>

        </div>

        <div className="exam-table-wrapper">

          <table className="admin-exams-table">

            <thead>
              <tr>
                <th>#</th>
                <th>Exam ID</th>
                <th>Title</th>
                <th>Subject</th>
                <th>Semester</th>
                <th>Exam Type</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan="10"
                    style={{
                      textAlign: "center",
                      padding: "40px",
                    }}
                  >
                    Loading examinations...
                  </td>
                </tr>
              ) : filteredExams.length === 0 ? (
                <tr>
                  <td
                    colSpan="10"
                    style={{
                      textAlign: "center",
                      padding: "40px",
                    }}
                  >
                    No examinations found.
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam, index) => (

                  <tr key={exam.mongoId || exam.id}>

                    <td>{index + 1}</td>

                    <td>
                      <strong className="exam-id">
                        {exam.id}
                      </strong>
                    </td>

                    <td>
                      <div className="exam-title-cell">

                        <div className="exam-icon">
                          📝
                        </div>

                        <div>
                          <strong>
                            {exam.title}
                          </strong>

                          <span>
                            {exam.code}
                          </span>
                        </div>

                      </div>
                    </td>

                    <td>{exam.subject}</td>

                    <td>
                      <span className="semester-badge">
                        {exam.semester}
                      </span>
                    </td>

                    <td>
                      <span className="exam-type-badge">
                        {exam.type}
                      </span>
                    </td>

                    <td>{exam.date}</td>

                    <td>
                      {formatTime(exam.startTime)}
                    </td>

                    <td>
                      <span
                        className={`exam-status ${exam.status.toLowerCase()}`}
                      >
                        {exam.status}
                      </span>
                    </td>

                    <td>

                      <div className="exam-actions">

                        <button
                          className="exam-view"
                          type="button"
                          title="View"
                          onClick={() =>
                            viewExam(exam)
                          }
                        >
                          👁
                        </button>

                        <button
                          className="exam-edit"
                          type="button"
                          title="Edit"
                          onClick={() =>
                            editExam(exam)
                          }
                        >
                          ✎
                        </button>

                        <button
                          className="exam-delete"
                          type="button"
                          title="Delete"
                          onClick={() =>
                            deleteExam(exam)
                          }
                        >
                          🗑
                        </button>

                      </div>

                    </td>

                  </tr>

                ))
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =====================================================
          ADD / EDIT / VIEW MODAL
      ====================================================== */}

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >

          <div
            style={{
              width: "100%",
              maxWidth: "720px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#ffffff",
              borderRadius: "14px",
              boxShadow:
                "0 25px 60px rgba(0,0,0,0.25)",
            }}
          >

            {/* MODAL HEADER */}

            <div
              style={{
                padding: "20px 24px",
                borderBottom:
                  "1px solid #e5e7eb",
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
              }}
            >

              <div>
                <h2
                  style={{
                    margin: 0,
                    color: "#172554",
                  }}
                >
                  {modalMode === "add"
                    ? "Add Examination"
                    : modalMode === "edit"
                    ? "Edit Examination"
                    : "Examination Details"}
                </h2>

                {selectedExam && (
                  <p
                    style={{
                      margin:
                        "5px 0 0",
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    {selectedExam.id}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={closeModal}
                style={{
                  border: "none",
                  background: "#f1f5f9",
                  width: "35px",
                  height: "35px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              style={{
                padding: "24px",
              }}
            >

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap: "18px",
                }}
              >

                {/* TITLE */}

                <div
                  style={{
                    gridColumn:
                      "1 / -1",
                  }}
                >
                  <label>Exam Title *</label>

                  <input
                    name="title"
                    value={form.title}
                    onChange={handleFormChange}
                    disabled={
                      modalMode === "view"
                    }
                    placeholder="Machine Learning Midterm Examination"
                    style={inputStyle}
                  />
                </div>

                {/* SUBJECT */}

                <div>
                  <label>Subject *</label>

                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleFormChange}
                    disabled={
                      modalMode === "view"
                    }
                    style={inputStyle}
                  >
                    <option value="">
                      Select Subject
                    </option>

                    {subjects.map(
                      (subject) => (
                        <option
                          key={
                            subject._id
                          }
                          value={
                            subject._id
                          }
                        >
                          {subject.name}{" "}
                          {subject.code
                            ? `(${subject.code})`
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* SEMESTER */}

                <div>
                  <label>Semester *</label>

                  <select
                    name="semester"
                    value={form.semester}
                    onChange={handleFormChange}
                    disabled={
                      modalMode === "view"
                    }
                    style={inputStyle}
                  >
                    <option value="">
                      Select Semester
                    </option>

                    {[1, 2, 3, 4, 5, 6, 7, 8].map(
                      (sem) => (
                        <option
                          key={sem}
                          value={sem}
                        >
                          Semester {sem}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* EXAM TYPE */}

                <div>
                  <label>Exam Type *</label>

                  <select
                    name="examType"
                    value={form.examType}
                    onChange={handleFormChange}
                    disabled={
                      modalMode === "view"
                    }
                    style={inputStyle}
                  >
                    <option value="internal">
                      Internal
                    </option>

                    <option value="midterm">
                      Midterm
                    </option>

                    <option value="end-semester">
                      End Semester
                    </option>

                    <option value="practical">
                      Practical
                    </option>
                  </select>
                </div>

                {/* STATUS */}

                <div>
                  <label>Status</label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleFormChange}
                    disabled={
                      modalMode === "view"
                    }
                    style={inputStyle}
                  >
                    <option value="Scheduled">
                      Scheduled
                    </option>

                    <option value="Upcoming">
                      Upcoming
                    </option>
                  </select>
                </div>

                {/* DATE */}

                <div>
                  <label>Date *</label>

                  <DatePickerInput
                    name="date"
                    value={form.date}
                    onChange={handleFormChange}
                    disabled={
                      modalMode === "view"
                    }
                    style={inputStyle}
                  />
                </div>

                {/* START TIME */}

                <div>
                  <label>Start Time *</label>

                  <TimePickerInput
                    name="startTime"
                    value={form.startTime}
                    onChange={handleFormChange}
                    disabled={
                      modalMode === "view"
                    }
                    style={inputStyle}
                  />
                </div>

                {/* END TIME */}

                <div>
                  <label>End Time *</label>

                  <TimePickerInput
                    name="endTime"
                    value={form.endTime}
                    onChange={handleFormChange}
                    disabled={
                      modalMode === "view"
                    }
                    style={inputStyle}
                  />
                </div>

                {/* ROOM */}

                <div>
                  <label>Room</label>

                  <input
                    name="room"
                    value={form.room}
                    onChange={handleFormChange}
                    disabled={
                      modalMode === "view"
                    }
                    placeholder="Room 301"
                    style={inputStyle}
                  />
                </div>

                {/* MARKS */}

                <div>
                  <label>Total Marks</label>

                  <input
                    type="number"
                    name="totalMarks"
                    value={form.totalMarks}
                    onChange={handleFormChange}
                    disabled={
                      modalMode === "view"
                    }
                    min="0"
                    style={inputStyle}
                  />
                </div>

                {/* INSTRUCTIONS */}

                <div
                  style={{
                    gridColumn:
                      "1 / -1",
                  }}
                >
                  <label>
                    Instructions
                  </label>

                  <textarea
                    name="instructions"
                    value={
                      form.instructions
                    }
                    onChange={
                      handleFormChange
                    }
                    disabled={
                      modalMode === "view"
                    }
                    rows="4"
                    placeholder="Enter examination instructions..."
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                    }}
                  />
                </div>

              </div>

              {/* MODAL FOOTER */}

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  gap: "10px",
                  marginTop: "24px",
                  paddingTop: "18px",
                  borderTop:
                    "1px solid #e5e7eb",
                }}
              >

                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding:
                      "10px 18px",
                    borderRadius:
                      "8px",
                    border:
                      "1px solid #cbd5e1",
                    background:
                      "#ffffff",
                    cursor:
                      "pointer",
                  }}
                >
                  {modalMode === "view"
                    ? "Close"
                    : "Cancel"}
                </button>

                {modalMode !== "view" && (
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding:
                        "10px 22px",
                      borderRadius:
                        "8px",
                      border: "none",
                      background:
                        "#0d6efd",
                      color:
                        "#ffffff",
                      cursor:
                        saving
                          ? "not-allowed"
                          : "pointer",
                      opacity:
                        saving ? 0.7 : 1,
                    }}
                  >
                    {saving
                      ? "Saving..."
                      : modalMode === "add"
                      ? "Create Examination"
                      : "Update Examination"}
                  </button>
                )}

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  marginTop: "7px",
  padding: "11px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  outline: "none",
  fontSize: "14px",
  background: "#ffffff",
  color: "#172554",
  fontFamily: "inherit",
};

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  color: "#172554",
  fontSize: "15px",
  fontWeight: "600",
  textAlign: "left",
};