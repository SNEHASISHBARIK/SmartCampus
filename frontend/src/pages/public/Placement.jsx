import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiCpu,
  FiFileText,
  FiMapPin,
  FiPlay,
  FiSearch,
  FiStar,
  FiTrendingUp,
  FiUsers,
  FiX,
} from "react-icons/fi";
import {
  FaFacebookF,
  FaGraduationCap,
  FaInstagram,
  FaLinkedinIn,
  FaMapMarkerAlt,
  FaYoutube,
} from "react-icons/fa";
import homeHeroImg from "../../assets/home-hero.png";
import featuresBgImg from "../../assets/features.png";
import tcsLogo from "../../assets/company1.jpeg";
import infosysLogo from "../../assets/company2.png";
import wiproLogo from "../../assets/company3.png";
import accentureLogo from "../../assets/company4.png";
import hclLogo from "../../assets/company5.jpeg";
import cognizantLogo from "../../assets/company6.png";
import hclPartnerLogo from "../../assets/images 1.jpeg";
import accenturePartnerLogo from "../../assets/image2.png";
import capgeminiLogo from "../../assets/images 3.jpeg";
import techMahindraLogo from "../../assets/images 4.jpeg";
import cognizantPartnerLogo from "../../assets/images 5.png";
import tTechSolutionsLogo from "../../assets/images 6.png";
import ibmLogo from "../../assets/images 7.jpeg";
import techCoLogo from "../../assets/images 8.png";
import amazonLogo from "../../assets/images 9.jpeg";
import aiAutomationLogo from "../../assets/images 10.png";
import technovaLogo from "../../assets/images 11.jpeg";
import fluxTechLogo from "../../assets/images 12.png";
import astroTechLogo from "../../assets/images 13.jpeg";
import bcTechLogo from "../../assets/images 14.png";
import alyceLogo from "../../assets/images 15.jpeg";
import wTechLogo from "../../assets/images 16.jpeg";
import orbixLogo from "../../assets/images 17.jpeg";
import mobileTechLogo from "../../assets/images 18.jpeg";
import wiproPartnerLogo from "../../assets/images 19.png";
import neuraltoLogo from "../../assets/images 20.jpeg";
import priyaImg from "../../assets/priya.png";
import rohitImg from "../../assets/rohit.png";
import snehaImg from "../../assets/sneha.png";
import useScrollReveal from "../../hooks/useScrollReveal";
import "./Placement.css";

const companies = [
  { name: "TCS", logo: tcsLogo },
  { name: "Infosys", logo: infosysLogo, checkerboard: true },
  { name: "Wipro", logo: wiproLogo },
  { name: "Accenture", logo: accentureLogo, checkerboard: true },
  { name: "HCL", logo: hclLogo, checkerboard: true },
  { name: "Cognizant", logo: cognizantLogo },
];

const partnerCompanies = [
  { name: "TCS", logo: tcsLogo },
  { name: "Infosys", logo: infosysLogo },
  { name: "HCL", logo: hclPartnerLogo },
  { name: "Accenture", logo: accenturePartnerLogo },
  { name: "Capgemini", logo: capgeminiLogo },
  { name: "Tech Mahindra", logo: techMahindraLogo },
  { name: "Cognizant", logo: cognizantPartnerLogo },
  { name: "T Tech Solutions", logo: tTechSolutionsLogo },
  { name: "IBM", logo: ibmLogo },
  { name: "tech.co", logo: techCoLogo },
  { name: "Amazon", logo: amazonLogo },
  { name: "AI Automation", logo: aiAutomationLogo },
  { name: "TECHNOVA", logo: technovaLogo },
  { name: "FluxTech", logo: fluxTechLogo },
  { name: "Astrotech", logo: astroTechLogo },
  { name: "BC Tech Association", logo: bcTechLogo },
  { name: "Alyce", logo: alyceLogo },
  { name: "W-Tech", logo: wTechLogo },
  { name: "Orbix", logo: orbixLogo },
  { name: "Mobile Tech", logo: mobileTechLogo },
  { name: "Wipro", logo: wiproPartnerLogo },
  { name: "Neuralto", logo: neuraltoLogo },
];

