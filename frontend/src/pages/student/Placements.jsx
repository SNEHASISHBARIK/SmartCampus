import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiFileText,
  FiRefreshCw,
  FiSearch,
  FiTarget,
  FiUsers,
  FiX,
  FiBookmark,
  FiPrinter,
  FiTrash2,
  FiZap,
  FiAward,
  FiBarChart2,
  FiCheck,
  FiLayers,
  FiEye,
  FiTrendingUp,
  FiHelpCircle,
  FiCpu,
  FiShield,
  FiColumns,
  FiCheckSquare,
  FiCompass,
  FiMinimize2,
} from "react-icons/fi";


import api from "../../services/api";
import "./Placements.css";
import PlacementPractice from "./PlacementPractice";
import MockInterview from "./MockInterview";

const PREPARATION_AREAS = [
  {
    title: "Problem Solving",
    icon: FiTarget,
    color: "blue",
    description: "Practice core data structures, algorithms, and explaining your approach clearly.",
    topics: "Arrays · Trees · Graphs · Complexity",
  },
  {
    title: "Technical Fundamentals",
    icon: FiBookOpen,
    color: "purple",
    description: "Refresh the concepts behind the tools and technologies you use in projects.",
    topics: "OOP · DBMS · Operating Systems · Networks",
  },
  {
    title: "Communication",
    icon: FiUsers,
    color: "orange",
    description: "Prepare concise examples of your work and practice presenting your ideas.",
    topics: "Resume · Projects · Interview practice",
  },
];

const cleanText = (str) =>
  typeof str === "string"
    ? str.replace(/â€“/g, "—").replace(/â€™/g, "'").replace(/â€œ/g, '"').replace(/â€/g, '"')
    : str || "";

const attachmentHref = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `http://localhost:5000/${url.replace(/^\/+/, "")}`;
};

