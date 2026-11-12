import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiBookOpen,
  FiCheckCircle,
  FiDownload,
  FiFileText,
  FiRefreshCw,
  FiStar,
  FiTrendingUp,
} from "react-icons/fi";
import api from "../../services/api";
import "./Results.css";

const gradeForPoint = (point) => {
  if (point >= 9.5) return "O";
  if (point >= 8.5) return "A";
  if (point >= 7.5) return "B";
  if (point >= 6.5) return "C";
  if (point >= 5.5) return "D";
  if (point >= 4.5) return "E";
  return "F";
};

const gradeTone = (grade) => {
  if (grade === "O" || grade === "A") return "excellent";
  if (grade === "B" || grade === "C") return "good";
  if (grade === "D" || grade === "E") return "pass";
  if (grade === "F") return "fail";
  return "pending";
};

const examLabel = (examType) =>
  String(examType || "Result").replaceAll("-", " ").replace(/\b\w/g, (char) => char.toUpperCase());

const getCourseSummaries = (results) => {
  const grouped = new Map();
  results.forEach((result) => {
    const subjectId = result.subject?._id || result.subject?.code;
    if (!subjectId) return;
    const key = `${result.semester}-${subjectId}`;
    const item = grouped.get(key) || {
      semester: result.semester,
      subject: result.subject,
      credits: Number(result.subject.credits) || 0,
      gradePoints: [],
      passed: true,
    };
    const point = Number(result.gradePoint);
    if (Number.isFinite(point)) item.gradePoints.push(point);
    if (result.grade === "F" || (Number(result.marksObtained) / Number(result.totalMarks)) * 100 < 40) {
      item.passed = false;
    }
    grouped.set(key, item);
  });

  return [...grouped.values()].map((course) => ({
    ...course,
    gradePoint: course.gradePoints.length
      ? course.gradePoints.reduce((sum, value) => sum + value, 0) / course.gradePoints.length
      : 0,
  }));
};

const getGpa = (courses) => {
  const graded = courses.filter((course) => course.credits > 0 && course.gradePoints.length);
  const credits = graded.reduce((sum, course) => sum + course.credits, 0);
  if (!credits) return null;
  const weightedPoints = graded.reduce(
    (sum, course) => sum + course.gradePoint * course.credits,
    0
  );
  return Number((weightedPoints / credits).toFixed(2));
};

