import { useState, useEffect, useMemo } from "react";
import api from "../../services/api";
import TimePickerInput from "../../components/TimePickerInput";
import "./Timetable.css";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SESSION_TYPES = ["class", "lab", "break", "activity", "study"];

const emptyForm = {
  title: "",
  department: "",
  semester: 7,
  section: "A",
  day: "Monday",
  startTime: "09:00",
  endTime: "10:30",
  room: "Hall 201",
  subject: "",
  faculty: "",
  sessionType: "class",
  isActive: true,
};

export default function AdminTimetable() {
  const [timetable, setTimetable] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedSem, setSelectedSem] = useState("all");
  const [selectedDay, setSelectedDay] = useState("all");
  const [search, setSearch] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  // Fetch all initial data
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [ttRes, deptRes, subRes, facRes] = await Promise.allSettled([
        api.get("/admin/timetable"),
        api.get("/admin/departments"),
        api.get("/admin/subjects"),
        api.get("/admin/faculty"),
      ]);

      if (ttRes.status === "fulfilled") {
        setTimetable(ttRes.value.data?.timetable || []);
      }
      if (deptRes.status === "fulfilled") {
        const d = deptRes.value.data;
        setDepartments(d.departments || d.data || []);
      }
      if (subRes.status === "fulfilled") {
        const s = subRes.value.data;
        setSubjects(s.subjects || s.data || []);
      }
      if (facRes.status === "fulfilled") {
        const f = facRes.value.data;
        setFacultyList(f.faculty || f.data || []);
      }
    } catch (err) {
      console.error("Timetable load error:", err);
      setError("Unable to load timetable data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered timetable
  const filteredTimetable = useMemo(() => {
    return timetable.filter((item) => {
      const matchDept =
        selectedDept === "all" ||
        item.department?._id === selectedDept ||
        item.department === selectedDept;

      const matchSem =
        selectedSem === "all" ||
        Number(item.semester) === Number(selectedSem);

      const matchDay =
        selectedDay === "all" || item.day === selectedDay;

      const query = search.trim().toLowerCase();
      const matchSearch =
        !query ||
        item.title?.toLowerCase().includes(query) ||
        item.room?.toLowerCase().includes(query) ||
        item.subject?.name?.toLowerCase().includes(query) ||
        item.faculty?.user?.name?.toLowerCase().includes(query);

      return matchDept && matchSem && matchDay && matchSearch;
    });
  }, [timetable, selectedDept, selectedSem, selectedDay, search]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      department: departments[0]?._id || "",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item._id);
    setForm({
      title: item.title || "",
      department: item.department?._id || item.department || "",
      semester: item.semester || 1,
      section: item.section || "",
      day: item.day || "Monday",
      startTime: item.startTime || "09:00",
      endTime: item.endTime || "10:30",
      room: item.room || "",
      subject: item.subject?._id || item.subject || "",
      faculty: item.faculty?._id || item.faculty || "",
      sessionType: item.sessionType || "class",
      isActive: item.isActive ?? true,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this timetable session?")) {
      return;
    }
    try {
      await api.delete(`/admin/timetable/${id}`);
      setTimetable((prev) => prev.filter((t) => t._id !== id));
      setSuccessMsg("Timetable entry removed successfully.");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      console.error("Delete timetable error:", err);
      alert(err.response?.data?.message || "Failed to delete timetable entry.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        title: form.title.trim(),
        department: form.department,
        semester: Number(form.semester),
        section: form.section.trim().toUpperCase(),
        day: form.day,
        startTime: form.startTime,
        endTime: form.endTime,
        room: form.room.trim(),
        subject: form.subject || null,
        faculty: form.faculty || null,
        sessionType: form.sessionType,
        isActive: form.isActive,
      };

      if (editingId) {
        const res = await api.put(`/admin/timetable/${editingId}`, payload);
        const updated = res.data?.timetableEntry;
        setTimetable((prev) =>
          prev.map((t) => (t._id === editingId ? (updated || t) : t))
        );
        setSuccessMsg("Timetable entry updated successfully.");
      } else {
        const res = await api.post("/admin/timetable", payload);
        const created = res.data?.timetableEntry;
        if (created) {
          setTimetable((prev) => [...prev, created]);
        }
        setSuccessMsg("New timetable entry created successfully.");
      }

      setShowModal(false);
      setTimeout(() => setSuccessMsg(""), 3500);
      loadData(); // Re-fetch to populate refs fully
    } catch (err) {
      console.error("Save timetable error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to save timetable entry. Verify all selections."
      );
    } finally {
      setSaving(false);
    }
  };

  // Grouped by day
  const groupedByDay = useMemo(() => {
    const map = {};
    DAYS.forEach((d) => (map[d] = []));
    filteredTimetable.forEach((entry) => {
      if (!map[entry.day]) map[entry.day] = [];
      map[entry.day].push(entry);
    });
    // Sort each day by startTime
    Object.keys(map).forEach((d) => {
      map[d].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return map;
  }, [filteredTimetable]);

  return (
    <div className="admin-timetable-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1>Class Timetable Management</h1>
          <p>
            Create, schedule, and allocate lecture halls, lab sessions, and
            timings across departments.
          </p>
        </div>
        <button
          type="button"
          className="btn-add-session"
          onClick={handleOpenAdd}
        >
          <span>+</span> Add Timetable Entry
        </button>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {successMsg && (
        <div className="timetable-alert success" role="status">
          ✓ {successMsg}
        </div>
      )}
      {error && (
        <div className="timetable-alert error" role="alert">
          ⚠ {error}
        </div>
      )}

      {/* KPI METRICS */}
      <div className="timetable-kpis">
        <div className="tt-kpi">
          <span className="tt-kpi-icon blue">🗓️</span>
          <div>
            <strong>{timetable.length}</strong>
            <span>Total Scheduled Sessions</span>
          </div>
        </div>

        <div className="tt-kpi">
          <span className="tt-kpi-icon green">🏫</span>
          <div>
            <strong>{departments.length}</strong>
            <span>Academic Departments</span>
          </div>
        </div>

        <div className="tt-kpi">
          <span className="tt-kpi-icon purple">📚</span>
          <div>
            <strong>{subjects.length}</strong>
            <span>Active Courses</span>
          </div>
        </div>

        <div className="tt-kpi">
          <span className="tt-kpi-icon amber">👩‍🏫</span>
          <div>
            <strong>{facultyList.length}</strong>
            <span>Faculty Instructors</span>
          </div>
        </div>
      </div>

      {/* FILTERS TOOLBAR */}
      <div className="timetable-toolbar">
        <div className="search-wrap">
          <input
            type="search"
            placeholder="Search by title, room, subject, instructor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>

          <select
            value={selectedSem}
            onChange={(e) => setSelectedSem(e.target.value)}
          >
            <option value="all">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>

          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
          >
            <option value="all">All Days</option>
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TIMETABLE CONTENT */}
      {loading ? (
        <div className="tt-loading-state">
          <div className="spinner" />
          <span>Loading Timetable Schedules...</span>
        </div>
      ) : filteredTimetable.length === 0 ? (
        <div className="tt-empty-state">
          <span className="empty-icon">📅</span>
          <h3>No Timetable Entries Found</h3>
          <p>
            {timetable.length === 0
              ? "No classes have been scheduled yet. Click '+ Add Timetable Entry' to create the first session."
              : "No entries match your selected department, semester, or search filter."}
          </p>
          <button
            type="button"
            className="btn-add-session secondary"
            onClick={handleOpenAdd}
          >
            + Create Session Now
          </button>
        </div>
      ) : (
        /* DAY-BY-DAY SCHEDULE CARDS */
        <div className="tt-schedule-grid">
          {DAYS.map((day) => {
            const sessions = groupedByDay[day] || [];
            if (selectedDay !== "all" && selectedDay !== day) return null;
            return (
              <div className="tt-day-column" key={day}>
                <div className="tt-day-header">
                  <h3>{day}</h3>
                  <span className="badge-count">{sessions.length} sessions</span>
                </div>

                <div className="tt-day-body">
                  {sessions.length === 0 ? (
                    <div className="tt-no-sessions">No sessions scheduled</div>
                  ) : (
                    sessions.map((session) => (
                      <div
                        key={session._id}
                        className={`tt-session-card ${session.sessionType || "class"}`}
                      >
                        <div className="session-top">
                          <span className="session-time">
                            ⏱ {session.startTime} – {session.endTime}
                          </span>
                          <span className={`session-pill ${session.sessionType}`}>
                            {session.sessionType}
                          </span>
                        </div>

                        <h4 className="session-title">{session.title}</h4>

                        <div className="session-meta">
                          {session.subject?.name && (
                            <div className="session-sub">
                              📖 {session.subject.name}{" "}
                              <small>({session.subject.code})</small>
                            </div>
                          )}
                          <div className="session-loc">
                            📍 {session.room || "TBA"} · Sem {session.semester}
                            {session.section ? ` (${session.section})` : ""}
                          </div>
                          {session.faculty?.user?.name && (
                            <div className="session-inst">
                              👨‍🏫 {session.faculty.user.name}
                            </div>
                          )}
                        </div>

                        <div className="session-actions">
                          <button
                            type="button"
                            className="btn-edit-tt"
                            onClick={() => handleOpenEdit(session)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn-del-tt"
                            onClick={() => handleDelete(session._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div
          className="tt-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="tt-modal-dialog" role="dialog" aria-modal="true">
            <div className="tt-modal-header">
              <h2>
                {editingId ? "Edit Timetable Entry" : "Create Timetable Entry"}
              </h2>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="tt-modal-form">
              <div className="form-row">
                <div className="form-group full">
                  <label>Session Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Machine Learning Lecture"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Department *</label>
                  <select
                    required
                    value={form.department}
                    onChange={(e) =>
                      setForm({ ...form, department: e.target.value })
                    }
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Semester (1–8) *</label>
                  <select
                    value={form.semester}
                    onChange={(e) =>
                      setForm({ ...form, semester: Number(e.target.value) })
                    }
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Section</label>
                  <input
                    type="text"
                    placeholder="e.g. A"
                    value={form.section}
                    onChange={(e) =>
                      setForm({ ...form, section: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Day of Week *</label>
                  <select
                    value={form.day}
                    onChange={(e) => setForm({ ...form, day: e.target.value })}
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Start Time *</label>
                  <TimePickerInput
                    id="tt-start-time"
                    name="startTime"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm({ ...form, startTime: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Time *</label>
                  <TimePickerInput
                    id="tt-end-time"
                    name="endTime"
                    value={form.endTime}
                    onChange={(e) =>
                      setForm({ ...form, endTime: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Room / Hall *</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 401 or Lab 2"
                    value={form.room}
                    onChange={(e) => setForm({ ...form, room: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Session Type *</label>
                  <select
                    value={form.sessionType}
                    onChange={(e) =>
                      setForm({ ...form, sessionType: e.target.value })
                    }
                  >
                    {SESSION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Subject / Course</label>
                  <select
                    value={form.subject}
                    onChange={(e) =>
                      setForm({ ...form, subject: e.target.value })
                    }
                  >
                    <option value="">None / Open Session</option>
                    {subjects.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.code} - Sem {s.semester})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Assigned Faculty</label>
                  <select
                    value={form.faculty}
                    onChange={(e) =>
                      setForm({ ...form, faculty: e.target.value })
                    }
                  >
                    <option value="">Unassigned</option>
                    {facultyList.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.user?.name || f.facultyId} ({f.employeeId || "Faculty"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="tt-modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-submit"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Session"
                    : "Create Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
