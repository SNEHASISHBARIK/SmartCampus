import { useEffect, useMemo, useState } from "react";
import DatePickerInput from "../../components/DatePickerInput";
import api from "../../services/api";
import "./Notices.css";

const categories = [
  "academic",
  "exam",
  "event",
  "placement",
  "holiday",
  "general",
];

const audiences = [
  "All Students",
  "All Faculty",
  "All Users",
  "Final Year",
  "7th Semester",
  "Students",
  "Faculty",
  "Admin",
];

const priorities = ["High", "Medium", "Low"];

const emptyForm = {
  title: "",
  content: "",
  category: "general",
  audience: "All Students",
  priority: "Medium",
  published: true,
  expiresAt: "",
};

const getTargetRoles = (audience) => {
  switch (audience) {
    case "All Students":
    case "Students":
    case "Final Year":
    case "7th Semester":
      return ["student"];

    case "All Faculty":
    case "Faculty":
      return ["faculty"];

    case "Admin":
      return ["admin"];

    case "All Users":
    default:
      return ["student", "faculty", "admin"];
  }
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function Notices() {
  const [notices, setNotices] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [status, setStatus] = useState("All Status");

  const [selected, setSelected] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [editingNotice, setEditingNotice] = useState(null);
  const [viewingNotice, setViewingNotice] = useState(null);

  const [form, setForm] = useState(emptyForm);

  // ==========================================
  // FETCH NOTICES
  // ==========================================
  const fetchNotices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/notices");

      setNotices(response.data.notices || []);
    } catch (err) {
      console.error("Fetch Notices Error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load notices."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // ==========================================
  // STATISTICS
  // ==========================================
  const stats = useMemo(
    () => ({
      total: notices.length,

      published: notices.filter(
        (notice) => notice.published === true
      ).length,

      draft: notices.filter(
        (notice) => notice.published === false
      ).length,

      high: notices.filter(
        (notice) => notice.priority === "High"
      ).length,
    }),
    [notices]
  );

  // ==========================================
  // FILTER
  // ==========================================
  const filteredNotices = notices.filter((notice) => {
    const text = search.toLowerCase();

    const matchesSearch =
      notice.noticeId?.toLowerCase().includes(text) ||
      notice.id?.toLowerCase().includes(text) ||
      notice.title?.toLowerCase().includes(text) ||
      notice.category?.toLowerCase().includes(text);

    const matchesCategory =
      category === "All Categories" ||
      notice.category === category;

    const noticeStatus = notice.published
      ? "Published"
      : "Draft";

    const matchesStatus =
      status === "All Status" ||
      noticeStatus === status;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStatus
    );
  });

  // ==========================================
  // FORM INPUT
  // ==========================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ==========================================
  // OPEN CREATE
  // ==========================================
  const openCreateModal = () => {
    setEditingNotice(null);
    setForm(emptyForm);
    setError("");
    setShowFormModal(true);
  };

  // ==========================================
  // OPEN EDIT
  // ==========================================
  const openEditModal = (notice) => {
    setEditingNotice(notice);

    setForm({
      title: notice.title || "",
      content: notice.content || "",
      category: notice.category || "general",
      audience: notice.audience || "All Students",
      priority: notice.priority || "Medium",
      published: notice.published ?? true,
      expiresAt: notice.expiresAt
        ? new Date(notice.expiresAt)
            .toISOString()
            .split("T")[0]
        : "",
    });

    setError("");
    setShowFormModal(true);
  };

  // ==========================================
  // OPEN VIEW
  // ==========================================
  const openViewModal = (notice) => {
    setViewingNotice(notice);
    setShowViewModal(true);
  };

  // ==========================================
  // CREATE / UPDATE
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Please enter notice title.");
      return;
    }

    if (!form.content.trim()) {
      alert("Please enter notice content.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        audience: form.audience,
        priority: form.priority,
        targetRoles: getTargetRoles(form.audience),
        published: form.published,
        expiresAt: form.expiresAt || null,
      };

      if (editingNotice) {
        const response = await api.put(
          `/admin/notices/${editingNotice._id}`,
          payload
        );

        const updatedNotice = response.data.notice;

        setNotices((prev) =>
          prev.map((notice) =>
            notice._id === editingNotice._id
              ? updatedNotice
              : notice
          )
        );

        alert("Notice updated successfully.");
      } else {
        const response = await api.post(
          "/admin/notices",
          payload
        );

        setNotices((prev) => [
          response.data.notice,
          ...prev,
        ]);

        alert("Notice created successfully.");
      }

      setShowFormModal(false);
      setEditingNotice(null);
      setForm(emptyForm);
    } catch (err) {
      console.error("Save Notice Error:", err);

      alert(
        err.response?.data?.message ||
          "Failed to save notice."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DELETE
  // ==========================================
  const deleteNotice = async (id) => {
    if (!window.confirm("Delete this notice?")) {
      return;
    }

    try {
      await api.delete(`/admin/notices/${id}`);

      setNotices((prev) =>
        prev.filter((notice) => notice._id !== id)
      );

      setSelected((prev) =>
        prev.filter((item) => item !== id)
      );

      alert("Notice deleted successfully.");
    } catch (err) {
      console.error("Delete Notice Error:", err);

      alert(
        err.response?.data?.message ||
          "Failed to delete notice."
      );
    }
  };

  // ==========================================
  // PUBLISH / UNPUBLISH
  // ==========================================
  const togglePublished = async (notice) => {
    try {
      const response = await api.put(
        `/admin/notices/${notice._id}`,
        {
          published: !notice.published,
        }
      );

      const updatedNotice = response.data.notice;

      setNotices((prev) =>
        prev.map((item) =>
          item._id === notice._id
            ? updatedNotice
            : item
        )
      );
    } catch (err) {
      console.error("Publish Notice Error:", err);

      alert(
        err.response?.data?.message ||
          "Failed to update notice."
      );
    }
  };

  // ==========================================
  // SELECT
  // ==========================================
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (
      selected.length === filteredNotices.length &&
      filteredNotices.length > 0
    ) {
      setSelected([]);
    } else {
      setSelected(
        filteredNotices.map((notice) => notice._id)
      );
    }
  };

  // ==========================================
  // RESET
  // ==========================================
  const resetFilters = () => {
    setSearch("");
    setCategory("All Categories");
    setStatus("All Status");
  };

  return (
    <div className="notices-page">

      {/* HEADER */}
      <div className="notices-header">
        <div>
          <div className="notices-breadcrumb">
            Dashboard <span>›</span> Notices
          </div>

          <h1>Notices</h1>

          <p>
            Create, publish and manage campus notices.
          </p>
        </div>

        <button
          className="notice-primary-button"
          onClick={openCreateModal}
        >
          <span>+</span>
          Create Notice
        </button>
      </div>

      {/* STATISTICS */}
      <div className="notice-stat-grid">

        <div className="notice-stat-card">
          <div className="notice-stat-icon blue">
            ▣
          </div>

          <div>
            <span>Total Notices</span>
            <strong>{stats.total}</strong>
            <small className="green">
              Live database records
            </small>
          </div>
        </div>

        <div className="notice-stat-card">
          <div className="notice-stat-icon green">
            ✓
          </div>

          <div>
            <span>Published</span>
            <strong>{stats.published}</strong>
            <small className="green">
              Currently visible
            </small>
          </div>
        </div>

        <div className="notice-stat-card">
          <div className="notice-stat-icon orange">
            ◷
          </div>

          <div>
            <span>Draft Notices</span>
            <strong>{stats.draft}</strong>
            <small className="orange">
              Not published
            </small>
          </div>
        </div>

        <div className="notice-stat-card">
          <div className="notice-stat-icon red">
            !
          </div>

          <div>
            <span>High Priority</span>
            <strong>{stats.high}</strong>
            <small className="red">
              Requires attention
            </small>
          </div>
        </div>

      </div>

      {/* FILTERS */}
      <div className="notices-filter-card">

        <div className="notice-search">
          <span>⌕</span>

          <input
            placeholder="Search notice by title, ID or category..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <select
          value={category}
          onChange={(e) =>
            setCategory(e.target.value)
          }
        >
          <option>All Categories</option>

          {categories.map((item) => (
            <option key={item} value={item}>
              {item.charAt(0).toUpperCase() +
                item.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value)
          }
        >
          <option>All Status</option>
          <option>Published</option>
          <option>Draft</option>
        </select>

        <button className="notice-filter-button">
          ⚱ Filter
        </button>

        <button
          className="notice-reset-button"
          onClick={resetFilters}
        >
          ↻ Reset
        </button>

      </div>

      {/* ERROR */}
      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#b91c1c",
            padding: "12px 16px",
            borderRadius: "10px",
            marginBottom: "15px",
          }}
        >
          {error}
        </div>
      )}

      {/* TABLE */}
      <div className="notices-table-card">

        <div className="notices-table-top">

          <div>
            <h2>Campus Notices</h2>

            <p>
              Manage announcements and important
              information.
            </p>
          </div>

          <span>
            {filteredNotices.length} Records
          </span>

        </div>

        <div className="notices-table-wrapper">

          {loading ? (
            <div
              style={{
                padding: "50px",
                textAlign: "center",
              }}
            >
              Loading notices...
            </div>
          ) : filteredNotices.length === 0 ? (
            <div
              style={{
                padding: "50px",
                textAlign: "center",
              }}
            >
              No notices found.
            </div>
          ) : (
            <table className="notices-table">

              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={
                        filteredNotices.length > 0 &&
                        selected.length ===
                          filteredNotices.length
                      }
                      onChange={toggleAll}
                    />
                  </th>

                  <th>#</th>
                  <th>Notice ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Audience</th>
                  <th>Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredNotices.map(
                  (notice, index) => {

                    const noticeId =
                      notice.noticeId ||
                      notice.id ||
                      `NOT${String(
                        index + 1
                      ).padStart(3, "0")}`;

                    const noticeStatus =
                      notice.published
                        ? "Published"
                        : "Draft";

                    return (
                      <tr
                        key={notice._id}
                      >

                        <td>
                          <input
                            type="checkbox"
                            checked={selected.includes(
                              notice._id
                            )}
                            onChange={() =>
                              toggleSelect(
                                notice._id
                              )
                            }
                          />
                        </td>

                        <td>{index + 1}</td>

                        <td>
                          <strong className="notice-id">
                            {noticeId}
                          </strong>
                        </td>

                        <td>
                          <div className="notice-title-cell">

                            <div className="notice-title-icon">
                              📢
                            </div>

                            <strong>
                              {notice.title}
                            </strong>

                          </div>
                        </td>

                        <td>
                          <span className="category-badge">
                            {notice.category
                              ?.charAt(0)
                              .toUpperCase() +
                              notice.category?.slice(1)}
                          </span>
                        </td>

                        <td>
                          {notice.audience ||
                            "All Users"}
                        </td>

                        <td>
                          {formatDate(
                            notice.createdAt
                          )}
                        </td>

                        <td>
                          <span
                            className={`priority-badge ${
                              (
                                notice.priority ||
                                "Medium"
                              ).toLowerCase()
                            }`}
                          >
                            {notice.priority ||
                              "Medium"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`notice-status ${
                              noticeStatus.toLowerCase()
                            }`}
                          >
                            {noticeStatus}
                          </span>
                        </td>

                        <td>
                          <div className="notice-actions">

                            {/* VIEW */}
                            <button
                              className="notice-view"
                              title="View Notice"
                              onClick={() =>
                                openViewModal(
                                  notice
                                )
                              }
                            >
                              👁
                            </button>

                            {/* EDIT */}
                            <button
                              className="notice-edit"
                              title="Edit Notice"
                              onClick={() =>
                                openEditModal(
                                  notice
                                )
                              }
                            >
                              ✎
                            </button>

                            {/* DELETE */}
                            <button
                              className="notice-delete"
                              title="Delete Notice"
                              onClick={() =>
                                deleteNotice(
                                  notice._id
                                )
                              }
                            >
                              🗑
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>
          )}

        </div>

        <div className="notices-table-footer">

          <div className="notice-bulk">
            <select>
              <option>
                Bulk Actions
              </option>
              <option>
                Publish Selected
              </option>
              <option>
                Delete Selected
              </option>
            </select>

            <button>
              Apply
            </button>
          </div>

          <div className="notice-pagination">
            <span>‹</span>
            <b>1</b>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>...</span>
            <span>10</span>
            <span>›</span>
          </div>

        </div>

      </div>

      {/* ========================================
          CREATE / EDIT MODAL
      ======================================== */}
      {showFormModal && (
        <div
          className="notice-modal-overlay"
          onClick={() =>
            setShowFormModal(false)
          }
        >
          <div
            className="notice-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="notice-modal-header">

              <div>
                <h2>
                  {editingNotice
                    ? "Edit Notice"
                    : "Create Notice"}
                </h2>

                <p>
                  {editingNotice
                    ? "Update campus notice details."
                    : "Create a new campus notice."}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowFormModal(false)
                }
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="notice-form"
            >

              <div className="notice-form-group">
                <label>
                  Notice Title *
                </label>

                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Enter notice title"
                  required
                />
              </div>

              <div className="notice-form-row">

                <div className="notice-form-group">
                  <label>
                    Category *
                  </label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >
                    {categories.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item
                            .charAt(0)
                            .toUpperCase() +
                            item.slice(1)}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="notice-form-group">
                  <label>
                    Audience *
                  </label>

                  <select
                    name="audience"
                    value={form.audience}
                    onChange={handleChange}
                  >
                    {audiences.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </div>

              </div>

              <div className="notice-form-row">

                <div className="notice-form-group">
                  <label>
                    Priority *
                  </label>

                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                  >
                    {priorities.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="notice-form-group">
                  <label>
                    Expiry Date
                  </label>

                  <DatePickerInput
                    name="expiresAt"
                    value={form.expiresAt}
                    onChange={handleChange}
                  />
                </div>

              </div>

              <div className="notice-form-group">
                <label>
                  Notice Content *
                </label>

                <textarea
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  placeholder="Enter notice content..."
                  rows="6"
                  required
                />
              </div>

              <label className="notice-checkbox">
                <input
                  type="checkbox"
                  name="published"
                  checked={form.published}
                  onChange={handleChange}
                />

                <span>
                  Publish notice immediately
                </span>
              </label>

              <div className="notice-form-actions">

                <button
                  type="button"
                  onClick={() =>
                    setShowFormModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingNotice
                    ? "Update Notice"
                    : "Create Notice"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================
          VIEW MODAL
      ======================================== */}
      {showViewModal &&
        viewingNotice && (
          <div
            className="notice-modal-overlay"
            onClick={() =>
              setShowViewModal(false)
            }
          >
            <div
              className="notice-view-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="notice-modal-header">

                <div>
                  <h2>
                    {viewingNotice.title}
                  </h2>

                  <p>
                    {viewingNotice.noticeId ||
                      viewingNotice.id}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowViewModal(false)
                  }
                >
                  ×
                </button>

              </div>

              <div className="notice-view-details">

                <div>
                  <strong>
                    Category
                  </strong>

                  <span>
                    {viewingNotice.category}
                  </span>
                </div>

                <div>
                  <strong>
                    Audience
                  </strong>

                  <span>
                    {viewingNotice.audience ||
                      "All Users"}
                  </span>
                </div>

                <div>
                  <strong>
                    Priority
                  </strong>

                  <span>
                    {viewingNotice.priority ||
                      "Medium"}
                  </span>
                </div>

                <div>
                  <strong>
                    Status
                  </strong>

                  <span>
                    {viewingNotice.published
                      ? "Published"
                      : "Draft"}
                  </span>
                </div>

                <div>
                  <strong>
                    Date
                  </strong>

                  <span>
                    {formatDate(
                      viewingNotice.createdAt
                    )}
                  </span>
                </div>

              </div>

              <div className="notice-view-content">
                <h3>
                  Notice Content
                </h3>

                <p>
                  {viewingNotice.content}
                </p>
              </div>

            </div>
          </div>
        )}

      {/* FOOTER */}
      <div className="notices-footer">

        <div>
          🎓
          <strong>
            SmartCampus
          </strong>

          <span>|</span>

          Empowering Education Through Technology
        </div>

        <div>
          v1.0.0&nbsp;&nbsp; | &nbsp;&nbsp;
          Gandhi Engineering College
        </div>

      </div>

    </div>
  );
}