const downloadCsv = (results, semesterLabel) => {
  const rows = [
    ["Semester", "Subject Code", "Subject", "Assessment", "Credits", "Marks", "Total Marks", "Grade", "Grade Point"],
    ...results.map((result) => [
      result.semester ?? "",
      result.subject?.code || "",
      result.subject?.name || "",
      examLabel(result.examType),
      result.subject?.credits ?? "",
      result.marksObtained ?? "",
      result.totalMarks ?? "",
      result.grade || "",
      result.gradePoint ?? "",
    ]),
  ];
  const csv = rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `smartcampus-results-${semesterLabel.toLowerCase().replaceAll(" ", "-")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const Results = () => {
  const [results, setResults] = useState([]);
  const [currentSemester, setCurrentSemester] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState("current");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const fetchResults = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/students/results", {
          params: { semester: "all" },
          signal: controller.signal,
        });
        const data = response.data;
        if (!Array.isArray(data?.results)) {
          throw new Error("Results response has an invalid format.");
        }
        setResults(data.results);
        setCurrentSemester(data.currentSemester ?? null);
      } catch (requestError) {
        if (requestError.code === "ERR_CANCELED") return;
        console.error("Student results error:", requestError);
        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Unable to load your results."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchResults();
    return () => controller.abort();
  }, [reloadKey]);

  const semesters = useMemo(
    () => [...new Set(results.map((result) => Number(result.semester)).filter(Number.isFinite))]
      .sort((first, second) => first - second),
    [results]
  );

  const activeSemester =
    selectedSemester === "current"
      ? currentSemester
      : selectedSemester === "all"
        ? null
        : Number(selectedSemester);
  const visibleResults = useMemo(
    () =>
      activeSemester === null
        ? results
        : results.filter((result) => Number(result.semester) === Number(activeSemester)),
    [activeSemester, results]
  );
  const courseSummaries = useMemo(
    () => getCourseSummaries(visibleResults),
    [visibleResults]
  );
  const gpa = getGpa(courseSummaries);
  const earnedCredits = courseSummaries
    .filter((course) => course.passed && course.gradePoints.length > 0)
    .reduce((sum, course) => sum + course.credits, 0);
  const representedCredits = courseSummaries.reduce(
    (sum, course) => sum + course.credits,
    0
  );
  const failingResults = visibleResults.filter((result) => result.grade === "F").length;
  const overallGrade = gpa === null ? "—" : gradeForPoint(gpa);

  const chartData = useMemo(
    () =>
      semesters.map((semester) => ({
        label: `${semester}${semester === 1 ? "st" : semester === 2 ? "nd" : semester === 3 ? "rd" : "th"} Sem`,
        sgpa: getGpa(getCourseSummaries(results.filter(
          (result) => Number(result.semester) === semester
        ))),
      })),
    [results, semesters]
  );
  const chartPoints = chartData
    .map((item, index) => ({
      ...item,
      x: chartData.length > 1 ? 34 + (index * 330) / (chartData.length - 1) : 199,
      y: item.sgpa === null ? null : 142 - (item.sgpa / 10) * 112,
    }))
    .filter((item) => item.y !== null);
  const chartPath = chartPoints
    .map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`)
    .join(" ");

  const semesterLabel =
    activeSemester === null
      ? "All semesters"
      : `${activeSemester}${activeSemester === 1 ? "st" : activeSemester === 2 ? "nd" : activeSemester === 3 ? "rd" : "th"} semester`;

  return (
    <div className="student-results-page">
      <div className="student-results-breadcrumb">
        <Link to="/student">Dashboard</Link>
        <span aria-hidden="true">›</span>
        <strong>Results</strong>
      </div>

      <header className="student-results-heading">
        <div>
          <h1>Results</h1>
          <p>Check your published grades and academic performance.</p>
        </div>
        <div className="student-results-quote">
          <FiStar aria-hidden="true" />
          <span>“Your results are a reflection of your efforts. Keep going!”</span>
        </div>
      </header>

      {!loading && !error && (
        <section className="student-results-stats" aria-label="Academic summary">
          <StatCard
            icon={<FiBookOpen aria-hidden="true" />}
            tone="blue"
            label={activeSemester === null ? "Estimated CGPA" : "Estimated SGPA"}
            value={gpa === null ? "—" : gpa.toFixed(2)}
            note="Credit-weighted from published results"
          />
          <StatCard
            icon={<FiTrendingUp aria-hidden="true" />}
            tone="green"
            label="Credits earned"
            value={`${earnedCredits} / ${representedCredits}`}
            note="Among courses with published results"
          />
          <StatCard
            icon={<FiFileText aria-hidden="true" />}
            tone="blue"
            label="Failing results"
            value={failingResults}
            note="Published assessments marked F"
          />
          <StatCard
            icon={<FiStar aria-hidden="true" />}
            tone="purple"
            label="Overall grade"
            value={overallGrade}
            note={gpa === null ? "Awaiting published results" : "Estimated from weighted GPA"}
          />
        </section>
      )}

      {loading ? (
        <div className="student-results-state" role="status">Loading your published results…</div>
      ) : error ? (
        <div className="student-results-state error" role="alert">
          <FiAlertCircle aria-hidden="true" />
          <strong>Results could not be loaded</strong>
          <span>{error}</span>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
            <FiRefreshCw aria-hidden="true" /> Try again
          </button>
        </div>
      ) : (
        <>
          <div className="student-results-main-grid">
            <section className="student-results-panel">
              <header className="student-results-panel-heading">
                <h2><FiTrendingUp aria-hidden="true" /> Semester Results</h2>
                <label>
                  Select semester
                  <select
                    value={selectedSemester}
                    onChange={(event) => setSelectedSemester(event.target.value)}
                  >
                    <option value="current">
                      {currentSemester ? `Current (${currentSemester})` : "Current semester"}
                    </option>
                    <option value="all">All semesters</option>
                    {semesters.map((semester) => (
                      <option key={semester} value={semester}>
                        {semester}{semester === 1 ? "st" : semester === 2 ? "nd" : semester === 3 ? "rd" : "th"} Semester
                      </option>
                    ))}
                  </select>
                </label>
              </header>

              {visibleResults.length ? (
                <div className="student-results-table-wrap">
                  <table className="student-results-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Subject Code</th>
                        <th>Subject Name</th>
                        <th>Credits</th>
                        <th>Assessment</th>
                        <th>Marks</th>
                        <th>Grade</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleResults.map((result, index) => {
                        const grade = result.grade || "—";
                        const percentage =
                          Number(result.totalMarks) > 0
                            ? (Number(result.marksObtained) / Number(result.totalMarks)) * 100
                            : null;
                        const passed = grade !== "F" && (percentage === null || percentage >= 40);
                        return (
                          <tr key={result._id}>
                            <td>{index + 1}</td>
                            <td className="subject-code">{result.subject?.code || "—"}</td>
                            <td>{result.subject?.name || "Subject unavailable"}</td>
                            <td>{result.subject?.credits ?? "—"}</td>
                            <td>{examLabel(result.examType)}</td>
                            <td>{result.marksObtained ?? "—"} / {result.totalMarks ?? "—"}</td>
                            <td><span className={`student-results-grade ${gradeTone(grade)}`}>{grade}</span></td>
                            <td><span className={`student-results-status ${passed ? "pass" : "fail"}`}>{passed ? "Pass" : "Fail"}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {gpa !== null && activeSemester !== null && (
                      <tfoot>
                        <tr>
                          <td colSpan="5">Estimated semester GPA</td>
                          <td>{gpa.toFixed(2)} / 10</td>
                          <td>{overallGrade}</td>
                          <td><FiCheckCircle aria-label="Calculated" /></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              ) : (
                <div className="student-results-empty">
                  <FiFileText aria-hidden="true" />
                  <strong>No published results for {semesterLabel}</strong>
                  <span>Your results will appear here once they are published.</span>
                  {results.length > 0 && activeSemester !== null && (
                    <button type="button" onClick={() => setSelectedSemester("all")}>
                      View all published results
                    </button>
                  )}
                </div>
              )}
            </section>

            <div className="student-results-side">
              <section className="student-results-panel student-results-chart-panel">
                <header className="student-results-panel-heading">
                  <h2><FiTrendingUp aria-hidden="true" /> SGPA Progress</h2>
                  <span className="student-results-chart-legend"><i /> Estimated SGPA</span>
                </header>
                {chartData.some((item) => item.sgpa !== null) ? (
                  <svg
                    className="student-results-chart"
                    viewBox="0 0 400 180"
                    role="img"
                    aria-label="Estimated weighted grade point average by semester"
                  >
                    {[0, 2, 4, 6, 8, 10].map((tick) => {
                      const y = 142 - (tick / 10) * 112;
                      return (
                        <g key={tick}>
                          <line x1="28" x2="378" y1={y} y2={y} stroke="#eaf0f6" />
                          <text x="19" y={y + 3} textAnchor="end" className="chart-axis-label">{tick}</text>
                        </g>
                      );
                    })}
                    {chartPath && (
                      <path d={chartPath} fill="none" stroke="#2878eb" strokeWidth="2.5" />
                    )}
                    {chartPoints.map((point) => (
                      <g key={point.label}>
                        <circle cx={point.x} cy={point.y} r="4" fill="#2878eb">
                          <title>{`${point.label}: ${point.sgpa.toFixed(2)} / 10`}</title>
                        </circle>
                        <text x={point.x} y="164" textAnchor="middle" className="chart-axis-label">
                          {point.label}
                        </text>
                        <text x={point.x} y={point.y - 9} textAnchor="middle" className="chart-value-label">
                          {point.sgpa.toFixed(2)}
                        </text>
                      </g>
                    ))}
                  </svg>
                ) : (
                  <div className="student-results-chart-empty">Semester progress appears as results are published.</div>
                )}
              </section>

              <section className="student-results-panel student-results-downloads">
                <header className="student-results-panel-heading">
                  <h2><FiDownload aria-hidden="true" /> Result Downloads</h2>
                </header>
                <p>Download a CSV copy of the published records shown for this selection.</p>
                <button
                  type="button"
                  disabled={!visibleResults.length}
                  onClick={() => downloadCsv(visibleResults, semesterLabel)}
                >
                  <FiDownload aria-hidden="true" /> Download results CSV
                </button>
                <small>Official marksheets and certificates are not available through the current API.</small>
              </section>
            </div>
          </div>

          <section className="student-results-lower-grid">
            <div className="student-results-panel student-results-grade-scale">
              <header className="student-results-panel-heading">
                <h2><FiStar aria-hidden="true" /> Grade Scale</h2>
              </header>
              <div className="student-results-grade-items">
                {[
                  ["O", "90–100", "Outstanding"],
                  ["A", "80–89", "Excellent"],
                  ["B", "70–79", "Very Good"],
                  ["C", "60–69", "Good"],
                  ["D", "50–59", "Average"],
                  ["E", "40–49", "Pass"],
                  ["F", "Below 40", "Fail"],
                ].map(([grade, range, label]) => (
                  <div className={`student-results-grade-item ${gradeTone(grade)}`} key={grade}>
                    <strong>{grade}</strong>
                    <span>{range}%</span>
                    <small>{label}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="student-results-panel student-results-standing">
              <header className="student-results-panel-heading">
                <h2><FiCheckCircle aria-hidden="true" /> Academic Status</h2>
              </header>
              <div className={`student-results-standing-message ${failingResults ? "needs-attention" : ""}`}>
                <FiCheckCircle aria-hidden="true" />
                <div>
                  <strong>{failingResults ? "Review required" : "Good standing"}</strong>
                  <span>
                    {failingResults
                      ? `${failingResults} published result${failingResults === 1 ? "" : "s"} have a failing grade.`
                      : "No failing published results in this selection."}
                  </span>
                </div>
              </div>
              <p className="student-results-status-note">
                This is based on published assessments, not an official backlog determination.
              </p>
            </div>
          </section>

          <p className="student-results-disclaimer">
            GPA and credit totals are estimates derived from published result records and subject credits; consult your institution’s official transcript for certified values.
          </p>
        </>
      )}

      <footer className="student-results-footer">
        <FiBookOpen aria-hidden="true" />
        <span>“Every result brings you closer to your dream.”</span>
        <em>— SmartCampus</em>
      </footer>
    </div>
  );
};

const StatCard = ({ icon, tone, label, value, note }) => (
  <article className="student-results-stat-card">
    <div className={`student-results-stat-icon ${tone}`}>{icon}</div>
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  </article>
);

export default Results;
