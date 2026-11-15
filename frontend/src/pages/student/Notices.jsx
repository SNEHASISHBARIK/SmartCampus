import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiBookOpen,
  FiCalendar,
  FiDownload,
  FiFileText,
  FiRefreshCw,
  FiBriefcase,
  FiUsers,
  FiX,
} from "react-icons/fi";
import api, { resolveApiAssetUrl } from "../../services/api";
import "./Notices.css";

const CATEGORIES = [
  ["all", "All Notices"],
  ["academic", "Academic"],
  ["exam", "Examination"],
  ["placement", "Placement"],
  ["event", "Events"],
  ["general", "General"],
  ["holiday", "Holiday"],
];

const NOTICE_COLORS = {
  academic: "red",
  exam: "blue",
  placement: "green",
  event: "purple",
  holiday: "orange",
  general: "gray",
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

const formatCategory = (category) =>
  String(category || "general").replace(/\b\w/g, (letter) => letter.toUpperCase());

const noticeIcon = (category) => {
  switch (category) {
    case "academic": return FiUsers;
    case "exam": return FiCalendar;
    case "placement": return FiBriefcase;
    case "event": return FiUsers;
    case "holiday": return FiCalendar;
    default: return FiFileText;
  }
};

const attachmentHref = (url) => {
  return resolveApiAssetUrl(url);
};

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [category, setCategory] = useState("all");
  const [selectedNotice, setSelectedNotice] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchNotices = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/students/notices", {
          signal: controller.signal,
        });
        if (!Array.isArray(response.data?.notices)) {
          throw new Error("Notices response has an invalid format.");
        }
        setNotices(response.data.notices);
      } catch (requestError) {
        if (requestError.code === "ERR_CANCELED") return;
        console.error("Student notices error:", requestError);
        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Unable to load notices."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchNotices();
    return () => controller.abort();
  }, [reloadKey]);

  const filteredNotices = useMemo(
    () =>
      category === "all"
        ? notices
        : notices.filter((notice) => notice.category === category),
    [category, notices]
  );

  return (
    <div className="student-notices-page">
      <div className="student-notices-breadcrumb">
        <Link to="/student">Dashboard</Link>
        <span aria-hidden="true">›</span>
        <strong>Notices</strong>
      </div>

      <header className="student-notices-heading">
        <div>
          <h1>Notices</h1>
          <p>Stay updated with the latest announcements and circulars.</p>
        </div>
        <label className="student-notices-category-select">
          <span className="sr-only">Filter by category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </header>

      <nav className="student-notices-tabs" aria-label="Notice categories">
        {CATEGORIES.map(([value, label]) => (
          <button
            type="button"
            key={value}
            className={category === value ? "active" : ""}
            aria-pressed={category === value}
            onClick={() => setCategory(value)}
          >
            {label}
            {value === "all" && !loading && <span>{notices.length}</span>}
          </button>
        ))}
      </nav>

      {loading ? (
        <div className="student-notices-state" role="status">Loading published notices…</div>
      ) : error ? (
        <div className="student-notices-state error" role="alert">
          <FiAlertCircle aria-hidden="true" />
          <strong>Notices could not be loaded</strong>
          <span>{error}</span>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
            <FiRefreshCw aria-hidden="true" /> Try again
          </button>
        </div>
      ) : filteredNotices.length ? (
        <section className="student-notices-list" aria-label="Published notices">
          {filteredNotices.map((notice) => {
            const Icon = noticeIcon(notice.category);
            const color = NOTICE_COLORS[notice.category] || "gray";
            return (
              <article className="student-notice-row" key={notice._id}>
                <span className={`student-notice-icon ${color}`}>
                  <Icon aria-hidden="true" />
                </span>
                <div className="student-notice-main">
                  <div className="student-notice-title-line">
                    <h2>{notice.title}</h2>
                    <span className={`student-notice-category ${color}`}>
                      {formatCategory(notice.category)}
                    </span>
                    {notice.priority === "High" && (
                      <span className="student-notice-priority">Important</span>
                    )}
                  </div>
                  <p>{notice.content}</p>
                </div>
                <time dateTime={notice.createdAt || undefined}>{formatDate(notice.createdAt)}</time>
                <button
                  type="button"
                  className="student-notice-view"
                  onClick={() => setSelectedNotice(notice)}
                >
                  View
                </button>
              </article>
            );
          })}
        </section>
      ) : (
        <div className="student-notices-state">
          <FiFileText aria-hidden="true" />
          <strong>{category === "all" ? "No notices available" : `No ${formatCategory(category).toLowerCase()} notices`}</strong>
          <span>
            {category === "all"
              ? "Published notices for your account will appear here."
              : "Try another category to view available notices."}
          </span>
          {category !== "all" && (
            <button type="button" onClick={() => setCategory("all")}>View all notices</button>
          )}
        </div>
      )}

      <footer className="student-notices-footer">
        <FiBookOpen aria-hidden="true" />
        <span>“Stay informed, stay ahead.”</span>
        <em>— SmartCampus</em>
      </footer>

      {selectedNotice && (
        <div
          className="student-notice-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedNotice(null);
          }}
        >
          <section
            className="student-notice-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-notice-modal-title"
          >
            <header>
              <div>
                <span className={`student-notice-category ${NOTICE_COLORS[selectedNotice.category] || "gray"}`}>
                  {formatCategory(selectedNotice.category)}
                </span>
                <h2 id="student-notice-modal-title">{selectedNotice.title}</h2>
              </div>
              <button type="button" aria-label="Close notice" onClick={() => setSelectedNotice(null)}>
                <FiX aria-hidden="true" />
              </button>
            </header>
            <div className="student-notice-detail-meta">
              <span>Published {formatDate(selectedNotice.createdAt)}</span>
              {selectedNotice.department?.name && <span>{selectedNotice.department.name}</span>}
              {selectedNotice.priority && <span>{selectedNotice.priority} priority</span>}
            </div>
            <p className="student-notice-detail-content">{selectedNotice.content}</p>
            {selectedNotice.attachmentUrl && (
              <a
                className="student-notice-attachment"
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
    </div>
  );
};

export default Notices;