const opportunities = [
  {
    company: companies[0],
    role: "Software Developer",
    location: "Bengaluru",
    salary: "₹6–11 LPA",
    tags: ["React", "Node.js", "DSA"],
  },
  {
    company: companies[1],
    role: "Systems Engineer",
    location: "Multiple locations",
    salary: "₹5–9 LPA",
    tags: ["Java", "SQL", "Problem Solving"],
  },
  {
    company: companies[2],
    role: "Project Engineer",
    location: "Bengaluru",
    salary: "₹5–8 LPA",
    tags: ["Python", "Cloud", "Web Tech"],
  },
  {
    company: companies[3],
    role: "Associate Software Engineer",
    location: "Hyderabad",
    salary: "₹6–10 LPA",
    tags: ["Cloud", "DevOps", "AI/ML"],
  },
];

const placementTools = [
  {
    title: "Job Opportunities",
    description: "Explore curated openings from top companies.",
    icon: FiSearch,
    tone: "blue",
  },
  {
    title: "AI Resume Analyzer",
    description: "Improve your resume with personalized feedback.",
    icon: FiFileText,
    tone: "purple",
  },
  {
    title: "AI Mock Interview",
    description: "Practice with AI and build interview confidence.",
    icon: FiCpu,
    tone: "cyan",
  },
  {
    title: "Placement Resources",
    description: "Access preparation guides and learning material.",
    icon: FiTrendingUp,
    tone: "green",
  },
  {
    title: "Company Connect",
    description: "Meet recruiters and join career webinars.",
    icon: FiUsers,
    tone: "purple",
  },
];

const benefits = [
  "Direct access to top company opportunities",
  "AI-powered resume and interview preparation",
  "Personalized job recommendations",
  "Placement drives, webinars and career guidance",
  "Track your application progress in one place",
];

const stories = [
  {
    name: "Rohit Verma",
    role: "Placed at TCS",
    image: rohitImg,
    quote:
      "The placement resources and interview practice helped me feel prepared and confident.",
  },
  {
    name: "Priya Sharma",
    role: "Placed at Infosys",
    image: priyaImg,
    quote:
      "AI mock interviews gave me useful feedback and helped me prepare for every round.",
  },
  {
    name: "Sneha Patel",
    role: "Placed at Wipro",
    image: snehaImg,
    quote:
      "Having opportunities, preparation tools, and updates in one place made a real difference.",
  },
];

const placementDrives = [
  { company: companies[0], date: "Nov 18, 2026", location: "On Campus" },
  { company: companies[1], date: "Nov 25, 2026", location: "On Campus" },
  { company: companies[2], date: "Dec 02, 2026", location: "Virtual" },
];

function CompanyLogo({ company, className = "", loading = "lazy" }) {
  return (
    <img
      className={`placement-company-logo ${className}`}
      data-checkerboard={company.checkerboard || undefined}
      src={company.logo}
      alt={`${company.name} logo`}
      loading={loading}
    />
  );
}

