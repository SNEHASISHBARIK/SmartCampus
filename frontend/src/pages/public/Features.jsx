import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiPlay, FiX } from "react-icons/fi";
import {
  FaFacebookF,
  FaGraduationCap,
  FaInstagram,
  FaLinkedinIn,
  FaMapMarkerAlt,
  FaYoutube,
} from "react-icons/fa";
import {
  ArrowRight,
  Bell,
  Bot,
  Building2,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Code2,
  FileText,
  GraduationCap,
  Music,
  Settings,
  ShieldCheck,
  Smartphone,
  Trophy,
  TrendingUp,
  Users,
  UsersRound,
  Zap,
} from "lucide-react";
import homeHeroImg from "../../assets/home-hero.png";
import featuresBgImg from "../../assets/features.png";
import useScrollReveal from "../../hooks/useScrollReveal";
import "./Features.css";

const features = [
  {
    id: 1,
    title: "Student Management",
    description:
      "Manage student profiles, academic records, attendance and track progress easily.",
    category: "For Students",
    color: "purple",
    icon: Users,
    preview: "student",
  },
  {
    id: 2,
    title: "Attendance System",
    description:
      "Track attendance with real-time updates and detailed analytics for better monitoring.",
    category: "For Faculty",
    color: "green",
    icon: CalendarDays,
    preview: "attendance",
  },
  {
    id: 3,
    title: "Placement Support",
    description:
      "Get placed with top companies through personalized guidance and resources.",
    category: "For Students",
    color: "orange",
    icon: BriefcaseBusiness,
    preview: "placement",
  },
  {
    id: 4,
    title: "AI Resume Analyzer",
    description:
      "Get instant feedback on your resume with AI insights and improve your chances of getting hired.",
    category: "For Students",
    color: "blue",
    icon: FileText,
    preview: "resume",
  },
  {
    id: 5,
    title: "AI Mock Interview",
    description:
      "Practice with AI and get realistic interview experience with personalized feedback.",
    category: "For Students",
    color: "purple",
    icon: Bot,
    preview: "interview",
  },
  {
    id: 6,
    title: "Announcements",
    description:
      "Stay updated with important notices, events and campus information.",
    category: "For Faculty",
    color: "pink",
    icon: Bell,
    preview: "announcements",
  },
  {
    id: 7,
    title: "Campus Engagement",
    description:
      "Join events, clubs, workshops and connect with your peers and faculty.",
    category: "For Students",
    color: "blue",
    icon: UsersRound,
    preview: "events",
  },
  {
    id: 8,
    title: "Admin Dashboard",
    description:
      "Powerful tools for administrators to manage users, placements, events and more.",
    category: "For Admin",
    color: "green",
    icon: Settings,
    preview: "admin",
  },
];

const filters = ["All", "For Students", "For Faculty", "For Admin"];

