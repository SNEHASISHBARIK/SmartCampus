import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiArrowRight,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiCode,
  FiDatabase,
  FiDownload,
  FiFileText,
  FiLayers,
  FiLink,
  FiLoader,
  FiRefreshCw,
  FiSearch,
  FiUsers,
  FiX,
} from "react-icons/fi";
import api from "../../services/api";
import "./Subjects.css";

const SUBJECT_ICONS = [FiCode, FiDatabase, FiLayers, FiBriefcase, FiBookOpen, FiUsers];
const SUBJECT_COLORS = ["blue", "purple", "teal", "orange", "pink", "green"];

const getSubjectColorIndex = (subject) => {
  const value = subject?._id || subject?.code || subject?.name || "";
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) % SUBJECT_COLORS.length;
};

const facultyNames = (faculty = []) =>
  faculty
    .map((member) => member.user?.name)
    .filter(Boolean);

const resourceUrl = (fileUrl) => {
  if (!fileUrl) return "";
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  return `http://localhost:5000/${fileUrl.replace(/^\/+/, "")}`;
};

const formatDate = (date) => {
  if (!date) return "";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? ""
    : parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [currentSemester, setCurrentSemester] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(null);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [resourceError, setResourceError] = useState("");
  const [resources, setResources] = useState({ notes: [], questionPapers: [] });

  useEffect(() => {
    const controller = new AbortController();

    const fetchSubjects = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/students/subjects", {
          params: selectedSemester ? { semester: selectedSemester } : {},
          signal: controller.signal,
        });
        const data = response.data;
        setSubjects(data?.subjects || []);
        setCurrentSemester(data?.student?.semester ?? null);
        setSelectedSemester((value) => value ?? data?.selectedSemester ?? null);
      } catch (requestError) {
        if (requestError.code === "ERR_CANCELED") return;
        console.error("Student subjects error:", requestError);
        setError(
          requestError.response?.data?.message || "Unable to load your subjects."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchSubjects();
    return () => controller.abort();
  }, [reloadKey, selectedSemester]);

  const filteredSubjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return subjects;
    return subjects.filter((subject) =>
      [subject.name, subject.code, subject.description, ...facultyNames(subject.faculty)]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [search, subjects]);

  const stats = useMemo(() => {
    const instructors = new Set();
    let assignedSubjects = 0;
    let credits = 0;
    subjects.forEach((subject) => {
      credits += Number(subject.credits) || 0;
      const names = facultyNames(subject.faculty);
      if (names.length) assignedSubjects += 1;
      names.forEach((name) => instructors.add(name));
    });
    return {
      subjects: subjects.length,
      credits,
      assignedSubjects,
      instructors: instructors.size,
    };
  }, [subjects]);

  const openSubjectDialog = async (subject, mode) => {
    setDialog({ subject, mode });
    setResources({ notes: [], questionPapers: [] });
    setResourceError("");
    if (mode === "syllabus") return;

    setResourceLoading(true);
    try {
      const response = await api.get(
        `/students/subjects/${subject._id}/resources`
      );
      setResources({
        notes: response.data?.resources?.notes || [],
        questionPapers: response.data?.resources?.questionPapers || [],
      });
    } catch (requestError) {
      console.error("Subject resources error:", requestError);
      setResourceError(
        requestError.response?.data?.message ||
          "Unable to load resources for this subject."
      );
    } finally {
      setResourceLoading(false);
    }
  };

  const closeDialog = () => {
    setDialog(null);
    setResourceError("");
  };

  const activeDialog = dialog && {
    ...dialog,
    faculty: facultyNames(dialog.subject.faculty),
  };

  return (
    <div className="student-subjects-page">
      <div className="student-subjects-breadcrumb">
        <Link to="/student">Dashboard</Link>
        <span aria-hidden="true">›</span>
        <strong>Subjects</strong>
      </div>

      <header className="student-subjects-heading">
        <div>
          <h1>Subjects</h1>
          <p>Explore your subjects, faculty, notes and learning resources.</p>
        </div>
        <div className="student-subjects-academic-year">
          <span>Department</span>
          <strong>{subjects[0]?.department?.name || "Your department"}</strong>
        </div>
      </header>

      <section className="student-subjects-summary" aria-label="Semester overview">
        <div className="student-subjects-summary-heading">
          <FiBookOpen aria-hidden="true" />
          <h2>Semester Overview</h2>
          <span>Semester {selectedSemester || currentSemester || "—"}</span>
        </div>
        <div className="student-subjects-stat-grid">
          <div><strong>{stats.subjects}</strong><span>Active Subjects</span></div>
          <div><strong>{stats.credits}</strong><span>Total Credits</span></div>
          <div><strong>{stats.assignedSubjects}</strong><span>With Faculty</span></div>
          <div><strong>{stats.instructors}</strong><span>Faculty Members</span></div>
        </div>
      </section>

      <div className="student-subjects-controls">
        <div className="student-subjects-semesters" role="tablist" aria-label="Select semester">
          {Array.from({ length: 8 }, (_, index) => index + 1).map((semester) => (
            <button
              type="button"
              role="tab"
              aria-selected={selectedSemester === semester}
              className={selectedSemester === semester ? "active" : ""}
              key={semester}
              onClick={() => setSelectedSemester(semester)}
            >
              Semester {semester}
            </button>
          ))}
        </div>
        <label className="student-subjects-search">
          <FiSearch aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search subjects, code, faculty..."
            aria-label="Search subjects"
          />
        </label>
      </div>

      {loading ? (
        <div className="student-subjects-state" role="status">
          <FiLoader className="spinning" aria-hidden="true" />
          <span>Loading your subjects…</span>
        </div>
      ) : error ? (
        <div className="student-subjects-state error" role="alert">
          <FiAlertCircle aria-hidden="true" />
          <strong>Subjects could not be loaded</strong>
          <span>{error}</span>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
            <FiRefreshCw aria-hidden="true" /> Try again
          </button>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="student-subjects-state">
          <FiBookOpen aria-hidden="true" />
          <strong>{search ? "No matching subjects" : "No active subjects"}</strong>
          <span>
            {search
              ? "Try another subject name, code or faculty search."
              : `There are no active subjects listed for semester ${selectedSemester}.`}
          </span>
          {search && (
            <button type="button" onClick={() => setSearch("")}>
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="student-subjects-content">
          <div className="student-subjects-grid">
            {filteredSubjects.map((subject) => {
              const colorIndex = getSubjectColorIndex(subject);
              const Icon = SUBJECT_ICONS[colorIndex];
              const color = SUBJECT_COLORS[colorIndex];
              const instructors = facultyNames(subject.faculty);
              return (
                <article className="student-subject-card" key={subject._id}>
                  <div className="student-subject-card-main">
                    <div className={`student-subject-icon ${color}`}>
                      <Icon aria-hidden="true" />
                    </div>
                    <div className="student-subject-title">
                      <h2>{subject.name}</h2>
                      <span>{subject.code || "Code unavailable"}</span>
                    </div>
                    <span className="student-subject-credit">
                      {subject.credits ?? "—"} cr
                    </span>
                  </div>

                  <div className="student-subject-faculty">
                    <FiUsers aria-hidden="true" />
                    <span>
                      {instructors.length
                        ? instructors.join(", ")
                        : "Faculty not assigned"}
                    </span>
                  </div>

                  {subject.description && (
                    <p className="student-subject-description">
                      {subject.description}
                    </p>
                  )}

                  <div className="student-subject-actions">
                    <button
                      type="button"
                      className="syllabus"
                      onClick={() => openSubjectDialog(subject, "syllabus")}
                    >
                      <FiBookOpen aria-hidden="true" /> Syllabus
                    </button>
                    <button
                      type="button"
                      className="notes"
                      onClick={() => openSubjectDialog(subject, "notes")}
                    >
                      <FiFileText aria-hidden="true" /> Notes
                    </button>
                    <button
                      type="button"
                      className="resources"
                      onClick={() => openSubjectDialog(subject, "resources")}
                    >
                      <FiLink aria-hidden="true" /> Resources
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="student-subjects-quick-links">
            <section className="student-subjects-quick-card">
              <h2><FiLink aria-hidden="true" /> Quick Links</h2>
              <Link to="/student/notes"><FiDownload aria-hidden="true" /> All Study Notes <FiArrowRight aria-hidden="true" /></Link>
              <Link to="/student/exams"><FiCalendar aria-hidden="true" /> Exam Schedule <FiArrowRight aria-hidden="true" /></Link>
              <Link to="/student/assignments"><FiFileText aria-hidden="true" /> Assignments <FiArrowRight aria-hidden="true" /></Link>
              <Link to="/student/timetable"><FiCalendar aria-hidden="true" /> Class Timetable <FiArrowRight aria-hidden="true" /></Link>
            </section>
            <section className="student-subjects-quick-card student-subjects-note-card">
              <h2><FiCheck aria-hidden="true" /> Study tip</h2>
              <p>Check your subject notes and resources regularly for newly uploaded materials.</p>
            </section>
          </aside>
        </div>
      )}

      <footer className="student-subjects-footer">
        <FiBookOpen aria-hidden="true" />
        <span>“Subjects are not just about marks, but about building your future.”</span>
        <em>— SmartCampus</em>
      </footer>

      {activeDialog && (
        <div
          className="student-subject-dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <section
            className="student-subject-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-subject-dialog-title"
          >
            <header>
              <div>
                <span>{activeDialog.subject.code || "Subject"}</span>
                <h2 id="student-subject-dialog-title">{activeDialog.subject.name}</h2>
              </div>
              <button type="button" aria-label="Close dialog" onClick={closeDialog}>
                <FiX aria-hidden="true" />
              </button>
            </header>

            {activeDialog.mode === "syllabus" ? (
              <div className="student-subject-detail-content">
                <h3>Subject details</h3>
                <p>{activeDialog.subject.description || "No subject description has been added yet."}</p>
                <dl>
                  <div><dt>Semester</dt><dd>{activeDialog.subject.semester}</dd></div>
                  <div><dt>Credits</dt><dd>{activeDialog.subject.credits ?? "—"}</dd></div>
                  <div><dt>Faculty</dt><dd>{activeDialog.faculty.join(", ") || "Not assigned"}</dd></div>
                </dl>
                <p className="student-subject-no-syllabus">
                  A separate syllabus document has not been uploaded for this subject.
                </p>
              </div>
            ) : resourceLoading ? (
              <div className="student-subject-dialog-state" role="status">
                <FiLoader className="spinning" aria-hidden="true" /> Loading subject resources…
              </div>
            ) : resourceError ? (
              <div className="student-subject-dialog-state error" role="alert">
                <FiAlertCircle aria-hidden="true" /> {resourceError}
              </div>
            ) : (
              <div className="student-subject-resource-content">
                {activeDialog.mode === "notes" || activeDialog.mode === "resources" ? (
                  <ResourceGroup
                    title="Study notes"
                    emptyMessage="No notes have been uploaded for this subject yet."
                    items={resources.notes}
                    renderItem={(note) => (
                      <>
                        <span><FiFileText aria-hidden="true" /> {note.title}</span>
                        <small>{note.description || `Uploaded ${formatDate(note.createdAt)}`}</small>
                        {note.fileUrl && (
                          <a href={resourceUrl(note.fileUrl)} target="_blank" rel="noreferrer">
                            Open note <FiArrowRight aria-hidden="true" />
                          </a>
                        )}
                      </>
                    )}
                  />
                ) : null}
                {activeDialog.mode === "resources" && (
                  <ResourceGroup
                    title="Question papers"
                    emptyMessage="No question papers have been uploaded for this subject yet."
                    items={resources.questionPapers}
                    renderItem={(paper) => (
                      <>
                        <span><FiFileText aria-hidden="true" /> {paper.title}</span>
                        <small>
                          {paper.exam?.title || "Question paper"}
                          {paper.exam?.date ? ` · ${formatDate(paper.exam.date)}` : ""}
                        </small>
                        {paper.fileUrl && (
                          <a href={resourceUrl(paper.fileUrl)} target="_blank" rel="noreferrer">
                            Open paper <FiArrowRight aria-hidden="true" />
                          </a>
                        )}
                      </>
                    )}
                  />
                )}
                {activeDialog.mode === "notes" && resources.notes.length === 0 && (
                  <Link className="student-subject-dialog-link" to="/student/notes" onClick={closeDialog}>
                    Browse all study notes <FiArrowRight aria-hidden="true" />
                  </Link>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

const ResourceGroup = ({ title, emptyMessage, items, renderItem }) => (
  <section className="student-subject-resource-group">
    <h3>{title} <span>{items.length}</span></h3>
    {items.length ? (
      <div className="student-subject-resource-list">
        {items.map((item) => (
          <article key={item._id}>{renderItem(item)}</article>
        ))}
      </div>
    ) : (
      <p>{emptyMessage}</p>
    )}
  </section>
);

export default Subjects;
