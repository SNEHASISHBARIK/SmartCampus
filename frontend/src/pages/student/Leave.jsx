import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DatePickerInput from "../../components/DatePickerInput";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiPlus,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";
import api from "../../services/api";
import "./Leave.css";

const emptyForm = {
  fromDate: "",
  toDate: "",
  reason: "",
  leaveType: "personal",
  documentUrl: "",
};

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

const leaveDays = (leave) => {
  const from = new Date(leave.fromDate);
  const to = new Date(leave.toDate);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
  const start = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const end = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.max(0, Math.floor((end - start) / 86400000) + 1);
};

const leaveTypeLabel = (type) =>
  String(type || "other").replace(/\b\w/g, (letter) => letter.toUpperCase());

const Leave = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [activeTab, setActiveTab] = useState("requests");
  const [showForm, setShowForm] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    const controller = new AbortController();

    const fetchLeaves = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/students/leaves", {
          signal: controller.signal,
        });
        const data = response.data;
        if (!Array.isArray(data?.leaves)) {
          throw new Error("Leave response has an invalid format.");
        }
        setLeaves(data.leaves);
      } catch (requestError) {
        if (requestError.code === "ERR_CANCELED") return;
        console.error("Student leave requests error:", requestError);
        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Unable to load your leave requests."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchLeaves();
    return () => controller.abort();
  }, [reloadKey]);

  const stats = useMemo(() => {
    const pending = leaves.filter((leave) => leave.status === "pending").length;
    const approvedLeaves = leaves.filter((leave) => leave.status === "approved");
    const approvedDays = approvedLeaves.reduce((total, leave) => total + leaveDays(leave), 0);
    return {
      total: leaves.length,
      approved: approvedLeaves.length,
      approvedDays,
      pending,
    };
  }, [leaves]);

  const visibleLeaves = useMemo(
    () =>
      activeTab === "requests"
        ? leaves.filter((leave) => leave.status === "pending")
        : leaves.filter((leave) => leave.status === "approved" || leave.status === "rejected"),
    [activeTab, leaves]
  );

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.fromDate || !formData.toDate || !formData.reason.trim()) {
      setError("Please provide both dates and a reason for your leave.");
      return;
    }
    if (formData.fromDate > formData.toDate) {
      setError("The end date must be on or after the start date.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post("/students/leaves", {
        ...formData,
        reason: formData.reason.trim(),
        documentUrl: formData.documentUrl.trim(),
      });
      if (!response.data?.success || !response.data?.leave) {
        throw new Error(response.data?.message || "The leave request was not saved.");
      }
      setLeaves((previous) =>
        [response.data.leave, ...previous].sort(
          (first, second) =>
            new Date(second.createdAt || second.fromDate) -
            new Date(first.createdAt || first.fromDate)
        )
      );
      setFormData(emptyForm);
      setShowForm(false);
      setActiveTab("requests");
      setSuccess("Leave application submitted. It is now awaiting review.");
    } catch (requestError) {
      console.error("Submit student leave request error:", requestError);
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to submit your leave request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="student-leave-page">
      <div className="student-leave-breadcrumb">
        <Link to="/student">Dashboard</Link>
        <span aria-hidden="true">›</span>
        <strong>Leave Application</strong>
      </div>

      <header className="student-leave-heading">
        <div>
          <h1>Leave Application</h1>
          <p>Apply for leave and track your request status.</p>
        </div>
        <button
          type="button"
          className="student-leave-apply-button"
          onClick={() => {
            setError("");
            setSuccess("");
            setShowForm(true);
          }}
        >
          <FiPlus aria-hidden="true" /> Apply for Leave
        </button>
      </header>

      <section className="student-leave-stats" aria-label="Leave request summary">
        <StatCard icon={<FiCalendar />} tone="blue" label="Total Requests" value={loading ? "—" : stats.total} />
        <StatCard icon={<FiFileText />} tone="red" label="Approved Requests" value={loading ? "—" : stats.approved} />
        <StatCard icon={<FiCheckCircle />} tone="green" label="Approved Calendar Days" value={loading ? "—" : stats.approvedDays} />
        <StatCard icon={<FiClock />} tone="orange" label="Pending Requests" value={loading ? "—" : stats.pending} />
      </section>

      {success && <div className="student-leave-alert success" role="status">{success}</div>}
      {error && !showForm && (
        <div className="student-leave-alert error" role="alert">
          <FiAlertCircle aria-hidden="true" /> {error}
          <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
            <FiRefreshCw aria-hidden="true" /> Retry
          </button>
        </div>
      )}

      <section className="student-leave-table-panel">
        <div className="student-leave-tabs" role="tablist" aria-label="Leave requests">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "requests"}
            className={activeTab === "requests" ? "active" : ""}
            onClick={() => setActiveTab("requests")}
          >
            My Leave Requests
            <span>{leaves.filter((leave) => leave.status === "pending").length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "history"}
            className={activeTab === "history" ? "active" : ""}
            onClick={() => setActiveTab("history")}
          >
            Leave History
            <span>{leaves.filter((leave) => ["approved", "rejected"].includes(leave.status)).length}</span>
          </button>
        </div>

        {loading ? (
          <div className="student-leave-state" role="status">Loading your leave requests…</div>
        ) : error ? (
          <div className="student-leave-state error" role="alert">
            <FiAlertCircle aria-hidden="true" />
            <strong>Leave requests could not be loaded</strong>
            <span>{error}</span>
            <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
              <FiRefreshCw aria-hidden="true" /> Try again
            </button>
          </div>
        ) : visibleLeaves.length ? (
          <div className="student-leave-table-wrap">
            <table className="student-leave-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>From Date</th>
                  <th>To Date</th>
                  <th>No. of Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Applied On</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleLeaves.map((leave, index) => (
                  <tr key={leave._id}>
                    <td>{index + 1}</td>
                    <td>{formatDate(leave.fromDate)}</td>
                    <td>{formatDate(leave.toDate)}</td>
                    <td>{leaveDays(leave)}</td>
                    <td>
                      <strong>{leave.reason}</strong>
                      <small>{leaveTypeLabel(leave.leaveType)}</small>
                    </td>
                    <td>
                      <span className={`student-leave-status ${leave.status}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td>{formatDate(leave.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="student-leave-view-button"
                        onClick={() => setSelectedLeave(leave)}
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
          <div className="student-leave-state">
            <FiCalendar aria-hidden="true" />
            <strong>{activeTab === "requests" ? "No pending leave requests" : "No leave history yet"}</strong>
            <span>
              {activeTab === "requests"
                ? "New leave applications will appear here until they are reviewed."
                : "Approved and rejected leave requests will appear here."}
            </span>
            {activeTab === "requests" && (
              <button type="button" onClick={() => setShowForm(true)}>
                <FiPlus aria-hidden="true" /> Apply for leave
              </button>
            )}
          </div>
        )}
      </section>

      <footer className="student-leave-footer">
        <FiBookOpenIcon />
        <span>“Take rest when needed, to perform better tomorrow.”</span>
        <em>— SmartCampus</em>
      </footer>

      {showForm && (
        <div
          className="student-leave-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) setShowForm(false);
          }}
        >
          <section
            className="student-leave-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-leave-form-title"
          >
            <header>
              <div>
                <span>New application</span>
                <h2 id="student-leave-form-title">Apply for Leave</h2>
              </div>
              <button type="button" aria-label="Close form" disabled={submitting} onClick={() => setShowForm(false)}>
                <FiX aria-hidden="true" />
              </button>
            </header>
            {error && <div className="student-leave-modal-error" role="alert">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="student-leave-form-row">
                <div className="student-leave-date-field">
                  <label htmlFor="student-leave-from-date">From Date</label>
                  <DatePickerInput
                    id="student-leave-from-date"
                    name="fromDate"
                    value={formData.fromDate}
                    onChange={handleFormChange}
                    max={formData.toDate || undefined}
                    required
                  />
                </div>
                <div className="student-leave-date-field">
                  <label htmlFor="student-leave-to-date">To Date</label>
                  <DatePickerInput
                    id="student-leave-to-date"
                    name="toDate"
                    value={formData.toDate}
                    onChange={handleFormChange}
                    min={formData.fromDate || undefined}
                    required
                  />
                </div>
              </div>
              <label>
                Leave Type
                <select name="leaveType" value={formData.leaveType} onChange={handleFormChange}>
                  <option value="medical">Medical</option>
                  <option value="personal">Personal</option>
                  <option value="family">Family</option>
                  <option value="academic">Academic</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                Reason
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleFormChange}
                  placeholder="Briefly explain the reason for your leave"
                  rows="4"
                  maxLength="1000"
                  required
                />
              </label>
              <label>
                Supporting document URL <span>(optional)</span>
                <input
                  type="url"
                  name="documentUrl"
                  value={formData.documentUrl}
                  onChange={handleFormChange}
                  placeholder="https://..."
                />
              </label>
              <p className="student-leave-form-note">
                Your request will remain pending until reviewed by an administrator.
              </p>
              <div className="student-leave-form-actions">
                <button type="button" className="cancel" disabled={submitting} onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit Application"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selectedLeave && (
        <div
          className="student-leave-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedLeave(null);
          }}
        >
          <section
            className="student-leave-modal student-leave-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-leave-detail-title"
          >
            <header>
              <div>
                <span>Leave application</span>
                <h2 id="student-leave-detail-title">{leaveTypeLabel(selectedLeave.leaveType)}</h2>
              </div>
              <button type="button" aria-label="Close details" onClick={() => setSelectedLeave(null)}>
                <FiX aria-hidden="true" />
              </button>
            </header>
            <dl>
              <div><dt>Dates</dt><dd>{formatDate(selectedLeave.fromDate)} – {formatDate(selectedLeave.toDate)}</dd></div>
              <div><dt>Duration</dt><dd>{leaveDays(selectedLeave)} calendar days</dd></div>
              <div><dt>Status</dt><dd><span className={`student-leave-status ${selectedLeave.status}`}>{selectedLeave.status}</span></dd></div>
              <div><dt>Applied on</dt><dd>{formatDate(selectedLeave.createdAt)}</dd></div>
              <div className="full"><dt>Reason</dt><dd>{selectedLeave.reason}</dd></div>
              {selectedLeave.reviewComment && (
                <div className="full"><dt>Review comment</dt><dd>{selectedLeave.reviewComment}</dd></div>
              )}
              {selectedLeave.documentUrl && (
                <div className="full"><dt>Supporting document</dt><dd><a href={selectedLeave.documentUrl} target="_blank" rel="noreferrer">Open document</a></dd></div>
              )}
            </dl>
          </section>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, tone, label, value }) => (
  <article className="student-leave-stat-card">
    <span className={`student-leave-stat-icon ${tone}`}>{icon}</span>
    <div><span>{label}</span><strong>{value}</strong></div>
  </article>
);

const FiBookOpenIcon = () => <FiFileText aria-hidden="true" />;

export default Leave;
