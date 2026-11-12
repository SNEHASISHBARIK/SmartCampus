import { FiArrowRight, FiBookOpen, FiBriefcase, FiCheckCircle, FiCode, FiFileText, FiGitBranch, FiMonitor, FiUsers } from "react-icons/fi";
import { Link } from "react-router-dom";
import "./PlacementLearningPages.css";

const process = [
  "Company Registration",
  "Job Notification",
  "Application & Shortlisting",
  "Interview Rounds",
  "Offer & Onboarding",
];

const roadmap = [
  { title: "Build Basics", text: "Strengthen DSA, OOPs, and core subjects.", icon: FiBookOpen },
  { title: "Develop Skills", text: "Learn in-demand tech skills (Web, Cloud, DevOps, AI/ML).", icon: FiCode },
  { title: "Build Projects", text: "Create real-world projects and host them on GitHub.", icon: FiMonitor },
  { title: "Practice & Apply", text: "Solve interview questions and apply for relevant roles.", icon: FiUsers },
];

const skills = ["DSA", "Web Development", "Database (SQL)", "Git & GitHub", "Cloud (AWS/Azure)", "AI / ML"];

const guideSections = [
  { id: "guide-overview", title: "Overview" },
  { id: "guide-process", title: "Placement Process" },
  { id: "guide-roadmap", title: "Preparation Roadmap" },
  { id: "guide-skills", title: "Skills & Certifications" },
  { id: "guide-resume", title: "Resume & Portfolio" },
  { id: "guide-applications", title: "Application & Shortlisting" },
  { id: "guide-interviews", title: "Interview & Selection" },
  { id: "guide-after", title: "After Getting Placed" },
];

export default function PlacementGuide() {
  return (
    <div className="placement-learning-page">
      <header className="learning-hero">
        <div className="learning-hero-copy">
          <span className="learning-eyebrow"><FiBookOpen /> Placement Guide</span>
          <h1>Placement <span>Guide</span></h1>
          <p>A complete roadmap to help you prepare, apply, and succeed in campus placements.</p>
        </div>
        <div className="learning-hero-art guide-art" aria-hidden="true">
          <div className="guide-art-circle"><FiBriefcase /></div>
          <span className="guide-art-cap">✦</span>
          <span className="guide-art-bars"><i /><i /><i /></span>
        </div>
      </header>

      <div className="learning-quick-links" aria-label="Placement guide sections">
        {[
          ["guide-roadmap", "Preparation Roadmap", FiGitBranch],
          ["guide-skills", "Skills to Learn", FiCode],
          ["guide-resume", "Resume & Portfolio", FiFileText],
          ["guide-applications", "Apply & Shortlist", FiBriefcase],
          ["guide-interviews", "Interview Process", FiUsers],
          ["guide-after", "Get Placed", FiCheckCircle],
        ].map(([id, label, Icon]) => (
          <a className="learning-quick-card" href={`#${id}`} key={id}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </a>
        ))}
      </div>

      <main className="learning-layout">
        <aside className="learning-toc">
          <strong>On This Page</strong>
          <nav aria-label="Placement guide contents">
            {guideSections.map(({ id, title }) => (
              <a href={`#${id}`} key={id}>{title}</a>
            ))}
          </nav>
        </aside>

        <div className="learning-article">
          <section className="learning-section" id="guide-overview">
            <h2><FiCheckCircle /> Overview</h2>
            <p>
              The Placement Guide gives you a step-by-step plan to build the right
              skills, create a strong profile, and crack campus placements.
            </p>
          </section>

          <section className="learning-section" id="guide-process">
            <h2><FiBriefcase /> Placement Process</h2>
            <div className="placement-process">
              {process.map((step, index) => (
                <div className="placement-process-step" key={step}>
                  <span>{index + 1}</span>
                  <strong>{step}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="learning-section" id="guide-roadmap">
            <h2><FiGitBranch /> Preparation Roadmap</h2>
            <div className="learning-card-grid four">
              {roadmap.map(({ title, text, icon: Icon }, index) => (
                <article className="learning-info-card" key={title}>
                  <Icon aria-hidden="true" />
                  <strong>{index + 1}. {title}</strong>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="learning-section" id="guide-skills">
            <h2><FiCheckCircle /> Recommended Skills &amp; Certifications</h2>
            <div className="learning-skill-list">
              {skills.map((skill) => <span key={skill}><FiCheckCircle />{skill}</span>)}
            </div>
          </section>

          <section className="learning-section" id="guide-resume">
            <h2><FiFileText /> Resume &amp; Portfolio</h2>
            <p>
              Keep your resume concise and tailored to each role. Highlight
              relevant projects, measurable outcomes, technical skills, and
              contributions rather than listing responsibilities alone.
            </p>
            <ul className="learning-bullet-list">
              <li>Use clear headings and a consistent, easy-to-scan layout.</li>
              <li>Include links to projects, GitHub, or a portfolio where relevant.</li>
              <li>Proofread carefully and keep your contact information current.</li>
            </ul>
          </section>

          <section className="learning-section" id="guide-applications">
            <h2><FiBriefcase /> Application &amp; Shortlisting</h2>
            <p>
              Read each job description and eligibility criteria before applying.
              Keep track of deadlines, required documents, and the status of each
              application so you can follow up on time.
            </p>
          </section>

          <section className="learning-section" id="guide-interviews">
            <h2><FiUsers /> Interview &amp; Selection</h2>
            <p>
              Prepare for aptitude, technical, and behavioral rounds. Practice
              explaining your thinking, reviewing your projects, and asking
              thoughtful questions about the role.
            </p>
            <Link className="learning-inline-link" to="/interview-tips">
              Read our Interview Tips <FiArrowRight />
            </Link>
          </section>

          <section className="learning-section" id="guide-after">
            <h2><FiCheckCircle /> After Getting Placed</h2>
            <p>
              Review your offer carefully, clarify next steps with the recruiter,
              and complete any onboarding requirements before the stated
              deadlines.
            </p>
          </section>
        </div>
      </main>

      <section className="learning-cta">
        <FiBriefcase aria-hidden="true" />
        <div>
          <h2>Ready to Start Your Placement Journey?</h2>
          <p>Follow the guide, build your skills, and get closer to your dream job.</p>
        </div>
        <Link to="/placement">Explore Placements <FiArrowRight /></Link>
      </section>
    </div>
  );
}
