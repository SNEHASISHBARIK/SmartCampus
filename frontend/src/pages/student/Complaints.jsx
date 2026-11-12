import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiMessageCircle,
  FiPlus,
  FiRefreshCw,
  FiSend,
  FiX,
} from "react-icons/fi";
import api from "../../services/api";
import "./Complaints.css";

const initialForm = { subject: "", category: "other", description: "" };

const CATEGORY_OPTIONS = [
  ["academic", "Academic"],
  ["hostel", "Hostel"],
  ["library", "Library"],
  ["transport", "Transport"],
  ["fees", "Fees"],
  ["technical", "Technical"],
  ["other", "Other"],
];

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const formatCategory = (value) =>
  String(value || "other").replace(/\b\w/g, (letter) => letter.toUpperCase());

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [activeTab, setActiveTab] = useState("open");
  const [showForm, setShowForm] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    const controller = new AbortController();

    const fetchComplaints = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/students/complaints", {
          signal: controller.signal,
        });
        if (!Array.isArray(response.data?.complaints)) {
          throw new Error("Complaints response has an invalid format.");
        }
        setComplaints(response.data.complaints);
      } catch (requestError) {
        if (requestError.code === "ERR_CANCELED") return;
        console.error("Student complaints error:", requestError);
        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Unable to load your complaints."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchComplaints();
    return () => controller.abort();
  }, [reloadKey]);

  const stats = useMemo(
    () => ({
      total: complaints.length,
      resolved: complaints.filter((item) => item.status === "resolved").length,
      inProgress: complaints.filter((item) => item.status === "in-progress").length,
      pending: complaints.filter((item) => item.status === "pending").length,
    }),
    [complaints]
  );

  const visibleComplaints = useMemo(
    () =>
      activeTab === "open"
        ? complaints.filter((item) => ["pending", "in-progress"].includes(item.status))
        : complaints.filter((item) => ["resolved", "rejected"].includes(item.status)),
    [activeTab, complaints]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.subject.trim() || !formData.description.trim()) {
      setError("Please provide a subject and describe your complaint.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post("/students/complaints", {
        ...formData,
        subject: formData.subject.trim(),
        description: formData.description.trim(),
      });
      if (!response.data?.success || !response.data?.complaint) {
        throw new Error(response.data?.message || "The complaint was not saved.");
      }
      setComplaints((previous) => [response.data.complaint, ...previous]);
      setFormData(initialForm);
      setShowForm(false);
      setActiveTab("open");
      setSuccess("Your complaint was submitted successfully.");
    } catch (requestError) {
      console.error("Submit student complaint error:", requestError);
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to submit your complaint."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="student-complaints-page">
      <div className="student-complaints-breadcrumb">
        <Link to="/student">Dashboard</Link>
        <span aria-hidden="true">›</span>
        <strong>Complaints</strong>
      </div>

      <header className="student-complaints-heading">
        <div>
          <h1>Complaints</h1>
          <p>Raise your concerns and track their status.</p>
        </div>
        <button
          type="button"
          className="student-complaints-raise-button"
          onClick={() => {
            setError("");
            setSuccess("");
            setShowForm(true);
          }}
        >
          <FiPlus aria-hidden="true" /> Raise Complaint
        </button>
      </header>

      <section className="student-complaints-stats" aria-label="Complaint summary">
        <StatCard icon={<FiMessageCircle />} tone="purple" label="Total Complaints" value={loading ? "—" : stats.total} />
        <StatCard icon={<FiCheckCircle />} tone="green" label="Resolved" value={loading ? "—" : stats.resolved} />
        <StatCard icon={<FiClock />} tone="orange" label="In Progress" value={loading ? "—" : stats.inProgress} />
        <StatCard icon={<FiAlertCircle />} tone="red" label="Pending" value={loading ? "—" : stats.pending} />
      </section>

      {success && <div className="student-complaints-alert success" role="status">{success}</div>}
      {error && !showForm && (
        <div className="student-complaints-alert error" role="alert">
          <FiAlertCircle aria-hidden="true" /> {error}
          <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
            <FiRefreshCw aria-hidden="true" /> Retry
          </button>
        </div>
      )}

      <section className="student-complaints-panel">
        <div className="student-complaints-tabs" role="tablist" aria-label="Complaint list">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "open"}
            className={activeTab === "open" ? "active" : ""}
            onClick={() => setActiveTab("open")}
          >
            My Complaints
            <span>{stats.pending + stats.inProgress}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "resolved"}
            className={activeTab === "resolved" ? "active" : ""}
            onClick={() => setActiveTab("resolved")}
          >
            Resolved
            <span>{complaints.filter((item) => ["resolved", "rejected"].includes(item.status)).length}</span>
          </button>
        </div>

        {loading ? (
          <div className="student-complaints-state" role="status">Loading your complaints…</div>
        ) : error ? (
          <div className="student-complaints-state error" role="alert">
            <FiAlertCircle aria-hidden="true" />
            <strong>Complaints could not be loaded</strong>
            <span>{error}</span>
            <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
              <FiRefreshCw aria-hidden="true" /> Try again
            </button>
          </div>
        ) : visibleComplaints.length ? (
          <div className="student-complaints-table-wrap">
            <table className="student-complaints-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Raised On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleComplaints.map((complaint, index) => (
                  <tr key={complaint._id}>
                    <td>{index + 1}</td>
                    <td className="complaint-subject">
                      <strong>{complaint.subject}</strong>
                      <small>{complaint.description}</small>
                    </td>
                    <td>{formatCategory(complaint.category)}</td>
                    <td>
                      <span className={`student-complaint-status ${complaint.status}`}>
                        {complaint.status === "in-progress" ? "In Progress" : complaint.status}
                      </span>
                    </td>
                    <td>{formatDate(complaint.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="student-complaint-view"
                        onClick={() => setSelectedComplaint(complaint)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="student-complaints-state">
            <FiMessageCircle aria-hidden="true" />
            <strong>{activeTab === "open" ? "No open complaints" : "No resolved complaints yet"}</strong>
            <span>
              {activeTab === "open"
                ? "Your pending and in-progress complaints will appear here."
                : "Resolved or rejected complaints will appear here."}
            </span>
            {activeTab === "open" && (
              <button type="button" onClick={() => setShowForm(true)}>
                <FiPlus aria-hidden="true" /> Raise a complaint
              </button>
            )}
          </div>
        )}
      </section>

      <footer className="student-complaints-footer">
        <FiMessageCircle aria-hidden="true" />
        <span>“Your voice matters. A better campus is a shared responsibility.”</span>
        <em>— SmartCampus</em>
      </footer>

      {showForm && (
        <div
          className="student-complaints-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) setShowForm(false);
          }}
        >
          <section
            className="student-complaints-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-complaint-form-title"
          >
            <header>
              <div>
                <span>Student support</span>
                <h2 id="student-complaint-form-title">Raise a Complaint</h2>
              </div>
              <button
                type="button"
                aria-label="Close form"
                disabled={submitting}
                onClick={() => setShowForm(false)}
              >
                <FiX aria-hidden="true" />
              </button>
            </header>
            {error && <div className="student-complaints-modal-error" role="alert">{error}</div>}
            <form onSubmit={handleSubmit}>
              <label>
                Subject
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Briefly summarize your concern"
                  maxLength="120"
                  required
                />
              </label>
              <label>
                Category
                <select name="category" value={formData.category} onChange={handleChange}>
                  {CATEGORY_OPTIONS.map(([value, label]) => (
                    <option value={value} key={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label>
                Description
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Please provide details so the team can understand and address your concern"
                  rows="5"
                  maxLength="2000"
                  required
                />
              </label>
              <p>Your complaint will be visible to the campus administration for review.</p>
              <div className="student-complaints-form-actions">
                <button type="button" className="cancel" disabled={submitting} onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit" disabled={submitting}>
                  <FiSend aria-hidden="true" /> {submitting ? "Submitting…" : "Submit Complaint"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selectedComplaint && (
        <div
          className="student-complaints-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedComplaint(null);
          }}
        >
          <section
            className="student-complaints-modal student-complaint-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-complaint-detail-title"
          >
            <header>
              <div>
                <span>{formatCategory(selectedComplaint.category)}</span>
                <h2 id="student-complaint-detail-title">{selectedComplaint.subject}</h2>
              </div>
              <button type="button" aria-label="Close details" onClick={() => setSelectedComplaint(null)}>
                <FiX aria-hidden="true" />
              </button>
            </header>
            <div className="student-complaint-detail-content">
              <div className="student-complaint-detail-meta">
                <span className={`student-complaint-status ${selectedComplaint.status}`}>
                  {selectedComplaint.status === "in-progress" ? "In Progress" : selectedComplaint.status}
                </span>
                <span>Raised {formatDate(selectedComplaint.createdAt)}</span>
              </div>
              <h3>Description</h3>
              <p>{selectedComplaint.description}</p>
              {selectedComplaint.response && (
                <div className="student-complaint-response">
                  <strong>Administration response</strong>
                  <p>{selectedComplaint.response}</p>
                  {selectedComplaint.resolvedAt && <small>Updated {formatDate(selectedComplaint.resolvedAt)}</small>}
                </div>
              )}
              {!selectedComplaint.response && (
                <p className="student-complaint-awaiting">
                  The administration has not added a response yet.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, tone, label, value }) => (
  <article className="student-complaint-stat-card">
    <span className={`student-complaint-stat-icon ${tone}`}>{icon}</span>
    <div><span>{label}</span><strong>{value}</strong></div>
  </article>
);

export default Complaints;
