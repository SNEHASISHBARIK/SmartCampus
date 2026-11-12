import React, { useState } from "react";
import "./InterviewResults.css";

export default function InterviewResults({
  report,
  history = [],
  onRetake,
  onBackToJobs,
}) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!report) return null;

  const {
    jobTitle = "Software Developer",
    company = "Placement Opportunity",
    overallScore = 0,
    categories = {},
    feedback = {},
    skillGaps = [],
    learningRoadmap = [],
    recommendedPriorities = [],
    questionsAndAnswers = [],
    submittedAt,
  } = report;

  // Determine score status badge
  let statusClass = "ir-score-status--low";
  let statusText = "Needs Preparation";
  if (overallScore >= 75) {
    statusClass = "ir-score-status--high";
    statusText = "Placement Ready";
  } else if (overallScore >= 55) {
    statusClass = "ir-score-status--mid";
    statusText = "Good Attempt";
  }

  const categoryList = [
    {
      key: "technical",
      label: "Technical Knowledge",
      data: categories.technical || { score: 0, recommendation: "" },
    },
    {
      key: "communication",
      label: "Communication",
      data: categories.communication || { score: 0, recommendation: "" },
    },
    {
      key: "problemSolving",
      label: "Problem-Solving",
      data: categories.problemSolving || { score: 0, recommendation: "" },
    },
    {
      key: "relevance",
      label: "Answer Relevance",
      data: categories.relevance || { score: 0, recommendation: "" },
    },
    {
      key: "confidence",
      label: "Confidence & Clarity",
      data: categories.confidence || { score: 0, recommendation: "" },
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="interview-results">
      {/* ── Top Hero Banner ── */}
      <div className="ir-hero">
        <div className="ir-hero__info">
          <h1>SmartCampus — Interview Performance Report</h1>
          <div className="ir-hero__meta">
            <span className="ir-hero__badge">💼 {jobTitle}</span>
            <span className="ir-hero__badge">🏢 {company}</span>
            {submittedAt && (
              <span>📅 {new Date(submittedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        <div className="ir-hero__actions">
          <button
            type="button"
            className="ir-btn-hero"
            onClick={onRetake}
          >
            🔄 Take Another Interview
          </button>
          <button
            type="button"
            className="ir-btn-hero ir-btn-hero--outline"
            onClick={handlePrint}
          >
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>

      {/* ── Overview & Categories ── */}
      <div className="ir-overview-grid">
        {/* Overall Score Card */}
        <div className="ir-score-card">
          <h3>Overall Interview Score</h3>
          <div className="ir-gauge">
            <svg viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="52"
                className="ir-gauge__bg"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                className="ir-gauge__fg"
                strokeDasharray={`${(overallScore / 100) * 327} 327`}
              />
            </svg>
            <div className="ir-gauge__value">
              <span className="ir-gauge__number">{overallScore}</span>
              <span className="ir-gauge__max">/ 100</span>
            </div>
          </div>
          <span className={`ir-score-status ${statusClass}`}>
            {statusText}
          </span>
          <p>
            Calculated from your technical depth, question completion, and
            structured responses.
          </p>
        </div>

        {/* Category Breakdown */}
        <div className="ir-categories-card">
          <h3>Evaluation Categories &amp; AI Recommendations</h3>
          <div className="ir-cat-list">
            {categoryList.map((cat) => {
              const score = cat.data.score || 0;
              let fillClass = "";
              if (score < 50) fillClass = "ir-cat-bar__fill--low";
              else if (score < 70) fillClass = "ir-cat-bar__fill--mid";

              return (
                <div key={cat.key} className="ir-cat-item">
                  <div className="ir-cat-item__top">
                    <span>{cat.label}</span>
                    <span className="ir-cat-item__score">{score}/100</span>
                  </div>
                  <div className="ir-cat-bar">
                    <div
                      className={`ir-cat-bar__fill ${fillClass}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <span className="ir-cat-recom">
                    💡 {cat.data.recommendation}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Feature 1: Personalized Interview Feedback ── */}
      <div className="ir-card">
        <div className="ir-card__header">
          <div className="ir-card__icon">🧠</div>
          <div>
            <h3 className="ir-card__title">Personalized Interview Feedback</h3>
            <p className="ir-card__subtitle">
              Detailed assessment of what went well and where to focus next.
            </p>
          </div>
        </div>

        <div className="ir-feedback-grid">
          <div className="ir-feedback-box ir-feedback-box--strengths">
            <h4>Key Strengths</h4>
            <ul>
              {(feedback.strengths || []).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div className="ir-feedback-box ir-feedback-box--weaknesses">
            <h4>Areas for Growth</h4>
            <ul>
              {(feedback.weaknesses || []).map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>

        {feedback.summary && (
          <p className="ir-summary-note">
            <strong>AI Coach Summary: </strong>
            {feedback.summary}
          </p>
        )}
      </div>

      {/* ── Feature 2: Skill Gap Analysis ── */}
      <div className="ir-card">
        <div className="ir-card__header">
          <div className="ir-card__icon">🎯</div>
          <div>
            <h3 className="ir-card__title">Skill Gap Analysis</h3>
            <p className="ir-card__subtitle">
              Benchmarked against key skills required for <strong>{jobTitle}</strong>.
            </p>
          </div>
        </div>

        <div className="ir-table-wrap">
          <table className="ir-table">
            <thead>
              <tr>
                <th>Skill</th>
                <th>Current Assessment</th>
                <th>Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {(skillGaps || []).map((sg, i) => {
                let badgeClass = "ir-badge--not-assessed";
                if (sg.assessment === "Good") badgeClass = "ir-badge--good";
                else if (sg.assessment === "Moderate")
                  badgeClass = "ir-badge--moderate";
                else if (sg.assessment === "Needs Improvement")
                  badgeClass = "ir-badge--needs";

                return (
                  <tr key={i}>
                    <td className="ir-skill-name">{sg.skill}</td>
                    <td>
                      <span className={`ir-badge ${badgeClass}`}>
                        {sg.assessment}
                      </span>
                    </td>
                    <td className="ir-action-text">{sg.recommendedAction}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Feature 3: Personalized Learning Roadmap ── */}
      <div className="ir-card">
        <div className="ir-card__header">
          <div className="ir-card__icon">📅</div>
          <div>
            <h3 className="ir-card__title">
              Personalized 7-Day Improvement Roadmap
            </h3>
            <p className="ir-card__subtitle">
              Actionable daily milestones designed to turn interview weaknesses
              into strengths.
            </p>
          </div>
        </div>

        <div className="ir-roadmap-grid">
          {(learningRoadmap || []).map((step) => (
            <div key={step.day} className="ir-roadmap-card">
              <span className="ir-roadmap-card__day">Day {step.day}</span>
              <h4>{step.activity}</h4>
              <p>🎯 Goal: {step.goal}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Feature 4: Recommended Priorities & Learning Resources ── */}
      <div className="ir-card">
        <div className="ir-card__header">
          <div className="ir-card__icon">🚀</div>
          <div>
            <h3 className="ir-card__title">Recommended Skills &amp; Priorities</h3>
            <p className="ir-card__subtitle">
              Targeted focus areas to maximize your score in the next campus round.
            </p>
          </div>
        </div>

        <div className="ir-priorities-grid">
          {(recommendedPriorities || []).map((pri) => (
            <div key={pri.priority} className="ir-priority-card">
              <span className="ir-priority-tag">
                Priority {pri.priority} — {pri.area}
              </span>
              <h4>Action Items</h4>
              <ul>
                {(pri.tasks || []).map((task, tIdx) => (
                  <li key={tIdx}>{task}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Feature 5: Interview Answer Improvement ── */}
      <div className="ir-card">
        <div className="ir-card__header">
          <div className="ir-card__icon">📝</div>
          <div>
            <h3 className="ir-card__title">
              Interview Answer Improvement &amp; Model Answers
            </h3>
            <p className="ir-card__subtitle">
              Study what you said, identify missing components, and explore
              stronger responses.
            </p>
          </div>
        </div>

        <div className="ir-qa-list">
          {(questionsAndAnswers || []).map((item, idx) => (
            <div key={idx} className="ir-qa-card">
              <h4 className="ir-qa-q">
                <span className="ir-qa-num">Q{idx + 1}</span>
                {item.question}
              </h4>
              <div className="ir-qa-subgrid">
                <div className="ir-qa-section ir-qa-section--answer">
                  <strong>🗣️ Your Answer</strong>
                  <p>{item.studentAnswer}</p>
                </div>
                {item.whatToImprove && (
                  <div className="ir-qa-section ir-qa-section--improve">
                    <strong>⚠️ What Could Improve</strong>
                    <p>{item.whatToImprove}</p>
                  </div>
                )}
                {item.strongerAnswer && (
                  <div className="ir-qa-section ir-qa-section--model">
                    <strong>🌟 Example of a Stronger Answer</strong>
                    <p>{item.strongerAnswer}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Feature 6: Progress Tracking Across Attempts ── */}
      {history.length > 0 && (
        <div className="ir-card">
          <div className="ir-card__header">
            <div className="ir-card__icon">📈</div>
            <div>
              <h3 className="ir-card__title">Progress Tracking</h3>
              <p className="ir-card__subtitle">
                Compare your performance across completed mock interviews.
              </p>
            </div>
          </div>

          <div className="ir-table-wrap">
            <table className="ir-history-table">
              <thead>
                <tr>
                  <th>Attempt</th>
                  <th>Date</th>
                  <th>Target Role</th>
                  <th>Technical</th>
                  <th>Communication</th>
                  <th>Overall Score</th>
                </tr>
              </thead>
              <tbody>
                {history.map((att, i) => (
                  <tr key={att._id || i}>
                    <td>
                      <strong>Interview {history.length - i}</strong>
                    </td>
                    <td>
                      {att.submittedAt
                        ? new Date(att.submittedAt).toLocaleDateString()
                        : "Recent"}
                    </td>
                    <td>{att.jobTitle}</td>
                    <td>{att.technicalScore ?? 0}</td>
                    <td>{att.communicationScore ?? 0}</td>
                    <td>
                      <strong>{att.overallScore ?? 0}</strong>
                      {typeof att.diff === "number" && att.diff !== 0 && (
                        <span
                          className={`ir-diff ${
                            att.diff > 0 ? "ir-diff--up" : "ir-diff--down"
                          }`}
                        >
                          {att.diff > 0 ? `+${att.diff}` : att.diff}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Bottom Actions ── */}
      <div className="ir-footer-actions">
        <button
          type="button"
          className="ir-btn-primary"
          onClick={onRetake}
        >
          🔄 Start Another Mock Interview
        </button>
        {onBackToJobs && (
          <button
            type="button"
            className="ir-btn-secondary"
            onClick={onBackToJobs}
          >
            ← Back to Positions
          </button>
        )}
      </div>
    </div>
  );
}
