import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiCalendar,
  FiClock,
  FiDownload,
  FiFileText,
  FiRefreshCw,
  FiSearch,
  FiUser,
  FiUpload,
} from "react-icons/fi";
import api from "../../services/api";
import "./Assignments.css";

const formatDate = (value) => {
  if (!value) return "Due date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Due date unavailable";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const attachmentHref = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `http://localhost:5000/${url.replace(/^\/+/, "")}`;
};

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [now] = useState(() => new Date());
  const [submissionForms, setSubmissionForms] = useState({});
  const [submittingId, setSubmittingId] = useState("");
  const [submissionMessages, setSubmissionMessages] = useState({});

  useEffect(() => {
    const controller = new AbortController();

    const fetchAssignments = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/students/assignments", {
          signal: controller.signal,
        });
        const data = response.data;
        if (!Array.isArray(data?.assignments)) {
          throw new Error("Assignments response has an invalid format.");
        }
        setAssignments(data.assignments);
      } catch (requestError) {
        if (requestError.code === "ERR_CANCELED") return;
        console.error("Student assignments error:", requestError);
        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Unable to load your assignments."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchAssignments();
    return () => controller.abort();
  }, [reloadKey]);

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return assignments;
    return assignments.filter((assignment) =>
      [
        assignment.title,
        assignment.description,
        assignment.subject?.name,
        assignment.subject?.code,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [assignments, search]);

  const upcomingCount = assignments.filter(
    (assignment) =>
      assignment.dueDate && new Date(assignment.dueDate).getTime() >= now.getTime()
  ).length;

  const handleSubmitAssignment = async (assignmentId) => {
    const form = submissionForms[assignmentId] || {};
    const answer = (form.answer || "").trim();
    const file = form.file;

    if (!answer && !file) {
      setSubmissionMessages((previous) => ({
        ...previous,
        [assignmentId]: {
          type: "error",
          text: "Write an answer or select a PDF file.",
        },
      }));
      return;
    }

    if (file) {
      const isPdf =
        file.type === "application/pdf" &&
        file.name.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        setSubmissionMessages((previous) => ({
          ...previous,
          [assignmentId]: {
            type: "error",
            text: "Please select a PDF file.",
          },
        }));
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setSubmissionMessages((previous) => ({
          ...previous,
          [assignmentId]: {
            type: "error",
            text: "The PDF must be 10 MB or smaller.",
          },
        }));
        return;
      }
    }

    const formData = new FormData();
    formData.append("answer", answer);

    if (file) {
      formData.append("file", file);
    }

    setSubmittingId(assignmentId);
    setSubmissionMessages((previous) => ({
      ...previous,
      [assignmentId]: { type: "", text: "" },
    }));

    try {
      const response = await api.post(
        `/submissions/${assignmentId}`,
        formData
      );

      setSubmissionMessages((previous) => ({
        ...previous,
        [assignmentId]: {
          type: "success",
          text:
            response.data?.message ||
            "Assignment submitted successfully.",
        },
      }));

      setSubmissionForms((previous) => ({
        ...previous,
        [assignmentId]: { answer: "", file: null },
      }));

      const fileInput = document.getElementById(
        `submission-file-${assignmentId}`
      );

      if (fileInput) fileInput.value = "";
    } catch (error) {
      setSubmissionMessages((previous) => ({
        ...previous,
        [assignmentId]: {
          type: "error",
          text:
            error.response?.data?.message ||
            "Unable to submit assignment. Please try again.",
        },
      }));
    } finally {
      setSubmittingId("");
    }
  };

  return (
    <div className="student-assignments-page">
      <div className="student-assignments-breadcrumb">
        <Link to="/student">Dashboard</Link>
        <span aria-hidden="true">›</span>
        <strong>Assignments</strong>
      </div>

      <header className="student-assignments-heading">
        <div>
          <h1>Assignments</h1>
          <p>View your active assignments and submission deadlines.</p>
        </div>
        {!loading && !error && (
          <div className="student-assignments-count">
            <strong>{assignments.length}</strong>
            <span>Active assignments</span>
          </div>
        )}
      </header>

      {!loading && !error && assignments.length > 0 && (
        <div className="student-assignments-toolbar">
          <span>
            <FiCalendar aria-hidden="true" />
            {upcomingCount} upcoming {upcomingCount === 1 ? "deadline" : "deadlines"}
          </span>
          <label>
            <FiSearch aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assignments or subjects"
              aria-label="Search assignments"
            />
          </label>
        </div>
      )}

      {loading ? (
        <div className="student-assignments-state" role="status">
          Loading your assignments…
        </div>
      ) : error ? (
        <div className="student-assignments-state error" role="alert">
          <FiAlertCircle aria-hidden="true" />
          <strong>Assignments could not be loaded</strong>
          <span>{error}</span>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
            <FiRefreshCw aria-hidden="true" /> Try again
          </button>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="student-assignments-state">
          <FiFileText aria-hidden="true" />
          <strong>{search ? "No matching assignments" : "No active assignments found"}</strong>
          <span>
            {search
              ? "Try another title, subject name, or subject code."
              : "Assignments published for your current semester and department will appear here."}
          </span>
          {search ? (
            <button type="button" onClick={() => setSearch("")}>Clear search</button>
          ) : (
            <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
              <FiRefreshCw aria-hidden="true" /> Refresh
            </button>
          )}
        </div>
      ) : (
        <div className="student-assignments-grid">
          {filteredAssignments.map((assignment) => {
            const overdue =
              assignment.dueDate &&
              new Date(assignment.dueDate).getTime() < now.getTime();
            const facultyName = assignment.faculty?.user?.name;
            return (
              <article className="student-assignment-card" key={assignment._id}>
                <header>
                  <div className="student-assignment-title-icon">
                    <FiFileText aria-hidden="true" />
                  </div>
                  <div className="student-assignment-title">
                    <h2>{assignment.title}</h2>
                    <span>
                      {assignment.subject?.name ||
                        assignment.subject?.code ||
                        "Subject unavailable"}
                      {assignment.subject?.code && assignment.subject?.name
                        ? ` · ${assignment.subject.code}`
                        : ""}
                    </span>
                  </div>
                  <span className={`student-assignment-status ${overdue ? "overdue" : ""}`}>
                    {overdue ? "Overdue" : "Active"}
                  </span>
                </header>

                <a
                  className="student-assignment-submit-link"
                  href={`#submission-form-${assignment._id}`}
                >
                  <FiUpload aria-hidden="true" />
                  Submit / Upload
                </a>

                {assignment.description && (
                  <p className="student-assignment-description">
                    {assignment.description}
                  </p>
                )}

                <div className="student-assignment-meta">
                  <span className={overdue ? "overdue" : ""}>
                    <FiClock aria-hidden="true" />
                    Due {formatDate(assignment.dueDate)}
                  </span>
                  <span>
                    <FiFileText aria-hidden="true" />
                    {assignment.totalMarks ?? "—"} marks
                  </span>
                  {facultyName && (
                    <span>
                      <FiUser aria-hidden="true" />
                      {facultyName}
                    </span>
                  )}
                </div>

                {assignment.attachmentUrl && (
                  <a
                    className="student-assignment-attachment"
                    href={attachmentHref(assignment.attachmentUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FiDownload aria-hidden="true" /> Open assignment attachment
                  </a>
                )}

                <div
                  className="student-assignment-submission"
                  id={`submission-form-${assignment._id}`}
                >
                  <h3>Submit your assignment</h3>

                  <label htmlFor={`submission-answer-${assignment._id}`}>
                    Your answer
                  </label>

                  <textarea
                    id={`submission-answer-${assignment._id}`}
                    rows={3}
                    placeholder="Write your answer here (optional if uploading a PDF)"
                    value={submissionForms[assignment._id]?.answer || ""}
                    onChange={(event) =>
                      setSubmissionForms((previous) => ({
                        ...previous,
                        [assignment._id]: {
                          ...previous[assignment._id],
                          answer: event.target.value,
                        },
                      }))
                    }
                  />

                  <label htmlFor={`submission-file-${assignment._id}`}>
                    Upload answer as PDF (optional)
                  </label>

                  <input
                    id={`submission-file-${assignment._id}`}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(event) =>
                      setSubmissionForms((previous) => ({
                        ...previous,
                        [assignment._id]: {
                          ...previous[assignment._id],
                          file: event.target.files?.[0] || null,
                        },
                      }))
                    }
                  />

                  {submissionMessages[assignment._id]?.text && (
                    <p
                      className={`submission-message ${
                        submissionMessages[assignment._id].type
                      }`}
                      role="status"
                    >
                      {submissionMessages[assignment._id].text}
                    </p>
                  )}

                  <button
                    type="button"
                    className="student-assignment-submit-button"
                    disabled={submittingId === assignment._id}
                    onClick={() => handleSubmitAssignment(assignment._id)}
                  >
                    <FiUpload aria-hidden="true" />
                    {submittingId === assignment._id
                      ? "Submitting..."
                      : "Submit Assignment"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Assignments;
