import { useState } from "react";
import {
  FiArrowRight,
  FiBookOpen,
  FiCheckCircle,
  FiChevronDown,
  FiCode,
  FiDownload,
  FiMessageCircle,
  FiMonitor,
  FiStar,
  FiTarget,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import "./PlacementLearningPages.css";

const sections = [
  { id: "interview-overview", title: "Overview" },
  { id: "interview-before", title: "Before the Interview" },
  { id: "interview-during", title: "During the Interview" },
  { id: "interview-after", title: "After the Interview" },
  { id: "interview-questions", title: "Common Questions" },
  { id: "interview-technical", title: "Technical Tips" },
  { id: "interview-hr", title: "HR Tips" },
  { id: "interview-donts", title: "Do's & Don'ts" },
];

const tips = [
  { title: "Know Your Basics", text: "Revise core concepts (DSA, OS, DBMS, CN, etc.).", icon: FiBookOpen },
  { title: "Practice Coding", text: "Solve problems on LeetCode, GFG, or HackerRank.", icon: FiCode },
  { title: "Be Project Ready", text: "Understand your projects deeply (tech stack, roles, challenges, results).", icon: FiMonitor },
  { title: "Improve Communication", text: "Explain your thoughts clearly and confidently.", icon: FiUser },
  { title: "Show Problem-Solving", text: "Think aloud and break down the problem logically.", icon: FiTarget },
  { title: "Be Professional", text: "Be punctual, polite, and positive throughout the interview.", icon: FiStar },
];

const questions = [
  {
    question: "Tell me about yourself.",
    answer: "Give a concise introduction: your current studies, relevant strengths or projects, and what interests you about this opportunity.",
  },
  {
    question: "Why should we hire you?",
    answer: "Connect your strongest role-relevant skills to the team's needs, and support your answer with a specific example.",
  },
  {
    question: "Explain one of your projects in detail.",
    answer: "Describe the problem, your contribution, the tools you used, a challenge you solved, and what you learned.",
  },
  {
    question: "What are your strengths and weaknesses?",
    answer: "Choose genuine strengths with examples. For a weakness, share a real area you are improving and the steps you are taking.",
  },
  {
    question: "Where do you see yourself in five years?",
    answer: "Talk about growing your skills, taking on meaningful responsibilities, and contributing to work aligned with the role.",
  },
  {
    question: "Do you have any questions for us?",
    answer: "Ask about the team's work, onboarding, role expectations, or how success is measured in the position.",
  },
];

function downloadChecklist() {
  const checklist = [
    "SMARTCAMPUS INTERVIEW CHECKLIST",
    "",
    "[ ] Review the job description and company",
    "[ ] Prepare a short introduction",
    "[ ] Review core concepts and practice questions",
    "[ ] Prepare to explain your projects and contributions",
    "[ ] Test your internet, camera, and audio (for virtual interviews)",
    "[ ] Plan your route and arrive early (for in-person interviews)",
    "[ ] Prepare a few questions for the interviewer",
    "[ ] Send a brief thank-you note after the interview",
  ].join("\n");
  const file = new Blob([checklist], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "smartcampus-interview-checklist.txt";
  link.click();
  URL.revokeObjectURL(url);
}

export default function InterviewTips() {
  const [openQuestion, setOpenQuestion] = useState(questions[0].question);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const shownQuestions = showAllQuestions ? questions : questions.slice(0, 4);

  return (
    <div className="placement-learning-page">
      <header className="learning-hero interview-hero">
        <div className="learning-hero-copy">
          <span className="learning-eyebrow"><FiMessageCircle /> Interview Tips</span>
          <h1>Interview <span>Tips</span></h1>
          <p>Practical tips, strategies, and common questions to help you crack your next interview with confidence.</p>
        </div>
        <div className="learning-hero-art interview-art" aria-hidden="true">
          <div className="interview-person candidate"><FiUser /></div>
          <div className="interview-chat">•••</div>
          <div className="interview-person recruiter"><FiUsers /></div>
        </div>
      </header>

      <div className="learning-quick-links interview-quick-links" aria-label="Interview tips sections">
        {[
          ["interview-before", "Preparation Tips", FiTarget],
          ["interview-questions", "Common Questions", FiBookOpen],
          ["interview-technical", "Technical Rounds", FiCode],
          ["interview-hr", "HR Round", FiUsers],
          ["interview-donts", "Do's & Don'ts", FiStar],
        ].map(([id, label, Icon]) => (
          <a className="learning-quick-card" href={`#${id}`} key={id}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </a>
        ))}
      </div>

      <main className="learning-layout interview-layout">
        <aside className="learning-toc">
          <strong>On This Page</strong>
          <nav aria-label="Interview tips contents">
            {sections.map(({ id, title }) => (
              <a href={`#${id}`} key={id}>{title}</a>
            ))}
          </nav>
        </aside>

        <div className="learning-article">
          <section className="learning-section" id="interview-overview">
            <h2><FiTarget /> Overview</h2>
            <p>
              Interviews are your chance to showcase your skills, attitude, and
              problem-solving ability. Here are proven tips to help you prepare
              and perform better.
            </p>
          </section>

          <section className="learning-section" id="interview-before">
            <h2><FiMessageCircle /> Key Interview Tips</h2>
            <div className="learning-card-grid three">
              {tips.map(({ title, text, icon: Icon }) => (
                <article className="learning-info-card" key={title}>
                  <Icon aria-hidden="true" />
                  <strong>{title}</strong>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="learning-section" id="interview-during">
            <h2><FiUsers /> During the Interview</h2>
            <ul className="learning-bullet-list">
              <li>Listen carefully and ask for clarification when you need it.</li>
              <li>Explain your approach step by step, especially during technical rounds.</li>
              <li>Use specific examples and be honest about what you do not know.</li>
              <li>Keep a calm, professional, and positive tone.</li>
            </ul>
          </section>

          <section className="learning-section" id="interview-after">
            <h2><FiCheckCircle /> After the Interview</h2>
            <p>
              Thank the interviewers for their time, reflect on questions you
              found challenging, and send a short follow-up if appropriate.
              Continue applying and practicing while you wait for a response.
            </p>
          </section>

          <section className="learning-section interview-faq" id="interview-questions">
            <div className="learning-section-heading">
              <h2><FiMessageCircle /> Common Interview Questions</h2>
              <button
                type="button"
                className="learning-inline-button"
                onClick={() => setShowAllQuestions((show) => !show)}
              >
                {showAllQuestions ? "Show Less" : "View All"} <FiArrowRight />
              </button>
            </div>
            <div className="interview-question-list">
              {shownQuestions.map(({ question, answer }) => {
                const isOpen = openQuestion === question;
                return (
                  <article className={`interview-question${isOpen ? " open" : ""}`} key={question}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenQuestion(isOpen ? "" : question)}
                    >
                      <span>{question}</span><FiChevronDown />
                    </button>
                    {isOpen && <p>{answer}</p>}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="learning-section" id="interview-technical">
            <h2><FiCode /> Technical Tips</h2>
            <p>
              Clarify constraints before coding, start with a straightforward
              solution, and then discuss efficiency. Test edge cases and explain
              trade-offs as you work.
            </p>
          </section>

          <section className="learning-section" id="interview-hr">
            <h2><FiUsers /> HR Tips</h2>
            <p>
              Be authentic and specific. Use examples to show teamwork,
              adaptability, and ownership, and explain what you learned from
              setbacks.
            </p>
          </section>

          <section className="learning-section" id="interview-donts">
            <h2><FiCheckCircle /> Do&apos;s &amp; Don&apos;ts</h2>
            <div className="learning-do-dont">
              <div><strong>Do</strong><p>Arrive prepared, communicate clearly, and give credit to your teammates.</p></div>
              <div><strong>Don&apos;t</strong><p>Interrupt, exaggerate your experience, or speak negatively about others.</p></div>
            </div>
          </section>
        </div>
      </main>

      <section className="learning-cta">
        <FiTarget aria-hidden="true" />
        <div>
          <h2>Get Interview Ready!</h2>
          <p>Practice, plan, and present your best self with these tips.</p>
        </div>
        <button type="button" onClick={downloadChecklist}><FiDownload /> Download Interview Checklist</button>
      </section>
      <div className="learning-back-link">
        <Link to="/placement-guide"><FiArrowRight /> Back to the Placement Guide</Link>
      </div>
    </div>
  );
}