const Placement = () => {
  const pageRef = useRef(null);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [activePartnerIndex, setActivePartnerIndex] = useState(0);
  useScrollReveal(pageRef, showAllCompanies);

  useEffect(() => {
    if (
      showAllCompanies ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return undefined;
    }

    const rotationTimer = window.setInterval(() => {
      setActivePartnerIndex((currentIndex) =>
        (currentIndex + 1) % partnerCompanies.length,
      );
    }, 3000);

    return () => window.clearInterval(rotationTimer);
  }, [showAllCompanies]);

  return (
    <div className="placement-page-container" ref={pageRef}>
      {/* ====================================================================
          Placement Hero Section with Campus Background (assets/home-hero.png)
          ==================================================================== */}
      <section
        className="placement-hero-section"
        style={{ backgroundImage: `url(${homeHeroImg})` }}
      >
        {/* Atmospheric dark gradient overlay */}
        <div className="placement-hero-overlay" />

        <div className="placement-hero-inner">
          {/* Left Column: Eyebrow, Heading, Description, Action Buttons, and Stats */}
          <div className="placement-hero-left">
            <div className="placement-hero-eyebrow">PLACEMENT CELL</div>

            <h1 className="placement-hero-headline">
              Your Career Starts <br />
              Here with <span className="placement-highlight">SmartCampus</span>
            </h1>

            <p className="placement-hero-desc">
              Explore top job opportunities, prepare with AI tools, and get placed
              with your dream company. SmartCampus connects students with
              industries and provides complete placement support.
            </p>

            <div className="placement-hero-buttons">
              <a href="#placement-opportunities" className="btn-placement-primary">
                <span>View Job Opportunities</span>
                <FiArrowRight size={18} />
              </a>

              <button
                type="button"
                className="btn-placement-secondary"
                onClick={() => setShowStoryModal(true)}
              >
                <div className="placement-play-icon">
                  <FiPlay size={14} fill="currentColor" />
                </div>
                <span>Watch Success Stories</span>
              </button>
            </div>

            {/* 4 Placement Indicators */}
            <div className="placement-hero-stats">
              {/* Stat 1 */}
              <div className="placement-stat-item">
                <div className="placement-stat-icon-wrap cyan">
                  <FiBriefcase size={18} />
                </div>
                <div className="placement-stat-info">
                  <span className="placement-stat-number">500+</span>
                  <span className="placement-stat-label">Placement Drives</span>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="placement-stat-item">
                <div className="placement-stat-icon-wrap purple">
                  <FiUsers size={18} />
                </div>
                <div className="placement-stat-info">
                  <span className="placement-stat-number">50+</span>
                  <span className="placement-stat-label">Partner Companies</span>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="placement-stat-item">
                <div className="placement-stat-icon-wrap cyan">
                  <FaGraduationCap size={18} />
                </div>
                <div className="placement-stat-info">
                  <span className="placement-stat-number">10K+</span>
                  <span className="placement-stat-label">Students Placed</span>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="placement-stat-item">
                <div className="placement-stat-icon-wrap purple">
                  <FiTrendingUp size={18} />
                </div>
                <div className="placement-stat-info">
                  <span className="placement-stat-number">95%</span>
                  <span className="placement-stat-label">Placement Support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Decorative Campus Handwritten Callout & Building Signage */}
          <div className="placement-hero-right-overlay">
            <div className="placement-handwritten-annotation">
              <span className="placement-handwritten-text">
                From Campus <br />
                to Career <br />
                with SmartCampus
              </span>
              <svg
                className="placement-handwritten-arrow"
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

            <div className="placement-building-signage-badge">
              <div className="placement-building-brand-name">SMARTCAMPUS</div>
              <div className="placement-building-brand-tagline">
                LEARN • GROW • GET PLACED
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="placement-content">
        <section className="placement-tools-section" aria-label="Placement tools">
          {placementTools.map(({ title, description, icon: Icon, tone }) => (
            <Link
              to="/login"
              className="placement-tool-card"
              data-scroll-reveal
              key={title}
            >
              <span className={`placement-tool-icon ${tone}`}>
                <Icon size={21} aria-hidden="true" />
              </span>
              <span className="placement-tool-copy">
                <strong>{title}</strong>
                <span>{description}</span>
              </span>
            </Link>
          ))}
        </section>

        <section
          className="placement-opportunities-section"
          id="placement-opportunities"
        >
          <div className="placement-opportunities-main">
            <div className="placement-section-heading" data-scroll-reveal>
              <div>
                <span className="placement-section-eyebrow">
                  <span aria-hidden="true">✦</span> LATEST PLACEMENT OPPORTUNITIES
                </span>
                <h2>Explore Top Job Opportunities</h2>
                <p>
                  Discover career opportunities from companies looking for
                  their next great team members.
                </p>
              </div>
              <Link to="/login" className="placement-view-link">
                View All <FiArrowRight size={15} />
              </Link>
            </div>

            <div className="placement-job-grid">
              {opportunities.map((job) => (
                <article className="placement-job-card" data-scroll-reveal key={job.company.name}>
                  <div className="placement-job-company">
                    <CompanyLogo company={job.company} />
                    <span className="placement-job-status">Hiring</span>
                  </div>
                  <h3>{job.role}</h3>
                  <p className="placement-job-company-name">
                    {job.company.name}
                  </p>
                  <div className="placement-job-meta">
                    <span><FiMapPin size={13} /> {job.location}</span>
                    <span><FiBriefcase size={13} /> Full-time</span>
                  </div>
                  <div className="placement-job-tags">
                    {job.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <div className="placement-job-card-bottom">
                    <strong>{job.salary}</strong>
                    <Link to="/login">
                      Apply Now <FiArrowRight size={14} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="placement-statistics-card" data-scroll-reveal>
            <span className="placement-section-eyebrow">
              <span aria-hidden="true">✦</span> PLACEMENT STATISTICS
            </span>
            <h2>Our Placement Success Over the Years</h2>
            <div className="placement-stat-chart">
              {[
                { year: "2022", value: 65 },
                { year: "2023", value: 78 },
                { year: "2024", value: 88 },
                { year: "2025", value: 95 },
              ].map(({ year, value }) => (
                <div className="placement-stat-chart-column" key={year}>
                  <strong>{value}%</strong>
                  <span
                    className="placement-stat-chart-bar"
                    style={{ height: `${value}%` }}
                    aria-label={`${value}% in ${year}`}
                  />
                  <small>{year}</small>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="placement-partners-section">
          <div className="placement-partners-panel" data-scroll-reveal>
            <div className="placement-section-heading">
              <div>
                <span className="placement-section-eyebrow">
                  <span aria-hidden="true">✦</span> TOP RECRUITING COMPANIES
                </span>
                <h2>Our Hiring Partners</h2>
                <p>
                  Leading companies trust SmartCampus to connect them with
                  exceptional talent.
                </p>
              </div>
              <button
                type="button"
                className="placement-view-link placement-view-companies-button"
                aria-expanded={showAllCompanies}
                onClick={() => setShowAllCompanies((isShowing) => !isShowing)}
              >
                {showAllCompanies ? "Show Rotating Partners" : "View All Companies"}
                <FiArrowRight size={15} />
              </button>
            </div>
            {showAllCompanies ? (
              <div className="placement-partner-logos">
                {partnerCompanies.map((company) => (
                  <div className="placement-partner-logo-card" key={company.name}>
                    <CompanyLogo company={company} loading="eager" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="placement-partner-carousel">
                <button
                  type="button"
                  className="placement-partner-carousel-control"
                  aria-label="Show previous company"
                  onClick={() =>
                    setActivePartnerIndex((currentIndex) =>
                      (currentIndex - 1 + partnerCompanies.length) %
                      partnerCompanies.length,
                    )
                  }
                >
                  <FiChevronLeft size={20} />
                </button>
                <div
                  className="placement-partner-feature"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <CompanyLogo
                    key={partnerCompanies[activePartnerIndex].name}
                    company={partnerCompanies[activePartnerIndex]}
                    className="placement-featured-company-logo"
                  />
                  <strong>{partnerCompanies[activePartnerIndex].name}</strong>
                  <span>
                    Company {activePartnerIndex + 1} of {partnerCompanies.length}
                  </span>
                </div>
                <button
                  type="button"
                  className="placement-partner-carousel-control"
                  aria-label="Show next company"
                  onClick={() =>
                    setActivePartnerIndex((currentIndex) =>
                      (currentIndex + 1) % partnerCompanies.length,
                    )
                  }
                >
                  <FiChevronRight size={20} />
                </button>
              </div>
            )}
          </div>

          <aside className="placement-benefits-panel" data-scroll-reveal>
            <div className="placement-benefits-copy">
              <span className="placement-section-eyebrow">
                WHY CHOOSE SMARTCAMPUS FOR PLACEMENTS?
              </span>
              <ul>
                {benefits.map((benefit) => (
                  <li key={benefit}>
                    <span><FiCheckCircle size={14} /></span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            <img
              className="placement-benefits-image"
              src={priyaImg}
              alt="SmartCampus student preparing for her career"
              loading="lazy"
            />
            <span className="placement-benefits-note" aria-hidden="true">
              Your Dream<br />Career Awaits!
            </span>
          </aside>
        </section>

        <section className="placement-stories-drives-section">
          <div className="placement-stories-panel">
            <div className="placement-section-heading" data-scroll-reveal>
              <div>
                <span className="placement-section-eyebrow">
                  <span aria-hidden="true">✦</span> SUCCESS STORIES
                </span>
                <h2>Our Students, Their <span>Success</span></h2>
                <p>Real stories from students building their careers.</p>
              </div>
              <Link to="/login" className="placement-view-link">
                More Stories <FiArrowRight size={15} />
              </Link>
            </div>
            <div className="placement-story-grid">
              {stories.map((story) => (
                <article className="placement-story-card" data-scroll-reveal key={story.name}>
                  <div className="placement-story-author">
                    <img src={story.image} alt="" loading="lazy" />
                    <div>
                      <strong>{story.name}</strong>
                      <span>{story.role}</span>
                    </div>
                  </div>
                  <p>“{story.quote}”</p>
                  <div className="placement-story-rating" aria-label="5 out of 5 stars">
                    {Array.from({ length: 5 }, (_, index) => (
                      <FiStar key={index} size={14} />
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="placement-drives-panel">
            <div className="placement-section-heading">
              <div>
                <span className="placement-section-eyebrow">
                  <span aria-hidden="true">✦</span> UPCOMING PLACEMENT DRIVES
                </span>
                <h2>Don’t Miss These Opportunities</h2>
              </div>
              <Link to="/login" className="placement-view-link">
                View All <FiArrowRight size={15} />
              </Link>
            </div>
            <div className="placement-drive-list">
              {placementDrives.map((drive) => (
                <article className="placement-drive-item" key={drive.company.name}>
                  <div className="placement-drive-company">
                    <CompanyLogo company={drive.company} />
                    <div>
                      <strong>{drive.company.name}</strong>
                      <span><FiCalendar size={12} /> {drive.date}</span>
                      <span><FiMapPin size={12} /> {drive.location}</span>
                    </div>
                  </div>
                  <Link to="/login" aria-label={`Apply for ${drive.company.name} placement drive`}>
                    Apply <FiArrowRight size={14} />
                  </Link>
                </article>
              ))}
            </div>
          </aside>
        </section>

        <section className="placement-cta-section">
          <div
            className="placement-cta-card"
            style={{ backgroundImage: `url(${featuresBgImg})` }}
          >
            <div className="placement-cta-overlay" />
            <div className="placement-cta-content">
              <span className="placement-section-eyebrow">
                <span aria-hidden="true">✦</span> GET PLACED WITH SMARTCAMPUS
              </span>
              <h2>
                Take the Next Step Towards Your <span>Dream Career</span>
              </h2>
              <p>
                Explore opportunities, prepare with AI tools, and connect with
                top recruiters.
              </p>
              <div className="placement-cta-actions">
                <Link to="/login" className="placement-cta-primary">
                  Join Now <FiArrowRight size={17} />
                </Link>
                <Link to="/contact" className="placement-cta-secondary">
                  Contact Placement Cell
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="placement-showcase-footer">
        <div className="placement-footer-container">
          <div className="placement-footer-grid">
            <div className="placement-footer-brand">
              <Link to="/" className="placement-footer-logo">
                <span><FaGraduationCap size={19} /></span>
                <strong>Smart<span>Campus</span></strong>
              </Link>
              <p>Learn • Grow • Get Placed</p>
            </div>
            <div>
              <h3>Quick Links</h3>
              <Link to="/">Home</Link>
              <Link to="/about">About</Link>
              <Link to="/features">Features</Link>
              <Link to="/placement">Placements</Link>
            </div>
            <div>
              <h3>Resources</h3>
              <Link to="/placement-guide">Placement Guide</Link>
              <Link to="/interview-tips">Interview Tips</Link>
            </div>
            <div className="placement-footer-connect">
              <h3>Connect With Us</h3>
              <div className="placement-footer-socials">
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn"><FaLinkedinIn /></a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><FaInstagram /></a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><FaFacebookF /></a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube"><FaYoutube /></a>
              </div>
              <a href="mailto:placement@smartcampus.com">placement@smartcampus.com</a>
              <p><FaMapMarkerAlt size={13} /> Jharsuguda, Odisha, India</p>
            </div>
            <div className="placement-footer-script" aria-label="Learn, connect, grow, get placed">
              Learn<br />Connect<br />Grow<br />Get Placed
              <FiArrowRight size={22} />
            </div>
          </div>
          <div className="placement-footer-bottom">
            <span>© {new Date().getFullYear()} SmartCampus. All rights reserved.</span>
            <span>Empowering Students. Enabling Futures.</span>
          </div>
        </div>
      </footer>

      {/* Interactive Video / Success Stories Modal */}
      {showStoryModal && (
        <div
          className="placement-modal-backdrop"
          onClick={() => setShowStoryModal(false)}
        >
          <div
            className="placement-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="placement-modal-close"
              onClick={() => setShowStoryModal(false)}
              aria-label="Close modal"
            >
              <FiX size={20} />
            </button>
            <h2 style={{ fontSize: "1.6rem", marginBottom: "0.75rem", color: "#ffffff" }}>
              Placement Success Stories
            </h2>
            <p style={{ color: "#94a3b8", lineHeight: 1.6, marginBottom: "2rem" }}>
              Hear from our alumni who secured high-impact roles at Fortune 500 tech companies,
              startups, and global consultancies through SmartCampus.
            </p>
            <Link
              to="/login"
              className="btn-placement-primary"
              style={{ display: "inline-flex", justifyContent: "center" }}
            >
              <span>Login to Access Placement Portal</span>
              <FiArrowRight size={18} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Placement;
