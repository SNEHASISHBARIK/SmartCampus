import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiBookOpen,
  FiDownload,
  FiFileText,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";
import api from "../../services/api";
import "./Notes.css";

const resourceUrl = (fileUrl) => {
  if (!fileUrl) return "";
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  return `http://localhost:5000/${fileUrl.replace(/^\/+/, "")}`;
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

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [semester, setSemester] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchNotes = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/students/notes", {
          signal: controller.signal,
        });
        if (!Array.isArray(response.data?.notes)) {
          throw new Error("Notes response has an invalid format.");
        }
        setNotes(response.data.notes);
        setSemester(response.data.student?.semester ?? null);
      } catch (requestError) {
        if (requestError.code === "ERR_CANCELED") return;
        console.error("Student notes error:", requestError);
        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Unable to load your study notes."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchNotes();
    return () => controller.abort();
  }, [reloadKey]);

  const subjects = useMemo(() => {
    const byId = new Map();
    notes.forEach((note) => {
      const subject = note.subject;
      if (subject?._id && !byId.has(subject._id)) byId.set(subject._id, subject);
    });
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [notes]);

  const visibleNotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notes.filter((note) => {
      const matchesSubject =
        selectedSubject === "all" || note.subject?._id === selectedSubject;
      const matchesSearch =
        !query ||
        [note.title, note.description, note.subject?.name, note.subject?.code]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      return matchesSubject && matchesSearch;
    });
  }, [notes, search, selectedSubject]);

  return (
    <div className="student-notes-page">
      <div className="student-notes-breadcrumb">
        <Link to="/student">Dashboard</Link>
        <span aria-hidden="true">›</span>
        <strong>Study Notes</strong>
      </div>

      <header className="student-notes-heading">
        <div>
          <h1>Study Notes</h1>
          <p>Access notes and study materials shared by your faculty.</p>
        </div>
        {semester && <span className="student-notes-semester">Semester {semester}</span>}
      </header>

      <section className="student-notes-summary" aria-label="Study notes summary">
        <div className="student-notes-summary-card">
          <span className="student-notes-summary-icon blue"><FiFileText aria-hidden="true" /></span>
          <div><span>Available Notes</span><strong>{loading ? "—" : notes.length}</strong></div>
        </div>
        <div className="student-notes-summary-card">
          <span className="student-notes-summary-icon purple"><FiBookOpen aria-hidden="true" /></span>
          <div><span>Subjects</span><strong>{loading ? "—" : subjects.length}</strong></div>
        </div>
      </section>

      <section className="student-notes-panel">
        <div className="student-notes-toolbar">
          <div>
            <h2>My Study Materials</h2>
            <p>Notes available for your current subjects</p>
          </div>
          <div className="student-notes-filters">
            <label className="student-notes-select">
              <span className="sr-only">Filter notes by subject</span>
              <select
                value={selectedSubject}
                onChange={(event) => setSelectedSubject(event.target.value)}
                disabled={loading}
              >
                <option value="all">All subjects</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}{subject.code ? ` (${subject.code})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="student-notes-search">
              <FiSearch aria-hidden="true" />
              <span className="sr-only">Search study notes</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notes..."
              />
            </label>
          </div>
        </div>

        {loading ? (
          <div className="student-notes-state" role="status">Loading study materials…</div>
        ) : error ? (
          <div className="student-notes-state error" role="alert">
            <FiAlertCircle aria-hidden="true" />
            <strong>Study notes could not be loaded</strong>
            <span>{error}</span>
            <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
              <FiRefreshCw aria-hidden="true" /> Try again
            </button>
          </div>
        ) : visibleNotes.length ? (
          <div className="student-notes-grid">
            {visibleNotes.map((note) => (
              <article className="student-note-card" key={note._id}>
                <div className="student-note-card-heading">
                  <span className="student-note-file-icon"><FiFileText aria-hidden="true" /></span>
                  <span className="student-note-subject">
                    {note.subject?.code || note.subject?.name || "Course material"}
                  </span>
                </div>
                <h3>{note.title}</h3>
                <p className="student-note-subject-name">
                  {note.subject?.name || "Subject unavailable"}
                </p>
                {note.description && <p className="student-note-description">{note.description}</p>}
                <div className="student-note-card-footer">
                  <time dateTime={note.createdAt || undefined}>
                    Uploaded {formatDate(note.createdAt)}
                  </time>
                  {note.fileUrl ? (
                    <a
                      className="student-note-open"
                      href={resourceUrl(note.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FiDownload aria-hidden="true" /> Open notes
                    </a>
                  ) : (
                    <span className="student-note-unavailable">File unavailable</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="student-notes-state">
            <FiBookOpen aria-hidden="true" />
            <strong>{search || selectedSubject !== "all" ? "No matching notes" : "No notes available yet"}</strong>
            <span>
              {search || selectedSubject !== "all"
                ? "Try another search term or choose a different subject."
                : "Materials uploaded for your active subjects will appear here."}
            </span>
            {(search || selectedSubject !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedSubject("all");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </section>

      <footer className="student-notes-footer">
        <FiBookOpen aria-hidden="true" />
        <span>Small steps every day lead to big results.</span>
        <em>— SmartCampus</em>
      </footer>
    </div>
  );
};

export default Notes;