function StudentPreview() {
  return (
    <div className="preview-student">
      <div className="feature-preview-sidebar">
        <strong>SmartCampus</strong>
        <span>Dashboard</span>
        <span>Profile</span>
        <span>Attendance</span>
        <span>Academics</span>
        <span>Placements</span>
      </div>
      <div className="feature-preview-profile">
        <div className="feature-preview-person">
          <div className="feature-preview-avatar">
            <GraduationCap size={26} />
          </div>
          <div>
            <strong>Student Profile</strong>
            <small>Computer Science</small>
            <small>Academic overview</small>
          </div>
        </div>
        <div className="feature-preview-stats">
          <div>
            <small>Attendance</small>
            <strong>93%</strong>
          </div>
          <div>
            <small>CGPA</small>
            <strong>8.2</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttendancePreview() {
  const attendance = [
    { month: "Jan", height: 30 },
    { month: "Feb", height: 48 },
    { month: "Mar", height: 60 },
    { month: "Apr", height: 58 },
    { month: "May", height: 76 },
    { month: "Jun", height: 84 },
    { month: "Jul", height: 100 },
  ];

  return (
    <div className="preview-panel">
      <div className="preview-heading">
        <strong>Attendance</strong>
        <span className="preview-select">This Semester</span>
      </div>
      <div className="feature-preview-attendance-summary">
        <small>Overall Attendance</small>
        <strong>93%</strong>
        <small>+5% from last month</small>
      </div>
      <div className="feature-preview-attendance-chart">
        {attendance.map(({ month, height }) => (
          <div className="feature-preview-chart-column" key={month}>
            <div
              className="feature-preview-chart-bar"
              style={{ height: `${height}%` }}
            />
            <small>{month}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlacementPreview() {
  return (
    <div className="preview-panel">
      <div className="preview-heading">
        <strong>Placement Dashboard</strong>
      </div>
      <div className="feature-preview-placement-tabs">
        <span>Top Companies</span>
        <span>Recent Drives</span>
      </div>
      <div className="feature-preview-company-grid">
        {["TCS", "Infosys", "Wipro", "Accenture", "HCL", "Cognizant"].map(
          (company) => (
            <div className="feature-preview-company-logo" key={company}>
              {company}
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function ResumePreview() {
  const checks = [
    "Resume Structure",
    "Skills Match",
    "Content Quality",
    "Improvement Suggestions",
  ];

  return (
    <div className="preview-panel feature-preview-resume">
      <strong>Resume Analysis Result</strong>
      <div className="feature-preview-resume-content">
        <div className="feature-preview-resume-checks">
          {checks.map((item) => (
            <div key={item}>
              <CheckCircle2 size={17} />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="feature-preview-resume-score">
          <div>
            <strong>85%</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function InterviewPreview() {
  return (
    <div className="feature-preview-interview">
      <div className="feature-preview-interview-avatar">
        <Bot size={70} />
        <span>AI Interviewer</span>
      </div>
      <div className="feature-preview-interview-chat">
        <div className="feature-preview-chat-message">
          <small>AI Interviewer</small>
          <p>Tell me about yourself.</p>
        </div>
        <div className="feature-preview-chat-message feature-preview-chat-user">
          <small>Your Response</small>
          <p>I am a passionate developer...</p>
        </div>
      </div>
      <div className="feature-preview-interview-controls" aria-hidden="true">
        <span>Mic</span>
        <span>Video</span>
        <span>Chat</span>
        <span>End</span>
      </div>
    </div>
  );
}

function AnnouncementsPreview() {
  const notices = [
    ["Placement Drive - TCS", "Oct 25, 2026", "red"],
    ["Workshop on AI & ML", "Oct 22, 2026", "orange"],
    ["Holiday Notice", "Oct 20, 2026", "purple"],
  ];

  return (
    <div className="preview-panel">
      <div className="preview-heading">
        <strong>Recent Announcements</strong>
        <span className="preview-link">View All</span>
      </div>
      <div className="feature-preview-notice-list">
        {notices.map(([title, date, color]) => (
          <div className="feature-preview-notice-item" key={title}>
            <div className={`feature-preview-notice-icon ${color}`}>
              <Bell size={16} />
            </div>
            <div>
              <strong>{title}</strong>
              <small>{date}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventsPreview() {
  const events = [
    { icon: Trophy, title: "Tech Fest 2026", date: "Oct 28, 2026" },
    { icon: Code2, title: "Coding Workshop", date: "Nov 5, 2026" },
    { icon: Music, title: "Cultural Night", date: "Nov 12, 2026" },
  ];

  return (
    <div className="preview-panel">
      <div className="preview-heading">
        <strong>Campus Events</strong>
        <span className="preview-link">View All</span>
      </div>
      <div className="feature-preview-event-list">
        {events.map(({ icon: Icon, title, date }) => (
          <div className="feature-preview-event-item" key={title}>
            <div className="feature-preview-event-icon">
              <Icon size={19} />
            </div>
            <div>
              <strong>{title}</strong>
              <small>{date}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminPreview() {
  const stats = [
    { label: "Students", value: "1,250", icon: Users, color: "purple" },
    {
      label: "Faculty",
      value: "120",
      icon: GraduationCap,
      color: "green",
    },
    {
      label: "Placement Drives",
      value: "48",
      icon: BriefcaseBusiness,
      color: "purple",
    },
    {
      label: "Events",
      value: "25",
      icon: CalendarDays,
      color: "green",
    },
  ];

  return (
    <div className="preview-panel">
      <div className="preview-heading">
        <strong>Admin Dashboard</strong>
      </div>
      <div className="feature-preview-admin-grid">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div className="feature-preview-admin-stat" key={label}>
            <div className={`feature-preview-admin-icon ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const previews = {
  student: StudentPreview,
  attendance: AttendancePreview,
  placement: PlacementPreview,
  resume: ResumePreview,
  interview: InterviewPreview,
  announcements: AnnouncementsPreview,
  events: EventsPreview,
  admin: AdminPreview,
};

function FeatureCard({ feature }) {
  const Icon = feature.icon;
  const Preview = previews[feature.preview];

  return (
    <article className={`feature-card ${feature.color}`} data-scroll-reveal>
      <div className="feature-card-top">
        <div className="feature-icon">
          <Icon size={35} strokeWidth={2.4} />
        </div>
        <div className="feature-info">
          <h3>{feature.title}</h3>
          <p>{feature.description}</p>
        </div>
      </div>
      <Link
        to="/login"
        className="feature-arrow"
        aria-label={`Explore ${feature.title}`}
      >
        <ArrowRight size={19} />
      </Link>
      <div className="feature-preview">
        <Preview />
      </div>
    </article>
  );
}

const Features = () => {
  const pageRef = useRef(null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  useScrollReveal(pageRef, activeFilter);
  const filteredFeatures =
    activeFilter === "All"
      ? features
      : features.filter((feature) => feature.category === activeFilter);

  return (
    <div className="features-page-container" ref={pageRef}>
      {/* ====================================================================
          Features Hero Section with Campus Background (assets/home-hero.png)
          ==================================================================== */}
      <section
        className="features-hero-section"
        style={{ backgroundImage: `url(${homeHeroImg})` }}
      >
        {/* Atmospheric dark gradient overlay */}
        <div className="features-hero-overlay" />

        <div className="features-hero-inner">
          {/* Left Column: Heading, Subtitle, and CTAs */}
          <div className="features-hero-left">
            <div className="features-hero-eyebrow">FEATURES</div>

            <h1 className="features-hero-headline">
              Powerful Features <br />
              for a <span className="features-highlight">Smarter Campus</span>
            </h1>

            <p className="features-hero-desc">
              SmartCampus combines modern technology with intelligent solutions
              to simplify academic management, campus engagement and placement
              preparation &mdash; all in one platform.
            </p>

            <div className="features-hero-buttons">
              <a href="#features" className="btn-features-primary">
                <span>Explore Features</span>
                <FiArrowRight size={18} />
              </a>

              <button
                type="button"
                className="btn-features-demo"
                onClick={() => setShowDemoModal(true)}
              >
                <div className="features-play-icon">
                  <FiPlay size={14} fill="currentColor" />
                </div>
                <span>Watch Demo</span>
              </button>
            </div>
          </div>

          {/* Right Column: Decorative Campus Handwritten Callout & Building Signage */}
          <div className="features-hero-right-overlay">
            <div className="features-handwritten-annotation">
              <span className="features-handwritten-text">
                One Platform <br />
                Many Possibilities <br />
                for a Brighter Future
              </span>
              <svg
                className="features-handwritten-arrow"
                viewBox="0 0 60 50"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 10 C 25 35, 45 40, 50 42 M50 42 L 40 36 M50 42 L 48 28"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="features-building-signage-badge">
              <div className="features-building-brand-name">SMARTCAMPUS</div>
              <div className="features-building-brand-tagline">
                LEARN • GROW • GET PLACED
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section" id="features">
        <div className="features-container">
          <div className="features-header" data-scroll-reveal>
            <div className="features-heading">
              <div className="section-label">
                <span aria-hidden="true">✦</span> OUR FEATURES
              </div>
              <h2>
                Everything You Need in One{" "}
                <span>Powerful Platform</span>
              </h2>
              <p>
                Discover the tools and features that make SmartCampus the
                complete solution for students, faculty, and administrators.
              </p>
            </div>
            <div className="feature-filters" aria-label="Filter features">
              {filters.map((filter) => (
                <button
                  type="button"
                  key={filter}
                  className={activeFilter === filter ? "active" : ""}
                  aria-pressed={activeFilter === filter}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="features-grid">
            {filteredFeatures.map((feature) => (
              <FeatureCard feature={feature} key={feature.id} />
            ))}
          </div>
        </div>
      </section>

      <section className="features-advantage-section">
        <div className="features-advantage-inner">
          <div className="features-advantage-copy" data-scroll-reveal>
            <div className="features-section-eyebrow">
              <span aria-hidden="true">✦</span> AI-POWERED ADVANTAGE
            </div>
            <h2>
              Modern Technology
              <br />
              for <span>Real-World Success</span>
            </h2>
            <p>
              SmartCampus leverages Artificial Intelligence and modern web
              technologies to provide personalized insights, automate tasks,
              and create a seamless campus experience.
            </p>
            <a href="#features" className="features-learn-link">
              Learn How It Works
              <FiArrowRight size={17} />
            </a>
          </div>

          <div className="features-advantage-list">
            <article className="features-advantage-item" data-scroll-reveal>
              <div className="features-advantage-icon blue">
                <Bot size={28} aria-hidden="true" />
              </div>
              <h3>AI-Powered Insights</h3>
              <p>Get intelligent recommendations and analytics.</p>
            </article>
            <article className="features-advantage-item" data-scroll-reveal>
              <div className="features-advantage-icon purple">
                <Zap size={28} aria-hidden="true" />
              </div>
              <h3>Real-Time Updates</h3>
              <p>Stay informed with instant notifications.</p>
            </article>
            <article className="features-advantage-item" data-scroll-reveal>
              <div className="features-advantage-icon cyan">
                <ShieldCheck size={28} aria-hidden="true" />
              </div>
              <h3>Secure &amp; Reliable</h3>
              <p>Your data is safe with industry-standard security.</p>
            </article>
            <article className="features-advantage-item" data-scroll-reveal>
              <div className="features-advantage-icon pink">
                <Smartphone size={28} aria-hidden="true" />
              </div>
              <h3>Accessible Anywhere</h3>
              <p>Use SmartCampus on web, tablet and mobile.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="features-impact-section">
        <div className="features-impact-inner">
          <div className="features-impact-copy" data-scroll-reveal>
            <div className="features-light-eyebrow">
              <span aria-hidden="true">✦</span> OUR IMPACT
            </div>
            <h2>
              Creating a Better
              <br />
              Campus <span>Experience</span>
            </h2>
            <p>
              SmartCampus is making a real difference in the lives of students,
              faculty and institutions.
            </p>
          </div>

          <div className="features-impact-metrics">
            <article className="features-impact-metric" data-scroll-reveal>
              <UsersRound size={32} aria-hidden="true" />
              <strong>10K+</strong>
              <span>Students<br />Empowered</span>
            </article>
            <article className="features-impact-metric" data-scroll-reveal>
              <BriefcaseBusiness size={32} aria-hidden="true" />
              <strong>500+</strong>
              <span>Successful<br />Placements</span>
            </article>
            <article className="features-impact-metric" data-scroll-reveal>
              <Building2 size={32} aria-hidden="true" />
              <strong>50+</strong>
              <span>Partner<br />Companies</span>
            </article>
            <article className="features-impact-metric" data-scroll-reveal>
              <TrendingUp size={32} aria-hidden="true" />
              <strong>95%</strong>
              <span>Student<br />Satisfaction</span>
            </article>
          </div>
        </div>
      </section>

      <section className="features-cta-section">
        <div
          className="features-cta-card"
          data-scroll-reveal
          style={{ backgroundImage: `url(${featuresBgImg})` }}
        >
          <div className="features-cta-overlay" />
          <div className="features-cta-content">
            <div className="features-section-eyebrow">
              <span aria-hidden="true">✦</span> BE A PART OF SMARTCAMPUS
            </div>
            <h2>
              Discover All <span>Features</span> and{" "}
              <span>Start Your Journey</span>
            </h2>
            <p>
              Join thousands of students, faculty, and administrators who are
              already experiencing a smarter way to manage and grow in campus
              life.
            </p>
            <div className="features-cta-actions">
              <Link to="/login" className="features-cta-primary">
                Get Started <FiArrowRight size={18} />
              </Link>
              <Link to="/contact" className="features-cta-secondary">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="features-showcase-footer">
        <div className="features-footer-container">
          <div className="features-footer-grid">
            <div className="features-footer-col features-footer-brand-col">
              <Link to="/" className="features-footer-logo-link">
                <span className="features-footer-logo-icon">
                  <FaGraduationCap size={20} />
                </span>
                <span className="features-footer-logo-text">
                  <span className="brand-bold">Smart</span>
                  <span className="brand-accent">Campus</span>
                </span>
              </Link>
              <div className="features-footer-tagline">
                Learn • Grow • Get Placed
              </div>
            </div>

            <div className="features-footer-col">
              <h4 className="features-footer-col-title">Quick Links</h4>
              <ul className="features-footer-link-list">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/features">Features</Link></li>
                <li><Link to="/placement">Placements</Link></li>
              </ul>
            </div>

            <div className="features-footer-col">
              <h4 className="features-footer-col-title">Resources</h4>
              <ul className="features-footer-link-list">
                <li><Link to="/blog">Blog</Link></li>
                <li><Link to="/help">Help Center</Link></li>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms &amp; Conditions</Link></li>
              </ul>
            </div>

            <div className="features-footer-col features-footer-connect-col">
              <h4 className="features-footer-col-title">Connect With Us</h4>
              <div className="features-footer-socials">
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="features-footer-social-link" aria-label="LinkedIn">
                  <FaLinkedinIn size={16} />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="features-footer-social-link" aria-label="Instagram">
                  <FaInstagram size={16} />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="features-footer-social-link" aria-label="Facebook">
                  <FaFacebookF size={15} />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="features-footer-social-link" aria-label="YouTube">
                  <FaYoutube size={17} />
                </a>
              </div>
              <div className="features-footer-contact-info">
                <div className="features-footer-contact-item">
                  <span className="features-footer-mail-text">contact@smartcampus.com</span>
                </div>
                <div className="features-footer-contact-item">
                  <FaMapMarkerAlt size={14} className="features-footer-pin-icon" />
                  <span>Jharsuguda, Odisha, India</span>
                </div>
              </div>
            </div>

            <div className="features-footer-col features-footer-script-col">
              <div className="features-footer-script-wrap">
                <div className="features-footer-handwritten-text">
                  <span>Learn</span>
                  <span>Connect</span>
                  <span>Grow</span>
                  <span>Get Placed</span>
                </div>
                <svg
                  className="features-footer-curved-arrow"
                  width="70"
                  height="34"
                  viewBox="0 0 70 34"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M62 4C58 14 42 28 8 28"
                    stroke="#a855f7"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M14 22L7 28L15 32"
                    stroke="#a855f7"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="features-footer-bottom-bar">
            <div className="features-footer-copyright">
              © {new Date().getFullYear()} SmartCampus. All rights reserved.
            </div>
            <div className="features-footer-bottom-tagline">
              Empowering Students. Enabling Futures.
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Video / Demo Modal */}
      {showDemoModal && (
        <div
          className="features-modal-backdrop"
          role="presentation"
          onClick={() => setShowDemoModal(false)}
        >
          <div
            className="features-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="features-demo-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="features-modal-close"
              onClick={() => setShowDemoModal(false)}
              aria-label="Close modal"
            >
              <FiX size={20} />
            </button>
            <h2 id="features-demo-title">
              SmartCampus Features Demo
            </h2>
            <p>
              Discover how SmartCampus automates academic tracking, facial and
              QR attendance, AI mock interviews, and university placement
              pipelines.
            </p>
            <Link to="/login" className="btn-features-primary">
              <span>Login to Explore Features</span>
              <FiArrowRight size={18} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Features;