const formatDate = (value) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const Placements = () => {
  const [notices, setNotices] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [jobsReloadKey, setJobsReloadKey] = useState(0);
  const [activeTab, setActiveTab] = useState("updates");
  const [search, setSearch] = useState("");
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  // Resume Analyzer state
  const [resumeJobId, setResumeJobId] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeAnalyzing, setResumeAnalyzing] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [resumeError, setResumeError] = useState("");
  const [resumeSubTab, setResumeSubTab] = useState("analyzer"); // "analyzer" | "history"
  const [resumeHistory, setResumeHistory] = useState([]);
  const [resumeHistoryLoading, setResumeHistoryLoading] = useState(false);
  const [historyDeleteId, setHistoryDeleteId] = useState(null);
  const [selectedComparisonIds, setSelectedComparisonIds] = useState([]);
  const [showComparisonView, setShowComparisonView] = useState(false);

  const [savedJobs, setSavedJobs] = useState([]);
  const [savedJobsLoading, setSavedJobsLoading] = useState(true);
  const [savedJobsError, setSavedJobsError] = useState("");
  const [savedJobsReloadKey, setSavedJobsReloadKey] = useState(0);
  const [savingJobId, setSavingJobId] = useState("");
  const [saveError, setSaveError] = useState("");
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationError, setApplicationError] = useState("");
  const [applicationJob, setApplicationJob] = useState(null);
  const [applicationStatus, setApplicationStatus] = useState("Applied");
  const [applicationNotes, setApplicationNotes] = useState("");
  const [applicationDate, setApplicationDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [applicationSaving, setApplicationSaving] = useState(false);

  const fetchApplications = useCallback(async () => {
    setApplicationsLoading(true);
    setApplicationError("");

    try {
      const response = await api.get("/placements/applications");
      const applicationList = response.data?.applications;

      if (!Array.isArray(applicationList)) {
        throw new Error("Invalid applications response from server.");
      }

      setApplications(applicationList);
    } catch (requestError) {
      console.error("Placement applications error:", requestError);
      setApplicationError(
        requestError.response?.data?.message || "Unable to load applications."
      );
    } finally {
      setApplicationsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchPlacementUpdates = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/students/notices", {
          signal: controller.signal,
        });
        if (!Array.isArray(response.data?.notices)) {
          throw new Error("Placement updates response has an invalid format.");
        }
        setNotices(
          response.data.notices.filter((notice) => notice.category === "placement")
        );
      } catch (requestError) {
        if (requestError.code === "ERR_CANCELED") return;
        console.error("Student placement updates error:", requestError);
        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Unable to load placement updates."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchPlacementUpdates();
    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchJobs = async () => {
      setJobsLoading(true);
      setJobsError("");

      try {
        const response = await api.get("/placements", {
          signal: controller.signal,
        });
        const jobList = response.data?.jobs;

        if (!Array.isArray(jobList)) {
          throw new Error("Invalid jobs response from server.");
        }

        setJobs(jobList);
      } catch (requestError) {
        if (requestError.code === "ERR_CANCELED") return;
        console.error("Placement jobs error:", requestError);
        setJobsError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Unable to load placement jobs."
        );
      } finally {
        if (!controller.signal.aborted) setJobsLoading(false);
      }
    };

    fetchJobs();
    return () => controller.abort();
  }, [jobsReloadKey]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchSavedJobs = async () => {
      setSavedJobsLoading(true);
      setSavedJobsError("");

      try {
        const response = await api.get("/placements/saved", {
          signal: controller.signal,
        });
        const savedJobList = response.data?.jobs;

        if (!Array.isArray(savedJobList)) {
          throw new Error("Invalid saved jobs response from server.");
        }

        setSavedJobs(savedJobList);
      } catch (requestError) {
        if (requestError.code === "ERR_CANCELED") return;
        console.error("Saved placement jobs error:", requestError);
        setSavedJobsError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Unable to load saved jobs."
        );
      } finally {
        if (!controller.signal.aborted) setSavedJobsLoading(false);
      }
    };

    fetchSavedJobs();
    return () => controller.abort();
  }, [savedJobsReloadKey]);

  const stats = useMemo(
    () => ({
      updates: notices.length,
      important: notices.filter((notice) => notice.priority === "High").length,
      attachments: notices.filter((notice) => Boolean(notice.attachmentUrl)).length,
    }),
    [notices]
  );

  const filteredNotices = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return notices;
    return notices.filter((notice) =>
      [notice.title, notice.content, notice.department?.name, notice.createdBy?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [notices, search]);

  const filteredJobs = useMemo(() => {
    const sourceJobs = activeTab === "saved" ? savedJobs : jobs;
    const query = jobSearch.trim().toLowerCase();
    if (!query) return sourceJobs;
    return sourceJobs.filter((job) =>
      [job.title, job.company, job.location, job.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [jobs, savedJobs, jobSearch, activeTab]);

  const toggleSavedJob = async (job) => {
    const jobId = job._id;

    if (!jobId || savingJobId) return;

    setSavingJobId(jobId);
    setSaveError("");

    try {
      const response = await api.post(`/placements/${jobId}/save`);
      const isSaved = response.data?.isSaved;

      if (typeof isSaved !== "boolean") {
        throw new Error("Invalid saved-job response from server.");
      }

      if (isSaved) {
        setSavedJobs((previous) =>
          previous.some((item) => item._id === jobId)
            ? previous
            : [{ ...job, isSaved: true }, ...previous]
        );
      } else {
        setSavedJobs((previous) =>
          previous.filter((item) => item._id !== jobId)
        );
      }
    } catch (requestError) {
      console.error("Update saved placement job error:", requestError);
      setSaveError(
        requestError.response?.data?.message || "Unable to update saved job."
      );
    } finally {
      setSavingJobId("");
    }
  };

  const saveApplication = async (event) => {
    event.preventDefault();

    if (!applicationJob || applicationSaving) return;

    setApplicationSaving(true);
    setApplicationError("");

    try {
      await api.put(`/placements/${applicationJob._id}/application`, {
        status: applicationStatus,
        notes: applicationNotes,
        appliedAt: applicationDate
          ? new Date(`${applicationDate}T12:00:00`).toISOString()
          : undefined,
      });

      await fetchApplications();
      setApplicationJob(null);
    } catch (requestError) {
      console.error("Save placement application error:", requestError);
      setApplicationError(
        requestError.response?.data?.message || "Unable to save application."
      );
    } finally {
      setApplicationSaving(false);
    }
  };

  const handleResumeAnalysis = async (event) => {
    event.preventDefault();

    if (!resumeJobId) {
      setResumeError("Please select a job.");
      return;
    }

    if (!resumeFile) {
      setResumeError("Please upload your resume.");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/x-pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "application/octet-stream",
    ];

    const fileName = (resumeFile.name || "").toLowerCase();
    const hasValidExt = fileName.endsWith(".pdf") || fileName.endsWith(".docx");

    if (!allowedTypes.includes(resumeFile.type) && !hasValidExt) {
      setResumeError("Please upload a PDF or DOCX file.");
      return;
    }

    if (resumeFile.size > 5 * 1024 * 1024) {
      setResumeError("Your resume must be 5 MB or smaller.");
      return;
    }

    const formData = new FormData();
    formData.append("jobId", resumeJobId);
    formData.append("resume", resumeFile);

    setResumeAnalyzing(true);
    setResumeError("");
    setResumeAnalysis(null);

    try {
      const response = await api.post(
        "/resume-analyzer/analyze",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!response.data?.success || !response.data?.analysis) {
        throw new Error("The server returned an invalid analysis response.");
      }

      setResumeAnalysis({
        ...response.data.analysis,
        jobTitle: response.data.job?.title,
        company: response.data.job?.company,
        isCached: !!response.data.isCached,
      });
      fetchResumeHistory();
    } catch (error) {
      console.error("Resume analysis error:", error);

      setResumeError(
        error.response?.data?.message ||
          (error.code === "ECONNABORTED"
            ? "The analysis took too long. Please try again."
            : error.message === "Network Error"
              ? "Cannot connect to the backend. Check that your backend and Python AI service are running."
              : "Unable to analyze your resume. Please try again.")
      );
    } finally {
      setResumeAnalyzing(false);
    }
  };

  const fetchResumeHistory = useCallback(async () => {
    try {
      setResumeHistoryLoading(true);
      const res = await api.get("/resume-analyzer/history");
      if (res.data?.success) {
        setResumeHistory(res.data.history || []);
      }
    } catch (err) {
      console.warn("Failed to load resume analysis history:", err);
    } finally {
      setResumeHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "resume") {
      fetchResumeHistory();
    }
  }, [activeTab, fetchResumeHistory]);

  const handleDownloadReport = () => {
    window.print();
  };

  const handleSelectHistoryItem = (item) => {
    setResumeAnalysis({
      ...item,
      jobTitle: item.jobTitle,
      company: item.company,
      historyId: item._id,
      isCached: item.method === "cached",
    });
    setResumeSubTab("analyzer");
    window.scrollTo({ top: 320, behavior: "smooth" });
  };

  const handleDeleteHistoryItem = async (id, event) => {
    event.stopPropagation();
    try {
      setHistoryDeleteId(id);
      await api.delete(`/resume-analyzer/history/${id}`);
      setResumeHistory((prev) => prev.filter((item) => item._id !== id));
      if (resumeAnalysis?.historyId === id) {
        setResumeAnalysis(null);
      }
    } catch (err) {
      console.error("Failed to delete history item:", err);
    } finally {
      setHistoryDeleteId(null);
    }
  };

  const toggleComparisonSelection = (id, event) => {
    if (event) event.stopPropagation();
    setSelectedComparisonIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCompareTopJobs = () => {
    if (resumeHistory.length < 2) return;
    const topIds = [...resumeHistory]
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .slice(0, 3)
      .map((item) => item._id);
    setSelectedComparisonIds(topIds);
    setShowComparisonView(true);
  };

  const comparisonItems = useMemo(() => {
    return resumeHistory.filter((item) => selectedComparisonIds.includes(item._id));
  }, [resumeHistory, selectedComparisonIds]);

  return (
    <div className="student-placements-page">
      <div className="student-placements-breadcrumb">
        <Link to="/student">Dashboard</Link>
        <span aria-hidden="true">›</span>
        <strong>Placements</strong>
      </div>

      <header className="student-placements-heading">
        <div>
          <h1>Placement Cell</h1>
          <p>Explore placement announcements and prepare for your next opportunity.</p>
        </div>
        <span className="student-placements-heading-icon"><FiBriefcase aria-hidden="true" /></span>
      </header>

      <section className="student-placements-stats" aria-label="Placement updates summary">
        <StatCard icon={<FiBriefcase />} tone="blue" label="Placement Updates" value={loading ? "—" : stats.updates} />
        <StatCard icon={<FiAlertCircle />} tone="orange" label="Important Updates" value={loading ? "—" : stats.important} />
        <StatCard icon={<FiFileText />} tone="green" label="With Attachments" value={loading ? "—" : stats.attachments} />
      </section>

      <section className="student-placements-panel">
        <div className="student-placements-toolbar">
          <div className="student-placements-tabs" role="tablist" aria-label="Placement sections">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "updates"}
              className={activeTab === "updates" ? "active" : ""}
              onClick={() => setActiveTab("updates")}
            >
              Placement Updates
              <span>{loading ? "—" : stats.updates}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "jobs"}
              className={activeTab === "jobs" ? "active" : ""}
              onClick={() => setActiveTab("jobs")}
            >
              Job Opportunities
              <span>{jobsLoading ? "—" : jobs.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "saved"}
              className={activeTab === "saved" ? "active" : ""}
              onClick={() => setActiveTab("saved")}
            >
              Saved Jobs
              <span>{savedJobsLoading ? "—" : savedJobs.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "applications"}
              className={activeTab === "applications" ? "active" : ""}
              onClick={() => {
                setActiveTab("applications");
                fetchApplications();
              }}
            >
              My Applications
              <span>{applications.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "preparation"}
              className={activeTab === "preparation" ? "active" : ""}
              onClick={() => setActiveTab("preparation")}
            >
              Preparation Guide
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "resume"}
              className={activeTab === "resume" ? "active" : ""}
              onClick={() => setActiveTab("resume")}
            >
              <FiFileText aria-hidden="true" />
              <span>Resume Analyzer</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "ai-practice"}
              className={activeTab === "ai-practice" ? "active" : ""}
              onClick={() => setActiveTab("ai-practice")}
            >
              <FiCpu />
              <span>AI Placement Practice</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "mock-interview"}
              className={activeTab === "mock-interview" ? "active" : ""}
              onClick={() => setActiveTab("mock-interview")}
            >
              <FiColumns />
              <span>AI Mock Interview</span>
            </button>
          </div>
          {(activeTab === "updates" ||
            activeTab === "jobs" ||
            activeTab === "saved") && (
            <label className="student-placements-search">
              <FiSearch aria-hidden="true" />
              <span className="sr-only">
                {activeTab === "updates"
                  ? "Search placement updates"
                  : activeTab === "saved"
                    ? "Search saved jobs"
                    : "Search jobs"}
              </span>
              <input
                type="search"
                value={activeTab === "updates" ? search : jobSearch}
                onChange={(event) =>
                  activeTab === "updates"
                    ? setSearch(event.target.value)
                    : setJobSearch(event.target.value)
                }
                placeholder={
                  activeTab === "updates"
                    ? "Search updates..."
                    : activeTab === "saved"
                      ? "Search saved jobs by title, company, or location..."
                      : "Search jobs by title, company, or location..."
                }
              />
            </label>
          )}
        </div>

        {activeTab === "mock-interview" ? (
          <MockInterview />
        ) : activeTab === "ai-practice" ? (
          <PlacementPractice />
        ) : activeTab === "resume" ? (
          <div className="student-placement-resume">
            <div className="student-placement-section-intro">
              <span>
                <FiFileText aria-hidden="true" />
              </span>
              <div>
                <h2>AI Resume Analyzer & Job Alignment</h2>
                <p>
                  Evaluate your resume against real job requirements with AI skill mapping, match scoring, and tailored interview prep.
                </p>
              </div>
            </div>

            {/* Sub-navigation for Analyzer vs History */}
            <div className="resume-analyzer-subtabs">
              <button
                type="button"
                className={resumeSubTab === "analyzer" ? "active" : ""}
                onClick={() => setResumeSubTab("analyzer")}
              >
                <FiFileText /> Analyzer & Report
              </button>
              <button
                type="button"
                className={resumeSubTab === "history" ? "active" : ""}
                onClick={() => {
                  setResumeSubTab("history");
                  fetchResumeHistory();
                }}
              >
                <FiClock /> Analysis History & Comparisons
                {resumeHistory.length > 0 && (
                  <span className="history-pill">{resumeHistory.length}</span>
                )}
              </button>
            </div>

            {resumeSubTab === "analyzer" ? (
              <div className="resume-analyzer-workspace">
                <form
                  onSubmit={handleResumeAnalysis}
                  className="student-placement-resume-form"
                >
                  <label htmlFor="resume-job">Select Target Job Opportunity</label>
                  <select
                    id="resume-job"
                    value={resumeJobId}
                    onChange={(event) => setResumeJobId(event.target.value)}
                    required
                  >
                    <option value="">Choose a job to compare against...</option>
                    {jobs.map((job) => (
                      <option key={job._id} value={job._id}>
                        {job.title} — {job.company || "Company not specified"}
                      </option>
                    ))}
                  </select>

                  <label htmlFor="resume-file">
                    Upload Resume (PDF or DOCX, maximum 5 MB)
                  </label>
                  <div className="resume-file-input-wrapper">
                    <input
                      id="resume-file"
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        setResumeFile(file);
                        setResumeError("");
                      }}
                      required
                    />
                    {resumeFile && (
                      <div className="resume-file-selected-badge">
                        <FiCheckCircle /> Selected: <strong>{resumeFile.name}</strong> ({(resumeFile.size / 1024).toFixed(1)} KB)
                      </div>
                    )}
                  </div>

                  {resumeError && (
                    <div role="alert" className="resume-error-banner">
                      <FiAlertCircle />
                      <div className="resume-error-text">
                        <strong>Analysis Failed</strong>
                        <span>{resumeError} Please try again later.</span>
                      </div>
                    </div>
                  )}

                  <div className="resume-form-actions">
                    <button
                      type="submit"
                      disabled={resumeAnalyzing || jobs.length === 0}
                      className="resume-submit-btn"
                    >
                      {resumeAnalyzing ? (
                        <>
                          <FiRefreshCw className="spin" /> Analyzing Resume with AI...
                        </>
                      ) : (
                        <>
                          <FiTarget /> Analyze Resume Match
                        </>
                      )}
                    </button>
                    {resumeHistory.length > 0 && !resumeAnalysis && (
                      <button
                        type="button"
                        className="resume-view-recent-btn"
                        onClick={() => handleSelectHistoryItem(resumeHistory[0])}
                      >
                        <FiClock /> View Recent Analysis ({resumeHistory[0].matchScore}%)
                      </button>
                    )}
                  </div>
                </form>

                {resumeAnalysis && (
                  <section className="student-placement-resume-results printable-analysis-container">
                    {/* Results Action Bar */}
                    <div className="resume-results-header">
                      <div className="resume-results-title-meta">
                        <span className="resume-results-badge">
                          <FiAward /> Job Compatibility Report
                        </span>
                        <h2>
                          {cleanText(resumeAnalysis.jobTitle) || "Job Opportunity"}
                        </h2>
                        <p className="resume-results-company">
                          {resumeAnalysis.company || "Target Company"}
                          {resumeAnalysis.analyzedAt && (
                            <span className="resume-results-date">
                              {" "}• Analyzed on {new Date(resumeAnalysis.analyzedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="resume-results-actions no-print">
                        <button
                          type="button"
                          className="resume-action-btn primary"
                          onClick={handleDownloadReport}
                          title="Print or export as PDF report"
                        >
                          <FiPrinter /> Print / Download PDF Report
                        </button>
                        <button
                          type="button"
                          className="resume-action-btn secondary"
                          onClick={() => {
                            setResumeAnalysis(null);
                            setResumeFile(null);
                          }}
                          title="Clear current view"
                        >
                          <FiRefreshCw /> Analyze Another
                        </button>
                      </div>
                    </div>

                    {/* Engine Mode Badge (AI-Powered vs Rule-Based vs Cached) */}
                    <div className="resume-engine-badge-container no-print">
                      {resumeAnalysis.isCached ? (
                        <div className="resume-engine-badge cache">
                          <span className="engine-badge-icon"><FiClock /></span>
                          <div className="engine-badge-text">
                            <strong>Analysis Method: Instant Cache ⚡ ({resumeAnalysis.method === "rule-based" || resumeAnalysis.method === "heuristic-fallback" ? "Rule-Based" : "Gemini AI"})</strong>
                            <span>Status: Retrieved from history; pre-computed match loaded instantly without consuming quota</span>
                          </div>
                        </div>
                      ) : resumeAnalysis.method === "rule-based" || resumeAnalysis.method === "heuristic-fallback" || resumeAnalysis.method === "heuristic" ? (
                        <div className="resume-engine-badge rule">
                          <span className="engine-badge-icon"><FiCpu /></span>
                          <div className="engine-badge-text">
                            <strong>Analysis Method: Rule-Based Analysis ⚙️</strong>
                            <span>Status: Gemini unavailable; fallback analysis used</span>
                          </div>
                        </div>
                      ) : (
                        <div className="resume-engine-badge ai">
                          <span className="engine-badge-icon"><FiZap /></span>
                          <div className="engine-badge-text">
                            <strong>Analysis Method: Gemini AI ✨</strong>
                            <span>Status: AI analysis completed successfully</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 1. Visual Match-Score Gauge & Progress Bar with Technical vs Experience Breakdown */}
                    <div className="resume-score-card">
                      <div className="resume-score-visual">
                        <div
                          className={`resume-score-circle ${
                            resumeAnalysis.matchScore >= 80
                              ? "high"
                              : resumeAnalysis.matchScore >= 55
                                ? "medium"
                                : "low"
                          }`}
                        >
                          <span className="resume-score-number">
                            {resumeAnalysis.matchScore ?? 0}
                            <small>%</small>
                          </span>
                          <span className="resume-score-label">Overall Match</span>
                        </div>
                      </div>

                      <div className="resume-score-details">
                        <div className="resume-score-badge-row">
                          <span
                            className={`match-level-badge ${
                              resumeAnalysis.matchScore >= 80
                                ? "high"
                                : resumeAnalysis.matchScore >= 55
                                  ? "medium"
                                  : "low"
                            }`}
                          >
                            {resumeAnalysis.matchScore >= 80
                              ? "🌟 Strong Candidate Match"
                              : resumeAnalysis.matchScore >= 55
                                ? "⚡ Competitive Match"
                                : "🎯 Skills Gap Identified"}
                          </span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="resume-score-progressbar-wrapper">
                          <div className="resume-score-bar-bg">
                            <div
                              className={`resume-score-bar-fill ${
                                resumeAnalysis.matchScore >= 80
                                  ? "high"
                                  : resumeAnalysis.matchScore >= 55
                                    ? "medium"
                                    : "low"
                              }`}
                              style={{ width: `${Math.max(resumeAnalysis.matchScore || 0, 5)}%` }}
                            />
                          </div>
                          <div className="resume-score-milestones">
                            <span>0%</span>
                            <span>25%</span>
                            <span>50%</span>
                            <span>75%</span>
                            <span>100%</span>
                          </div>
                        </div>

                        {/* Dual Score Breakdown: Technical Skills vs Experience & Seniority */}
                        <div className="resume-subscores-grid">
                          <div className="resume-subscore-card">
                            <div className="subscore-header">
                              <span className="subscore-title"><FiTarget /> Core Technical Skills</span>
                              <strong className="subscore-value">{resumeAnalysis.technicalScore ?? resumeAnalysis.matchScore}%</strong>
                            </div>
                            <div className="subscore-bar-bg">
                              <div
                                className="subscore-bar-fill technical"
                                style={{ width: `${Math.max(resumeAnalysis.technicalScore ?? resumeAnalysis.matchScore, 5)}%` }}
                              />
                            </div>
                            <span className="subscore-caption">Direct match of programming languages, tools & frameworks</span>
                          </div>

                          <div className="resume-subscore-card">
                            <div className="subscore-header">
                              <span className="subscore-title"><FiBriefcase /> Experience & Seniority</span>
                              <strong className="subscore-value">{resumeAnalysis.experienceScore ?? 75}%</strong>
                            </div>
                            <div className="subscore-bar-bg">
                              <div
                                className="subscore-bar-fill experience"
                                style={{ width: `${Math.max(resumeAnalysis.experienceScore ?? 75, 5)}%` }}
                              />
                            </div>
                            <span className="subscore-caption">Alignment with career stage, role scope & tenure requirements</span>
                          </div>
                        </div>

                        {/* Seniority Alignment Tags */}
                        <div className="resume-seniority-tags-row">
                          <span className="seniority-label">Seniority Alignment:</span>
                          <span className="seniority-pill candidate">
                            <FiUsers /> Resume: {resumeAnalysis.seniorityDetected || "Entry-Level / Student"}
                          </span>
                          <span className="seniority-separator">vs</span>
                          <span className="seniority-pill role">
                            <FiBriefcase /> Role: {resumeAnalysis.seniorityRequired || "Entry-Level"}
                          </span>
                        </div>

                        {resumeAnalysis.summary && (
                          <p className="resume-score-summary">
                            {resumeAnalysis.summary}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 2. Skills Tags (🟢 Matched vs Prioritized 🔴 Critical Must-Haves & 🟡 Secondary) */}
                    <div className="resume-skills-matrix-grid">
                      <div className="resume-skills-block matched-block">
                        <div className="skills-block-header">
                          <span className="skills-status-indicator green" />
                          <h3>
                            Matched Skills ({resumeAnalysis.matchedSkills?.length || 0})
                          </h3>
                        </div>
                        {resumeAnalysis.matchedSkills?.length ? (
                          <div className="resume-skills-tags-container">
                            {resumeAnalysis.matchedSkills.map((skill, index) => (
                              <span
                                key={`matched-${skill}-${index}`}
                                className="resume-skill-tag matched"
                              >
                                <FiCheck /> {skill}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="resume-no-skills-msg">
                            No direct skill matches found in resume text.
                          </p>
                        )}
                      </div>

                      <div className="resume-skills-block missing-block">
                        <div className="skills-block-header">
                          <span className="skills-status-indicator red" />
                          <h3>
                            Missing Skills & Prioritized Gaps ({resumeAnalysis.missingSkills?.length || 0})
                          </h3>
                        </div>

                        {/* Prioritized Gaps: Critical Must-Haves vs Secondary */}
                        <div className="prioritized-gaps-container">
                          {/* Critical Must-Haves */}
                          <div className="gap-subgroup critical">
                            <div className="gap-subgroup-title">
                              <span className="gap-indicator-dot red" />
                              <strong>Critical Must-Haves (Essential for Role)</strong>
                            </div>
                            {(resumeAnalysis.criticalMissingSkills?.length > 0
                              ? resumeAnalysis.criticalMissingSkills
                              : (resumeAnalysis.missingSkills || []).slice(0, 2)
                            ).length > 0 ? (
                              <div className="resume-skills-tags-container">
                                {(resumeAnalysis.criticalMissingSkills?.length > 0
                                  ? resumeAnalysis.criticalMissingSkills
                                  : (resumeAnalysis.missingSkills || []).slice(0, 2)
                                ).map((skill, index) => (
                                  <span
                                    key={`crit-missing-${skill}-${index}`}
                                    className="resume-skill-tag missing-critical"
                                    title="Core requirement mentioned in job title/spec"
                                  >
                                    <FiAlertCircle /> {skill}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="resume-no-skills-msg">No critical core requirements missing!</p>
                            )}
                          </div>

                          {/* Secondary / Preferred */}
                          <div className="gap-subgroup secondary">
                            <div className="gap-subgroup-title">
                              <span className="gap-indicator-dot amber" />
                              <strong>Secondary / Supporting Tools</strong>
                            </div>
                            {(resumeAnalysis.secondaryMissingSkills?.length > 0
                              ? resumeAnalysis.secondaryMissingSkills
                              : (resumeAnalysis.missingSkills || []).slice(2)
                            ).length > 0 ? (
                              <div className="resume-skills-tags-container">
                                {(resumeAnalysis.secondaryMissingSkills?.length > 0
                                  ? resumeAnalysis.secondaryMissingSkills
                                  : (resumeAnalysis.missingSkills || []).slice(2)
                                ).map((skill, index) => (
                                  <span
                                    key={`sec-missing-${skill}-${index}`}
                                    className="resume-skill-tag missing-secondary"
                                    title="Supporting tooling or preferred skill"
                                  >
                                    <FiAlertCircle /> {skill}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="resume-no-skills-msg">No secondary gaps identified.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3. Category-Wise Skills Comparison */}
                    {resumeAnalysis.categoryComparison?.length > 0 && (
                      <div className="resume-category-breakdown-section">
                        <div className="section-title-with-icon">
                          <FiBarChart2 />
                          <h3>Category-Wise Skill Competency</h3>
                        </div>
                        <div className="resume-categories-grid">
                          {resumeAnalysis.categoryComparison.map((cat, idx) => (
                            <div key={`cat-${cat.category}-${idx}`} className="resume-category-card">
                              <div className="resume-category-card-top">
                                <strong>{cat.category}</strong>
                                <span className={`category-score-pill ${cat.score >= 70 ? "high" : cat.score >= 40 ? "medium" : "low"}`}>
                                  {cat.score}%
                                </span>
                              </div>
                              <div className="resume-category-bar-bg">
                                <div
                                  className={`resume-category-bar-fill ${cat.score >= 70 ? "high" : cat.score >= 40 ? "medium" : "low"}`}
                                  style={{ width: `${Math.max(cat.score, 6)}%` }}
                                />
                              </div>
                              <div className="resume-category-skills-summary">
                                {cat.matched?.length > 0 && (
                                  <span className="category-micro-tag matched">
                                    ✓ {cat.matched.slice(0, 3).join(", ")}
                                  </span>
                                )}
                                {cat.missing?.length > 0 && (
                                  <span className="category-micro-tag missing">
                                    + {cat.missing.slice(0, 2).join(", ")}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. Personalized 3-Phase Learning Roadmap */}
                    {(() => {
                      const roadmapPhases =
                        resumeAnalysis.learningRoadmap?.length > 0
                          ? resumeAnalysis.learningRoadmap
                          : [
                              {
                                phase: "Phase 1 (Week 1-2): Core Concept & Syntax Mastery",
                                focus: `Foundational mastery of ${(resumeAnalysis.criticalMissingSkills?.[0] || resumeAnalysis.missingSkills?.[0] || "Target Stack Core Tools")}`,
                                actionItems: [
                                  `Complete intensive exercises covering core syntax and architectural patterns in ${(resumeAnalysis.criticalMissingSkills?.[0] || resumeAnalysis.missingSkills?.[0] || "core tools")}.`,
                                  `Review official documentation and modern best practices for production deployment.`,
                                ],
                              },
                              {
                                phase: "Phase 2 (Week 3-4): Hands-On Production Project",
                                focus: `Integration of ${(resumeAnalysis.criticalMissingSkills?.[0] || "Target Tool")} with ${(resumeAnalysis.matchedSkills?.[0] || "Core Fundamentals")}`,
                                actionItems: [
                                  `Build a full-stack portfolio feature connecting your primary stack with target job requirements.`,
                                  `Implement automated unit testing with Jest and Dockerize the application for GitHub.`,
                                ],
                              },
                              {
                                phase: "Phase 3 (Week 5-6): System Design & Interview Practice",
                                focus: `Technical interview readiness for ${cleanText(resumeAnalysis.jobTitle) || "this role"}`,
                                actionItems: [
                                  `Practice articulating architectural trade-offs and performance optimizations for this stack.`,
                                  `Quantify project metrics on your resume (e.g. latency, throughput, error recovery).`,
                                ],
                              },
                            ];
                      return (
                        <div className="resume-roadmap-section">
                          <div className="section-title-with-icon">
                            <FiCompass />
                            <div>
                              <h3>Personalized Learning Roadmap</h3>
                              <span className="section-subtext">
                                Actionable 3-phase curriculum tailored to bridge your prioritized skill gaps
                              </span>
                            </div>
                          </div>
                          <div className="resume-roadmap-grid">
                            {roadmapPhases.map((phase, pIdx) => (
                              <div key={`phase-${pIdx}`} className="resume-roadmap-card">
                                <div className="roadmap-phase-header">
                                  <span className="roadmap-phase-number">Phase {pIdx + 1}</span>
                                  <h4 className="roadmap-phase-title">{phase.phase}</h4>
                                </div>
                                <div className="roadmap-phase-focus">
                                  <span className="focus-label">Key Focus:</span>
                                  <strong>{phase.focus}</strong>
                                </div>
                                <ul className="roadmap-action-list">
                                  {(phase.actionItems || []).map((item, aIdx) => (
                                    <li key={`action-${pIdx}-${aIdx}`}>
                                      <FiCheckCircle className="action-check-icon" />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* 5. Recommendations Tailored to Selected Job */}
                    {(resumeAnalysis.tailoredRecommendations?.length > 0 ||
                      resumeAnalysis.suggestions?.length > 0) && (
                      <div className="resume-recommendations-section">
                        <div className="section-title-with-icon">
                          <FiTrendingUp />
                          <h3>Recommendations Tailored for {resumeAnalysis.jobTitle || "This Role"}</h3>
                        </div>
                        <div className="resume-recommendations-list">
                          {(resumeAnalysis.tailoredRecommendations?.length
                            ? resumeAnalysis.tailoredRecommendations
                            : resumeAnalysis.suggestions
                          ).map((rec, index) => (
                            <div key={`rec-${index}`} className="resume-recommendation-card">
                              <span className="recommendation-bullet">0{index + 1}</span>
                              <div className="recommendation-content">
                                <p>{rec}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 6. Potential Interview Questions */}
                    {resumeAnalysis.interviewQuestions?.length > 0 && (
                      <div className="resume-interview-questions-section">
                        <div className="section-title-with-icon">
                          <FiHelpCircle />
                          <h3>Likely Interview Focus Areas</h3>
                        </div>
                        <div className="resume-questions-list">
                          {resumeAnalysis.interviewQuestions.map((question, index) => (
                            <div key={`q-${index}`} className="resume-question-card">
                              <span className="question-badge">Q{index + 1}</span>
                              <p>{question}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Important Accuracy Disclaimer Banner */}
                    <div className="resume-accuracy-disclaimer">
                      <FiShield className="disclaimer-shield-icon" />
                      <div>
                        <strong>Important Note:</strong> A match score is an estimate of alignment with the job requirements, not a guarantee of selection.
                      </div>
                    </div>
                  </section>
                )}
              </div>
            ) : (
              /* History & Comparisons Subtab */
              <div className="resume-history-workspace">
                {resumeHistoryLoading ? (
                  <div className="student-placements-state">
                    <FiRefreshCw className="spin" />
                    <strong>Loading analysis history...</strong>
                  </div>
                ) : resumeHistory.length === 0 ? (
                  <div className="resume-history-empty-state">
                    <FiFileText />
                    <h3>No Resume Analyses Yet</h3>
                    <p>
                      Upload your resume against a job opportunity to start tracking your skill alignments and interview readiness.
                    </p>
                    <button
                      type="button"
                      onClick={() => setResumeSubTab("analyzer")}
                      className="resume-submit-btn"
                    >
                      <FiTarget /> Analyze Your First Job
                    </button>
                  </div>
                ) : (
                  <div className="resume-history-content">
                    {/* Cross-job comparison summary stats */}
                    <div className="resume-history-summary-stats">
                      <div className="history-stat-box">
                        <span>Total Analyses</span>
                        <strong>{resumeHistory.length}</strong>
                      </div>
                      <div className="history-stat-box">
                        <span>Highest Match</span>
                        <strong>
                          {Math.max(...resumeHistory.map((h) => h.matchScore || 0))}%
                        </strong>
                      </div>
                      <div className="history-stat-box">
                        <span>Average Alignment</span>
                        <strong>
                          {Math.round(
                            resumeHistory.reduce((acc, h) => acc + (h.matchScore || 0), 0) /
                              resumeHistory.length
                          )}
                          %
                        </strong>
                      </div>
                      <div className="history-stat-box highlight">
                        <span>Best Suited Role</span>
                        <strong className="truncate">
                          {cleanText([...resumeHistory].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))[0]?.jobTitle) || "N/A"}
                        </strong>
                      </div>
                    </div>

                    {/* Multi-Job Comparison Controls Bar */}
                    <div className="resume-comparison-toolbar">
                      <div className="comparison-toolbar-info">
                        <FiColumns />
                        <span>
                          {selectedComparisonIds.length > 0
                            ? `Selected ${selectedComparisonIds.length} of ${resumeHistory.length} jobs for side-by-side comparison`
                            : "Select 2 or more opportunities to compare side-by-side:"}
                        </span>
                      </div>
                      <div className="comparison-toolbar-actions">
                        <button
                          type="button"
                          className="comparison-btn primary"
                          disabled={selectedComparisonIds.length < 2}
                          onClick={() => setShowComparisonView((prev) => !prev)}
                        >
                          {showComparisonView ? (
                            <>
                              <FiMinimize2 /> Hide Side-by-Side View
                            </>
                          ) : (
                            <>
                              <FiColumns /> Compare Selected ({selectedComparisonIds.length})
                            </>
                          )}
                        </button>
                        {resumeHistory.length >= 2 && (
                          <button
                            type="button"
                            className="comparison-btn secondary"
                            onClick={handleCompareTopJobs}
                            title="Automatically compare your top 3 matching opportunities"
                          >
                            <FiZap /> Compare Top Matches
                          </button>
                        )}
                        {selectedComparisonIds.length > 0 && (
                          <button
                            type="button"
                            className="comparison-btn text"
                            onClick={() => {
                              setSelectedComparisonIds([]);
                              setShowComparisonView(false);
                            }}
                          >
                            <FiX /> Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Multi-Job Comparison Matrix View */}
                    {showComparisonView && comparisonItems.length >= 2 && (
                      <div className="resume-comparison-matrix-section">
                        <div className="comparison-matrix-header">
                          <div>
                            <h3>
                              <FiColumns /> Opportunity Comparison Matrix ({comparisonItems.length} Opportunities)
                            </h3>
                            <p>Side-by-side evaluation of technical alignment, experience scope, and skill overlaps.</p>
                          </div>
                          <button
                            type="button"
                            className="comparison-close-btn"
                            onClick={() => setShowComparisonView(false)}
                          >
                            <FiX /> Close Comparison
                          </button>
                        </div>

                        {/* Top Match Highlight Banner */}
                        {(() => {
                          const bestFit = [...comparisonItems].sort(
                            (a, b) => (b.matchScore || 0) - (a.matchScore || 0)
                          )[0];
                          return (
                            <div className="comparison-verdict-banner">
                              <span className="verdict-icon"><FiAward /></span>
                              <div className="verdict-text">
                                <strong>Top Recommended Opportunity: {cleanText(bestFit.jobTitle)} at {bestFit.company}</strong>
                                <span>
                                  Offers highest overall alignment ({bestFit.matchScore}%) with {bestFit.matchedSkills?.length || 0} matched competencies.
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Side-by-Side Comparison Cards Grid */}
                        <div
                          className="comparison-columns-grid"
                          style={{
                            gridTemplateColumns: `repeat(${Math.min(comparisonItems.length, 4)}, minmax(260px, 1fr))`,
                          }}
                        >
                          {comparisonItems.map((jobItem) => {
                            const isTopMatch =
                              jobItem.matchScore ===
                              Math.max(...comparisonItems.map((c) => c.matchScore || 0));
                            return (
                              <div
                                key={`compare-${jobItem._id}`}
                                className={`comparison-job-card ${isTopMatch ? "top-match" : ""}`}
                              >
                                {isTopMatch && (
                                  <div className="top-match-badge">
                                    <FiAward /> Best Match
                                  </div>
                                )}
                                <div className="compare-card-header">
                                  <h4>{cleanText(jobItem.jobTitle)}</h4>
                                  <span className="compare-company">{jobItem.company}</span>
                                </div>

                                <div className="compare-score-section">
                                  <span className="compare-score-label">Overall Match Score</span>
                                  <div className="compare-score-display">
                                    <strong className="compare-score-num">{jobItem.matchScore}%</strong>
                                    <span
                                      className={`match-level-badge small ${
                                        jobItem.matchScore >= 80
                                          ? "high"
                                          : jobItem.matchScore >= 55
                                            ? "medium"
                                            : "low"
                                      }`}
                                    >
                                      {jobItem.matchScore >= 80 ? "Strong" : jobItem.matchScore >= 55 ? "Competitive" : "Gap"}
                                    </span>
                                  </div>
                                </div>

                                <div className="compare-metrics-row">
                                  <div className="compare-metric-box">
                                    <span>Technical Match</span>
                                    <strong>{jobItem.technicalScore ?? jobItem.matchScore}%</strong>
                                  </div>
                                  <div className="compare-metric-box">
                                    <span>Experience Alignment</span>
                                    <strong>{jobItem.experienceScore ?? 75}%</strong>
                                  </div>
                                </div>

                                <div className="compare-seniority-box">
                                  <span>Role Seniority:</span>
                                  <strong>{jobItem.seniorityRequired || "Entry-Level"}</strong>
                                </div>

                                <div className="compare-skills-block">
                                  <span className="compare-skills-heading green">
                                    ✓ Matched ({jobItem.matchedSkills?.length || 0})
                                  </span>
                                  <div className="compare-tags-wrap">
                                    {(jobItem.matchedSkills || []).slice(0, 4).map((sk, idx) => (
                                      <span key={`comp-m-${idx}`} className="compare-tag matched">
                                        {sk}
                                      </span>
                                    ))}
                                    {(jobItem.matchedSkills?.length || 0) > 4 && (
                                      <span className="compare-tag more">
                                        +{jobItem.matchedSkills.length - 4} more
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="compare-skills-block">
                                  <span className="compare-skills-heading red">
                                    ! Critical Gaps ({(jobItem.criticalMissingSkills?.length > 0 ? jobItem.criticalMissingSkills : (jobItem.missingSkills || []).slice(0, 2)).length})
                                  </span>
                                  <div className="compare-tags-wrap">
                                    {(jobItem.criticalMissingSkills?.length > 0
                                      ? jobItem.criticalMissingSkills
                                      : (jobItem.missingSkills || []).slice(0, 2)
                                    ).map((sk, idx) => (
                                      <span key={`comp-miss-${idx}`} className="compare-tag missing">
                                        {sk}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  className="compare-view-report-btn"
                                  onClick={() => handleSelectHistoryItem(jobItem)}
                                >
                                  <FiEye /> View Full Report
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* History Items List with Selection Checkboxes */}
                    <div className="resume-history-cards-grid">
                      {resumeHistory.map((item) => {
                        const isSelected = selectedComparisonIds.includes(item._id);
                        return (
                          <div
                            key={item._id}
                            className={`resume-history-card ${isSelected ? "selected-for-compare" : ""}`}
                            onClick={() => handleSelectHistoryItem(item)}
                          >
                            <div className="history-card-top">
                              <div className="history-card-title-group">
                                <label
                                  className="history-checkbox-wrap"
                                  onClick={(e) => toggleComparisonSelection(item._id, e)}
                                  title="Check to select for multi-job comparison"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                  />
                                  <span className="custom-checkbox" />
                                </label>
                                <div>
                                  <h4>{cleanText(item.jobTitle)}</h4>
                                  <p className="history-card-company">{item.company}</p>
                                </div>
                              </div>
                              <span
                                className={`history-score-pill ${
                                  item.matchScore >= 80
                                    ? "high"
                                    : item.matchScore >= 55
                                      ? "medium"
                                      : "low"
                                }`}
                              >
                                {item.matchScore}%
                              </span>
                            </div>

                            {/* Dual Score & Engine Indicators */}
                            <div className="history-card-subscores">
                              <span className="history-subscore-chip tech">
                                Tech: <strong>{item.technicalScore ?? item.matchScore}%</strong>
                              </span>
                              <span className="history-subscore-chip exp">
                                Exp: <strong>{item.experienceScore ?? 75}%</strong>
                              </span>
                              <span className={`history-engine-chip ${item.method === "rule-based" || item.method === "heuristic-fallback" ? "rule" : "ai"}`}>
                                {item.method === "rule-based" || item.method === "heuristic-fallback" ? "Rule-Based ⚙️" : "Gemini AI ✨"}
                              </span>
                            </div>

                            <div className="history-card-skills-row">
                              <span className="history-skills-count green">
                                ✓ {item.matchedSkills?.length || 0} Matched
                              </span>
                              <span className="history-skills-count red">
                                ! {item.missingSkills?.length || 0} Missing
                              </span>
                              <span className="history-card-date">
                                {new Date(item.createdAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>

                            <div className="history-card-actions">
                              <button
                                type="button"
                                className="history-view-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectHistoryItem(item);
                                }}
                              >
                                <FiEye /> View Full Report
                              </button>
                              <button
                                type="button"
                                className="history-delete-btn"
                                disabled={historyDeleteId === item._id}
                                onClick={(e) => handleDeleteHistoryItem(item._id, e)}
                                title="Delete from history"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : activeTab === "preparation" ? (
          <div className="student-placement-preparation">
            <div className="student-placement-section-intro">
              <span><FiTarget aria-hidden="true" /></span>
              <div>
                <h2>Build your placement readiness</h2>
                <p>A practical checklist of areas to work on before interviews.</p>
              </div>
            </div>
            <div className="student-placement-preparation-grid">
              {PREPARATION_AREAS.map((area) => {
                const Icon = area.icon;
                return (
                  <article className="student-placement-prep-card" key={area.title}>
                    <span className={`student-placement-prep-icon ${area.color}`}>
                      <Icon aria-hidden="true" />
                    </span>
                    <h3>{area.title}</h3>
                    <p>{area.description}</p>
                    <small>{area.topics}</small>
                  </article>
                );
              })}
            </div>
          </div>
        ) : activeTab === "applications" ? (
          <div className="student-placement-updates">
            {applicationsLoading ? (
              <div className="student-placements-state" role="status">
                Loading applications…
              </div>
            ) : applicationError ? (
              <div className="student-placements-state error" role="alert">
                <FiAlertCircle aria-hidden="true" />
                <strong>Applications could not be loaded</strong>
                <span>{applicationError}</span>
                <button type="button" onClick={fetchApplications}>
                  <FiRefreshCw aria-hidden="true" /> Try again
                </button>
              </div>
            ) : applications.length === 0 ? (
              <div className="student-placements-state">
                <FiBriefcase aria-hidden="true" />
                <strong>No tracked applications yet.</strong>
                <span>Track an application from a job opportunity to see it here.</span>
              </div>
            ) : (
              applications.map((application) => (
                <article
                  className="student-placement-update-card"
                  key={application._id}
                >
                  <span className="student-placement-update-icon">
                    <FiBriefcase aria-hidden="true" />
                  </span>
                  <div className="student-placement-update-body">
                    <h2>{application.title}</h2>
                    <p><strong>{application.company || "Company not specified"}</strong></p>
                    <div className="student-placement-published">
                      <span className="student-placement-application-status">
                        {application.applicationStatus}
                      </span>
                      <span>Applied {formatDate(application.appliedAt)}</span>
                    </div>
                    {application.notes && (
                      <p className="student-placement-application-notes">
                        {application.notes}
                      </p>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        ) : activeTab === "jobs" || activeTab === "saved" ? (
          <div className="student-placement-updates">
            {saveError && (
              <div className="student-placements-state error" role="alert">
                {saveError}
              </div>
            )}
            {activeTab === "saved" && savedJobsError ? (
              <div className="student-placements-state error" role="alert">
                <FiAlertCircle aria-hidden="true" />
                <strong>Saved jobs could not be loaded</strong>
                <span>{savedJobsError}</span>
                <button
                  type="button"
                  onClick={() => setSavedJobsReloadKey((key) => key + 1)}
                >
                  <FiRefreshCw aria-hidden="true" /> Try again
                </button>
              </div>
            ) : activeTab === "saved" && savedJobsLoading ? (
              <div className="student-placements-state" role="status">
                Loading saved jobs…
              </div>
            ) : activeTab === "jobs" && jobsLoading ? (
              <div className="student-placements-state" role="status">
                Loading job opportunities…
              </div>
            ) : activeTab === "jobs" && jobsError ? (
              <div className="student-placements-state error" role="alert">
                <FiAlertCircle aria-hidden="true" />
                <strong>Job opportunities could not be loaded</strong>
                <span>{jobsError}</span>
                <button
                  type="button"
                  onClick={() => setJobsReloadKey((key) => key + 1)}
                >
                  <FiRefreshCw aria-hidden="true" /> Try again
                </button>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="student-placements-state">
                <FiBriefcase aria-hidden="true" />
                <strong>
                  {activeTab === "saved"
                    ? jobSearch
                      ? "No matching saved jobs found."
                      : "You have no saved jobs yet."
                    : jobSearch
                      ? "No matching job opportunities found."
                      : "No job opportunities yet."}
                </strong>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <article
                  className="student-placement-update-card"
                  key={job._id || `${job.source}-${job.sourceId}`}
                >
                  <span className="student-placement-update-icon">
                    <FiBriefcase aria-hidden="true" />
                  </span>
                  <div className="student-placement-update-body">
                    <h2>{job.title}</h2>
                    <p><strong>{job.company || "Company not specified"}</strong></p>
                    <p>{job.location || "Location not specified"}</p>
                    <p className="student-placement-job-description">
                      {typeof job.description === "string" && job.description
                        ? job.description.length > 180
                          ? `${job.description.slice(0, 180)}...`
                          : job.description
                        : "Description not provided by the source."}
                    </p>
                    <div className="student-placement-published">
                      <span>{job.category || "Other"}</span>
                      <span>{job.jobType || "Job type not specified"}</span>
                      {job.postedAt && <span>Posted {formatDate(job.postedAt)}</span>}
                    </div>
                    <button
                      type="button"
                      className="student-placement-job-details-button"
                      onClick={() => setSelectedJob(job)}
                    >
                      View details
                    </button>
                    <button
                      type="button"
                      className="student-placement-job-details-button"
                      onClick={() => toggleSavedJob(job)}
                      disabled={Boolean(savingJobId)}
                      aria-pressed={savedJobs.some((item) => item._id === job._id)}
                      aria-label={
                        savedJobs.some((item) => item._id === job._id)
                          ? "Remove saved job"
                          : "Save job"
                      }
                    >
                      <FiBookmark aria-hidden="true" />
                      {savingJobId === job._id
                        ? "Saving..."
                        : savedJobs.some((item) => item._id === job._id)
                          ? "Unsave"
                          : "Save job"}
                    </button>
                    <button
                      type="button"
                      className="student-placement-job-details-button"
                      onClick={() => {
                        const existing = applications.find(
                          (item) => item._id === job._id
                        );

                        setApplicationJob(job);
                        setApplicationStatus(
                          existing?.applicationStatus || "Applied"
                        );
                        setApplicationNotes(existing?.notes || "");
                        setApplicationDate(
                          existing?.appliedAt
                            ? new Date(existing.appliedAt)
                                .toISOString()
                                .slice(0, 10)
                            : new Date().toISOString().slice(0, 10)
                        );
                        setApplicationError("");
                      }}
                    >
                      {applications.some((item) => item._id === job._id)
                        ? "Update application"
                        : "Track application"}
                    </button>
                  </div>
                  <div className="student-placement-update-actions">
                    {Boolean(job.applyUrl || job.sourceUrl) && (
                      <a
                        href={job.applyUrl || job.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View opportunity
                      </a>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        ) : loading ? (
          <div className="student-placements-state" role="status">Loading placement updates…</div>
        ) : error ? (
          <div className="student-placements-state error" role="alert">
            <FiAlertCircle aria-hidden="true" />
            <strong>Placement updates could not be loaded</strong>
            <span>{error}</span>
            <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
              <FiRefreshCw aria-hidden="true" /> Try again
            </button>
          </div>
        ) : filteredNotices.length ? (
          <div className="student-placement-updates">
            {filteredNotices.map((notice) => (
              <article className="student-placement-update-card" key={notice._id}>
                <span className="student-placement-update-icon"><FiBriefcase aria-hidden="true" /></span>
                <div className="student-placement-update-body">
                  <div className="student-placement-update-meta">
                    {notice.priority === "High" && (
                      <span className="student-placement-important">Important</span>
                    )}
                    {notice.department?.name && (
                      <span className="student-placement-department">{notice.department.name}</span>
                    )}
                  </div>
                  <h2>{notice.title}</h2>
                  <p>{notice.content}</p>
                  <div className="student-placement-published">
                    <span><FiCalendar aria-hidden="true" /> Published {formatDate(notice.createdAt)}</span>
                    {notice.expiresAt && (
                      <span><FiClock aria-hidden="true" /> Expires {formatDate(notice.expiresAt)}</span>
                    )}
                  </div>
                </div>
                <div className="student-placement-update-actions">
                  <button type="button" onClick={() => setSelectedNotice(notice)}>
                    View details
                  </button>
                  {notice.attachmentUrl && (
                    <a
                      href={attachmentHref(notice.attachmentUrl)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FiDownload aria-hidden="true" /> Attachment
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="student-placements-state">
            <FiBriefcase aria-hidden="true" />
            <strong>{search ? "No matching updates" : "No placement updates yet"}</strong>
            <span>
              {search
                ? "Try a different search term."
                : "Published placement announcements for your account will appear here."}
            </span>
            {search && <button type="button" onClick={() => setSearch("")}>Clear search</button>}
          </div>
        )}
      </section>

      <div className="student-placements-note">
        <FiCheckCircle aria-hidden="true" />
        <p>Check each announcement and its attachment for role requirements, deadlines, and application instructions.</p>
      </div>

      {selectedNotice && (
        <div
          className="student-placement-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedNotice(null);
          }}
        >
          <section
            className="student-placement-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-placement-modal-title"
          >
            <header>
              <div>
                <span className={`student-placement-priority ${selectedNotice.priority?.toLowerCase() || "medium"}`}>
                  {selectedNotice.priority || "Medium"} priority
                </span>
                <h2 id="student-placement-modal-title">{selectedNotice.title}</h2>
              </div>
              <button type="button" aria-label="Close details" onClick={() => setSelectedNotice(null)}>
                <FiX aria-hidden="true" />
              </button>
            </header>
            <div className="student-placement-detail-meta">
              <span>Published {formatDate(selectedNotice.createdAt)}</span>
              {selectedNotice.department?.name && <span>{selectedNotice.department.name}</span>}
              {selectedNotice.createdBy?.name && <span>Posted by {selectedNotice.createdBy.name}</span>}
              {selectedNotice.expiresAt && <span>Expires {formatDate(selectedNotice.expiresAt)}</span>}
            </div>
            <p className="student-placement-detail-content">{selectedNotice.content}</p>
            {selectedNotice.attachmentUrl && (
              <a
                className="student-placement-detail-attachment"
                href={attachmentHref(selectedNotice.attachmentUrl)}
                target="_blank"
                rel="noreferrer"
              >
                <FiDownload aria-hidden="true" /> Open attachment
              </a>
            )}
          </section>
        </div>
      )}
      {selectedJob && (
        <div
          className="student-placement-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedJob(null);
          }}
        >
          <section
            className="student-placement-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-job-modal-title"
          >
            <header>
              <div>
                <span className="student-placement-priority medium">Job opportunity</span>
                <h2 id="student-job-modal-title">{selectedJob.title}</h2>
              </div>
              <button
                type="button"
                aria-label="Close job details"
                onClick={() => setSelectedJob(null)}
              >
                <FiX aria-hidden="true" />
              </button>
            </header>
            <div className="student-placement-detail-meta">
              <span>{selectedJob.company || "Company not specified"}</span>
              <span>{selectedJob.location || "Location not specified"}</span>
              <span>{selectedJob.category || "Other"}</span>
              {selectedJob.jobType && <span>{selectedJob.jobType}</span>}
              {selectedJob.postedAt && (
                <span>Posted {formatDate(selectedJob.postedAt)}</span>
              )}
            </div>
            <div className="student-placement-detail-content">
              <h3>Job description</h3>
              <p>
                {selectedJob.description ||
                  "The source has not provided a job description."}
              </p>
            </div>
            {(selectedJob.applyUrl || selectedJob.sourceUrl) && (
              <a
                className="student-placement-detail-attachment"
                href={selectedJob.applyUrl || selectedJob.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View original job and application instructions
              </a>
            )}
          </section>
        </div>
      )}
      {applicationJob && (
        <div
          className="student-placement-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setApplicationJob(null);
          }}
        >
          <section
            className="student-placement-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-modal-title"
          >
            <header>
              <div>
                <h2 id="application-modal-title">Track Application</h2>
                <p>{applicationJob.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setApplicationJob(null)}
                aria-label="Close"
              >
                <FiX aria-hidden="true" />
              </button>
            </header>

            <form className="student-placement-application-form" onSubmit={saveApplication}>
              <label>
                Application status
                <select
                  value={applicationStatus}
                  onChange={(event) => setApplicationStatus(event.target.value)}
                >
                  {[
                    "Applied",
                    "Assessment",
                    "Interview",
                    "Selected",
                    "Rejected",
                    "Withdrawn",
                  ].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Application date
                <input
                  type="date"
                  value={applicationDate}
                  onChange={(event) => setApplicationDate(event.target.value)}
                />
              </label>

              <label>
                Notes
                <textarea
                  value={applicationNotes}
                  onChange={(event) => setApplicationNotes(event.target.value)}
                  maxLength={2000}
                  rows={4}
                  placeholder="Interview details, follow-up reminders, or notes..."
                />
              </label>

              {applicationError && (
                <p role="alert">{applicationError}</p>
              )}

              <button type="submit" disabled={applicationSaving}>
                {applicationSaving ? "Saving..." : "Save application"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, tone, label, value }) => (
  <div className="student-placement-stat-card">
    <span className={`student-placement-stat-icon ${tone}`}>{icon}</span>
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  </div>
);

export default Placements;
