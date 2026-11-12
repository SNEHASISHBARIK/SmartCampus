import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "./PlacementPractice.css";

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const SECTION_LABELS = {
  aptitude: "Aptitude",
  logical: "Logical Reasoning",
  logical_reasoning: "Logical Reasoning",
  reasoning: "Logical Reasoning",
  programming: "Programming",
  coding: "Programming",
};

function normalizeSectionName(value = "") {
  const name = String(value).toLowerCase();

  if (name.includes("aptitude")) return "aptitude";
  if (name.includes("logic") || name.includes("reason")) return "logical";
  if (
    name.includes("program") ||
    name.includes("coding") ||
    name.includes("technical")
  ) {
    return "programming";
  }

  return name || "other";
}

function getQuestionId(question, index) {
  return (
    question.questionId ??
    question.id ??
    question._id ??
    question.question_id ??
    `question-${index + 1}`
  );
}

function normalizeQuestions(data) {
  const payload = data?.data ?? data;

  // The backend may return the questions grouped into sections.
  const groupedSections =
    payload?.sections ??
    payload?.test?.sections ??
    payload?.attempt?.sections;

  if (Array.isArray(groupedSections)) {
    return groupedSections.flatMap((section) => {
      const sectionName = normalizeSectionName(
        section.section ?? section.name ?? section.title
      );

      return (section.questions ?? []).map((question, index) => ({
        ...question,
        questionId: getQuestionId(question, index),
        section: sectionName,
        topic: question.topic ?? section.title ?? sectionName,
        options: Array.isArray(question.options) ? question.options : [],
      }));
    });
  }

  // Or the backend may return one flat questions array.
  const flatQuestions =
    payload?.questions ??
    payload?.test?.questions ??
    payload?.attempt?.questions;

  if (Array.isArray(flatQuestions)) {
    return flatQuestions.map((question, index) => ({
      ...question,
      questionId: getQuestionId(question, index),
      section: normalizeSectionName(
        question.section ?? question.category ?? question.type
      ),
      topic: question.topic ?? question.section ?? "General",
      options: Array.isArray(question.options) ? question.options : [],
    }));
  }

  return [];
}

function getResponsePayload(response) {
  return response?.data?.data ?? response?.data ?? {};
}

function getAnswerValue(option) {
  if (typeof option === "string" || typeof option === "number") {
    return String(option);
  }

  if (option && typeof option === "object") {
    return String(
      option.value ?? option.text ?? option.label ?? option.option ?? ""
    );
  }

  return "";
}

function getOptionLabel(option, index) {
  if (option && typeof option === "object") {
    return String(option.label ?? option.key ?? String.fromCharCode(65 + index));
  }

  return String.fromCharCode(65 + index);
}

export default function PlacementPractice() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [jobsLoading, setJobsLoading] = useState(true);

  const selectedJob = jobs.find(
    (job) => job._id === selectedJobId
  );

  const jobRole = selectedJob?.title || "";
  const [difficulty, setDifficulty] = useState("Medium");

  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [sectionFilter, setSectionFilter] = useState("all");

  const [secondsRemaining, setSecondsRemaining] = useState(60 * 60);
  const [timeExpired, setTimeExpired] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchJobs() {
      setJobsLoading(true);

      try {
        const response = await api.get("/placements?limit=50");

        const payload = response.data?.data ?? response.data;

        const availableJobs = Array.isArray(payload)
          ? payload
          : payload?.placements ?? payload?.jobs ?? [];

        if (!cancelled) {
          setJobs(
            availableJobs.filter((job) => job.isActive !== false)
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load available jobs. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setJobsLoading(false);
        }
      }
    }

    fetchJobs();

    return () => {
      cancelled = true;
    };
  }, []);

  const isTestStarted = questions.length > 0 && !result;

  const currentQuestion = questions[currentIndex];

  const filteredQuestions = useMemo(() => {
    if (sectionFilter === "all") return questions;

    return questions.filter(
      (question) => question.section === sectionFilter
    );
  }, [questions, sectionFilter]);

  const answeredCount = Object.keys(answers).length;

  const sectionCounts = useMemo(
    () => ({
      aptitude: questions.filter((q) => q.section === "aptitude").length,
      logical: questions.filter((q) => q.section === "logical").length,
      programming: questions.filter((q) => q.section === "programming").length,
    }),
    [questions]
  );

  useEffect(() => {
    if (!isTestStarted || result || submitting) return;

    if (secondsRemaining <= 0) {
      setTimeExpired(true);
      submitTest(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setSecondsRemaining((remaining) => remaining - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [isTestStarted, result, submitting, secondsRemaining]);

  async function generateTest(event) {
    event.preventDefault();

    if (!selectedJobId) {
      setError("Please select a job before generating your practice test.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setQuestions([]);
    setAnswers({});
    setAttemptId(null);
    setCurrentIndex(0);
    setSectionFilter("all");

    try {
      const response = await api.post("/placement-practice/generate", {
        jobId: selectedJobId,
        difficulty: difficulty.toLowerCase(),
      });

      const payload = getResponsePayload(response);
      const generatedQuestions = normalizeQuestions(payload);

      const newAttemptId =
        payload.attemptId ??
        payload.attempt?._id ??
        payload.attempt?.attemptId ??
        payload.test?._id;

      if (!newAttemptId) {
        throw new Error(
          "The server generated a response but did not return an attempt ID. Check the generate API response."
        );
      }

      if (generatedQuestions.length !== 60) {
        throw new Error(
          `The server returned ${generatedQuestions.length} questions instead of 60. Please check the backend response structure.`
        );
      }

      const missingSections = ["aptitude", "logical", "programming"].filter(
        (section) =>
          generatedQuestions.filter((q) => q.section === section).length !== 20
      );

      if (missingSections.length > 0) {
        throw new Error(
          "The questions were received, but their section names or counts do not match the expected 20 aptitude, 20 reasoning, and 20 programming questions. Please check the API response."
        );
      }

      setAttemptId(newAttemptId);
      setQuestions(generatedQuestions);
      setSecondsRemaining(60 * 60);
      setTimeExpired(false);
    } catch (err) {
      console.error("Placement practice generation error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to generate the test. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(questionId, selectedAnswer) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: selectedAnswer,
    }));
  }

  function goToQuestion(index) {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
      setSectionFilter("all");
    }
  }

  async function submitTest(autoSubmit = false) {
    if (!attemptId) {
      setError("Test attempt ID is missing. Please generate a new test.");
      return;
    }

    if (!autoSubmit) {
      const confirmed = window.confirm(
        "Submit your test now? Unanswered questions will be marked incorrect."
      );

      if (!confirmed) return;
    }

    setSubmitting(true);
    setError("");

    try {
      const answerList = questions.map((question) => ({
        questionId: question.questionId,
        selectedAnswer: answers[question.questionId] ?? null,
      }));

      const response = await api.post("/placement-practice/submit", {
        attemptId,
        answers: answerList,
      });

      const payload = getResponsePayload(response);
      setResult(payload);
    } catch (err) {
      console.error("Placement practice submission error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to submit your test. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function startAnotherTest() {
    setQuestions([]);
    setAttemptId(null);
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
    setError("");
    setSectionFilter("all");
  }

  function renderResult() {
    const score = Number(result?.score ?? result?.result?.score ?? 0);
    const percentage = Number(
      result?.percentage ??
        result?.result?.percentage ??
        (questions.length ? (score / questions.length) * 100 : 0)
    );

    const reviewedQuestions =
      result?.reviewedQuestions ??
      result?.result?.reviewedQuestions ??
      result?.result?.questions ??
      result?.questions ??
      [];

    const weakAreas = result?.weakAreas ?? result?.result?.weakAreas ?? [];

    const rawSectionStats =
      result?.sectionStats ?? result?.result?.sectionStats;

    const sectionStats = Array.isArray(rawSectionStats)
      ? rawSectionStats
      : rawSectionStats && typeof rawSectionStats === "object"
        ? Object.entries(rawSectionStats).map(([section, stats]) => ({
            section,
            correct: stats.correct,
            total: stats.total,
          }))
        : [];

    return (
      <div className="pp-results">
        <div className="pp-result-hero">
          <span className="pp-result-icon">✓</span>
          <p className="pp-eyebrow">TEST COMPLETED</p>
          <h2>Your practice results</h2>
          <p>Review your performance and identify where to improve.</p>

          <div className="pp-score-circle">
            <strong>{percentage.toFixed(1)}%</strong>
            <span>Overall score</span>
          </div>

          <div className="pp-result-summary">
            <div>
              <strong>
                {score}
                <span> / {questions.length}</span>
              </strong>
              <small>Correct answers</small>
            </div>
            <div>
              <strong>{jobRole}</strong>
              <small>Selected role</small>
            </div>
            <div>
              <strong>{difficulty}</strong>
              <small>Difficulty</small>
            </div>
          </div>
        </div>

        {Array.isArray(sectionStats) && sectionStats.length > 0 && (
          <section className="pp-result-section">
            <h3>Section-wise performance</h3>

            <div className="pp-stats-grid">
              {sectionStats.map((item, index) => {
                const name =
                  item.section ?? item.name ?? item.category ?? `Section ${index + 1}`;

                const correct =
                  item.correct ?? item.score ?? item.correctAnswers ?? 0;

                const total =
                  item.total ?? item.totalQuestions ?? item.questionCount ?? 20;

                const percent = total ? (Number(correct) / Number(total)) * 100 : 0;

                return (
                  <div className="pp-stat-card" key={`${name}-${index}`}>
                    <span>{SECTION_LABELS[normalizeSectionName(name)] ?? name}</span>
                    <strong>
                      {correct}/{total}
                    </strong>
                    <div className="pp-progress-track">
                      <div
                        className="pp-progress-fill"
                        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
                      />
                    </div>
                    <small>{percent.toFixed(0)}% correct</small>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="pp-result-section">
          <h3>Topics to improve</h3>

          {Array.isArray(weakAreas) && weakAreas.length > 0 ? (
            <div className="pp-weak-list">
              {weakAreas.map((area, index) => {
                const label =
                  typeof area === "string"
                    ? area
                    : area.topic ?? area.name ?? area.section ?? "Review this topic";

                const suggestion =
                  typeof area === "object"
                    ? area.recommendation ?? area.suggestion
                    : "";

                return (
                  <div className="pp-weak-item" key={`${label}-${index}`}>
                    <span className="pp-weak-number">{index + 1}</span>
                    <div>
                      <strong>{label}</strong>
                      {suggestion && <p>{suggestion}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="pp-muted">
              No weak areas were returned. Review the answer explanations below
              to decide what to practise next.
            </p>
          )}
        </section>

        <section className="pp-result-section">
          <h3>Answer review</h3>

          {reviewedQuestions.length > 0 ? (
            <div className="pp-review-list">
              {reviewedQuestions.map((question, index) => {
                const questionText =
                  question.question ?? question.questionText ?? `Question ${index + 1}`;

                const correctAnswer =
                  question.correctAnswer ??
                  question.answer ??
                  question.expectedAnswer ??
                  "Not provided";

                const selectedAnswer =
                  question.selectedAnswer ??
                  question.userAnswer ??
                  answers[question.questionId];

                const isCorrect =
                  question.isCorrect ??
                  question.correct ??
                  String(selectedAnswer) === String(correctAnswer);

                return (
                  <article
                    className={`pp-review-card ${isCorrect ? "is-correct" : "is-wrong"}`}
                    key={question.questionId ?? index}
                  >
                    <div className="pp-review-heading">
                      <span>Question {index + 1}</span>
                      <span>{isCorrect ? "Correct" : "Incorrect"}</span>
                    </div>

                    <p className="pp-review-question">{questionText}</p>

                    <p>
                      <strong>Your answer:</strong>{" "}
                      {selectedAnswer === undefined ? "Not available" : String(selectedAnswer)}
                    </p>

                    <p>
                      <strong>Correct answer:</strong> {String(correctAnswer)}
                    </p>

                    {question.explanation && (
                      <div className="pp-explanation">
                        <strong>Explanation</strong>
                        <p>{question.explanation}</p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="pp-muted">
              The server did not return answer explanations in its response.
              Check the submit API response if you expected them.
            </p>
          )}
        </section>

        <button
          type="button"
          className="pp-primary-btn"
          onClick={startAnotherTest}
        >
          Start another practice test
        </button>
      </div>
    );
  }

  return (
    <div className="placement-practice">
      <header className="pp-header">
        <div>
          <span className="pp-eyebrow">SMARTCAMPUS · PLACEMENT CELL</span>
          <h1>AI Placement Practice</h1>
          <p>
            Practise aptitude, logical reasoning and programming with a role-based
            mock test.
          </p>
        </div>
        <div className="pp-header-badge">60 Questions</div>
      </header>

      {error && (
        <div className="pp-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}

      {!isTestStarted && !result && (
        <form className="pp-setup-card" onSubmit={generateTest}>
          <div className="pp-section-title">
            <span className="pp-title-icon">✦</span>
            <div>
              <h2>Configure your mock test</h2>
              <p>Choose your target role and preferred difficulty.</p>
            </div>
          </div>

          <div className="pp-form-grid">
            <label className="pp-field">
              <span>Select a job from available placements</span>

              <select
                value={selectedJobId}
                onChange={(event) => setSelectedJobId(event.target.value)}
                disabled={loading || jobsLoading}
                required
              >
                <option value="">
                  {jobsLoading ? "Loading available jobs..." : "Select a job"}
                </option>

                {jobs.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.title} — {job.company}
                  </option>
                ))}
              </select>
            </label>

            <label className="pp-field">
              <span>Difficulty level</span>
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
                disabled={loading}
              >
                {DIFFICULTIES.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedJob && (
            <div className="pp-test-note">
              <h3>{selectedJob.title}</h3>

              <p>
                <strong>Company:</strong>{" "}
                {selectedJob.company || "Not specified"}
              </p>

              <p>
                <strong>Location:</strong>{" "}
                {selectedJob.location || "Not specified"}
              </p>

              <p>
                <strong>Category:</strong>{" "}
                {selectedJob.category || "Other"}
              </p>

              <p>
                <strong>Job type:</strong>{" "}
                {selectedJob.jobType || "Not specified"}
              </p>

              <p>
                <strong>Job description:</strong>
              </p>

              <p>
                {selectedJob.description || "No job description available."}
              </p>
            </div>
          )}

          <div className="pp-breakdown">
            <div className="pp-breakdown-item">
              <span className="pp-breakdown-icon">01</span>
              <div>
                <strong>Aptitude</strong>
                <span>20 questions</span>
              </div>
            </div>

            <div className="pp-breakdown-item">
              <span className="pp-breakdown-icon">02</span>
              <div>
                <strong>Logical reasoning</strong>
                <span>20 questions</span>
              </div>
            </div>

            <div className="pp-breakdown-item">
              <span className="pp-breakdown-icon">03</span>
              <div>
                <strong>Programming</strong>
                <span>20 questions</span>
              </div>
            </div>
          </div>

          <div className="pp-test-note">
            <strong>Before you begin</strong>
            <p>
              Set aside enough time to answer all 60 questions. Your results will
              appear after you submit the test.
            </p>
          </div>

          <button
            type="submit"
            className="pp-primary-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="pp-spinner" />
                Generating your questions...
              </>
            ) : (
              "Generate my practice test →"
            )}
          </button>
        </form>
      )}

      {isTestStarted && (
        <div className="pp-test-layout">
          <main className="pp-question-panel">
            <div className="pp-test-topline">
              <div>
                <span className="pp-eyebrow">{jobRole}</span>
                <h2>Your mock test</h2>
              </div>

              <div className="pp-test-badges">
                <span className="pp-difficulty-pill">{difficulty}</span>

                <span
                  className={`pp-timer ${
                    secondsRemaining <= 300 ? "pp-timer-warning" : ""
                  }`}
                  role="timer"
                  aria-live="off"
                >
                  ⏱ {String(Math.floor(secondsRemaining / 60)).padStart(2, "0")}:
                  {String(secondsRemaining % 60).padStart(2, "0")}
                </span>
              </div>
            </div>

            <div className="pp-test-progress">
              <div className="pp-progress-labels">
                <span>Test progress</span>
                <strong>
                  {answeredCount}/{questions.length} answered
                </strong>
              </div>
              <div className="pp-progress-track">
                <div
                  className="pp-progress-fill"
                  style={{
                    width: `${(answeredCount / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="pp-filter-row">
              {[
                ["all", "All questions"],
                ["aptitude", "Aptitude"],
                ["logical", "Reasoning"],
                ["programming", "Programming"],
              ].map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={`pp-filter-btn ${
                    sectionFilter === value ? "active" : ""
                  }`}
                  onClick={() => {
                    setSectionFilter(value);

                    if (value !== "all") {
                      const firstIndex = questions.findIndex(
                        (q) => q.section === value
                      );

                      if (firstIndex !== -1) setCurrentIndex(firstIndex);
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {currentQuestion && (
              <article className="pp-question-card">
                <div className="pp-question-meta">
                  <span>
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span>
                    {SECTION_LABELS[currentQuestion.section] ??
                      currentQuestion.section}
                  </span>
                </div>

                <h3>
                  {currentQuestion.question ??
                    currentQuestion.questionText ??
                    currentQuestion.text ??
                    "Question text is missing from the API response."}
                </h3>

                {currentQuestion.topic && (
                  <p className="pp-topic-label">Topic: {currentQuestion.topic}</p>
                )}

                <div className="pp-options">
                  {currentQuestion.options.map((option, index) => {
                    const value = getAnswerValue(option);
                    const label = getOptionLabel(option, index);
                    const selected =
                      answers[currentQuestion.questionId] === value;

                    return (
                      <button
                        type="button"
                        key={`${currentQuestion.questionId}-${index}`}
                        className={`pp-option ${selected ? "selected" : ""}`}
                        onClick={() =>
                          selectAnswer(currentQuestion.questionId, value)
                        }
                        aria-pressed={selected}
                      >
                        <span className="pp-option-letter">{label}</span>
                        <span className="pp-option-text">{value}</span>
                        <span className="pp-option-check">
                          {selected ? "✓" : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="pp-question-navigation">
                  <button
                    type="button"
                    className="pp-secondary-btn"
                    onClick={() => goToQuestion(currentIndex - 1)}
                    disabled={currentIndex === 0}
                  >
                    ← Previous
                  </button>

                  {currentIndex < questions.length - 1 ? (
                    <button
                      type="button"
                      className="pp-primary-btn"
                      onClick={() => goToQuestion(currentIndex + 1)}
                    >
                      Next question →
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="pp-primary-btn"
                      onClick={submitTest}
                      disabled={submitting}
                    >
                      {submitting ? "Submitting..." : "Submit test"}
                    </button>
                  )}
                </div>
              </article>
            )}

            {currentIndex < questions.length - 1 && (
              <div className="pp-submit-reminder">
                Finished answering? You can submit from the last question.
                Unanswered questions must be completed before submission.
                <button
                  type="button"
                  onClick={() => goToQuestion(questions.length - 1)}
                >
                  Go to last question
                </button>
              </div>
            )}
          </main>

          <aside className="pp-question-sidebar">
            <h3>Question navigator</h3>
            <p>Select any question to revisit it.</p>

            <div className="pp-sidebar-legend">
              <span><i className="pp-legend-answered" /> Answered</span>
              <span><i className="pp-legend-current" /> Current</span>
            </div>

            <div className="pp-number-grid">
              {filteredQuestions.map((question) => {
                const originalIndex = questions.findIndex(
                  (item) => item.questionId === question.questionId
                );

                const isAnswered =
                  answers[question.questionId] !== undefined;

                return (
                  <button
                    type="button"
                    key={question.questionId}
                    className={[
                      "pp-number-btn",
                      originalIndex === currentIndex ? "current" : "",
                      isAnswered ? "answered" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => goToQuestion(originalIndex)}
                    aria-label={`Go to question ${originalIndex + 1}`}
                  >
                    {originalIndex + 1}
                  </button>
                );
              })}
            </div>

            <div className="pp-sidebar-counts">
              <div>
                <span>Aptitude</span>
                <strong>{sectionCounts.aptitude}/20</strong>
              </div>
              <div>
                <span>Reasoning</span>
                <strong>{sectionCounts.logical}/20</strong>
              </div>
              <div>
                <span>Programming</span>
                <strong>{sectionCounts.programming}/20</strong>
              </div>
            </div>

            <button
              type="button"
              className="pp-submit-btn"
              onClick={submitTest}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit test"}
            </button>
          </aside>
        </div>
      )}

      {result && renderResult()}
    </div>
  );
}
