import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiBriefcase,
  FiPlay,
  FiThumbsUp,
  FiUsers,
  FiX,
  FiCalendar,
  FiFileText,
  FiCpu,
  FiBell,
  FiCheck,
} from "react-icons/fi";
import { FaBuilding } from "react-icons/fa";
import "./Home.css";

// Company logos specified by user
import tcsLogo from "../../assets/company1.jpeg"; // images.jpeg
import infosysLogo from "../../assets/company2.png"; // images.png
import wiproLogo from "../../assets/company3.png"; // images 19.png
import accentureLogo from "../../assets/company4.png"; // image2.png
import hclLogo from "../../assets/company5.jpeg"; // images 1.jpeg
import cognizantLogo from "../../assets/company6.png"; // images 5.png

// Campus Life & Testimonial images
import hero3CampusImg from "../../assets/hero3.png";
import hero4StudyImg from "../../assets/hero4.png";
import hero5ConcertImg from "../../assets/hero5.png";
import priyaImg from "../../assets/priya.png";
import rohitImg from "../../assets/rohit.png";
import snehaImg from "../../assets/sneha.png";
import { FiBookOpen, FiAward, FiStar } from "react-icons/fi";

const Home = () => {
  const [showStoryModal, setShowStoryModal] = useState(false);

  return (
    <div className="home-container">
      {/* Hero Section with Cinematic Campus Background */}
      <section className="home-hero-section">
        {/* Multi-stop ambient dark gradient overlay */}
        <div className="home-hero-overlay" />

        <div className="home-hero-inner">
          {/* Left Column: Heading, Subtitle, CTAs, and Key Metrics */}
          <div className="home-hero-left">
            <div className="home-hero-eyebrow">
              <span className="eyebrow-pill">AI-Powered Campus Management Platform</span>
            </div>

            <h1 className="home-hero-headline">
              Your Complete <br />
              Campus <span className="future-highlight">Journey</span> <br />
              in One Platform
            </h1>

            <p className="home-hero-desc">
              Manage academics, attendance, placements and skill development with the power of AI.
              SmartCampus helps students, faculty and administrators build a brighter future together.
            </p>

            <div className="home-hero-buttons">
              <Link to="/login" className="btn-get-started">
                <span>Get Started</span>
                <FiArrowRight size={18} />
              </Link>

              <button
                type="button"
                className="btn-watch-story"
                onClick={() => setShowStoryModal(true)}
              >
                <div className="story-play-icon">
                  <FiPlay size={14} fill="currentColor" />
                </div>
                <span>Watch Video</span>
              </button>
            </div>

            {/* 4 Performance Indicators */}
            <div className="home-hero-stats">
              <div className="home-stat-item">
                <span className="home-stat-number">10K+</span>
                <span className="home-stat-label">Students</span>
              </div>

              <div className="home-stat-item">
                <span className="home-stat-number">500+</span>
                <span className="home-stat-label">Placements</span>
              </div>

              <div className="home-stat-item">
                <span className="home-stat-number">50+</span>
                <span className="home-stat-label">Partner Companies</span>
              </div>

              <div className="home-stat-item">
                <span className="home-stat-number">95%</span>
                <span className="home-stat-label">Satisfaction Rate</span>
              </div>
            </div>
          </div>

          {/* Right Column: Decorative Campus Annotations */}
          <div className="home-hero-right-overlay">
            <div className="handwritten-annotation">
              <span className="handwritten-text">
                A Smarter <br />
                Campus for a <br />
                Brighter Tomorrow
              </span>
              <svg
                className="handwritten-arrow"
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

            <div className="building-signage-badge">
              <div className="building-brand-name">SMARTCAMPUS</div>
              <div className="building-brand-tagline">
                LEARN • GROW • GET PLACED
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          Section Below Hero: Quick Services Bar & Everything You Need Grid
          ==================================================================== */}
      <section className="features-below-hero-section">
        <div className="features-container">
          
          {/* Top Quick Services Row */}
          <div className="quick-services-bar">
            {/* 1. Student Management */}
            <div className="quick-service-pill">
              <div className="service-icon-box purple">
                <FiUsers size={20} />
              </div>
              <div className="service-text">
                <h4>Student Management</h4>
                <p>Manage profiles, records and academic progress</p>
              </div>
            </div>

            {/* 2. Attendance System */}
            <div className="quick-service-pill">
              <div className="service-icon-box teal">
                <FiCalendar size={20} />
              </div>
              <div className="service-text">
                <h4>Attendance System</h4>
                <p>Track attendance easily and accurately</p>
              </div>
            </div>

            {/* 3. Placement Support */}
            <div className="quick-service-pill">
              <div className="service-icon-box amber">
                <FiBriefcase size={20} />
              </div>
              <div className="service-text">
                <h4>Placement Support</h4>
                <p>Get placed with top companies</p>
              </div>
            </div>

            {/* 4. AI Resume Analyzer */}
            <div className="quick-service-pill">
              <div className="service-icon-box blue">
                <FiFileText size={20} />
              </div>
              <div className="service-text">
                <h4>AI Resume Analyzer</h4>
                <p>Improve your resume with AI insights</p>
              </div>
            </div>

            {/* 5. AI Mock Interview */}
            <div className="quick-service-pill">
              <div className="service-icon-box indigo">
                <FiCpu size={20} />
              </div>
              <div className="service-text">
                <h4>AI Mock Interview</h4>
                <p>Practice with AI and build confidence</p>
              </div>
            </div>

            {/* 6. Announcements */}
            <div className="quick-service-pill">
              <div className="service-icon-box red">
                <FiBell size={20} />
              </div>
              <div className="service-text">
                <h4>Announcements</h4>
                <p>Stay updated with important notices</p>
              </div>
            </div>
          </div>

          {/* Main 4-Column Feature Showcase Grid */}
          <div className="main-features-grid">
            
            {/* Column 1: Heading & Description */}
            <div className="feature-intro-card">
              <div className="feature-intro-badge">
                <span className="sparkle-icon">✨</span>
                <span>OUR FEATURES</span>
              </div>
              <h2 className="feature-intro-title">
                Everything You Need for a <span className="title-gradient">Smarter Campus</span>
              </h2>
              <p className="feature-intro-desc">
                SmartCampus combines modern technology with AI to simplify campus management
                and prepare students for real-world success.
              </p>
              <Link to="/features" className="btn-explore-features">
                <span>Explore All Features</span>
                <FiArrowRight size={16} />
              </Link>
            </div>

            {/* Column 2: AI Resume Analyzer Card */}
            <div className="feature-showcase-card">
              <div className="showcase-card-header">
                <div className="card-header-icon purple">
                  <FiFileText size={22} />
                </div>
                <div className="card-header-info">
                  <h3>AI Resume Analyzer</h3>
                  <p>Get instant feedback on your resume and improve your chances of getting hired.</p>
                </div>
              </div>

              {/* Preview UI Mockup */}
              <div className="resume-analyzer-mockup">
                <div className="mockup-doc-icon">
                  <FiFileText size={32} />
                </div>
                <div className="mockup-content">
                  <div className="mockup-row">
                    <span className="mockup-label">AI Resume Analysis</span>
                    <div className="mockup-score-badge">
                      <span>85</span>
                    </div>
                  </div>
                  <div className="mockup-line full" />
                  <div className="mockup-check-row">
                    <span className="check-circle"><FiCheck size={12} /></span>
                    <span className="check-text">Keywords Match</span>
                  </div>
                  <div className="mockup-line half" />
                </div>
              </div>
            </div>

            {/* Column 3: AI Mock Interview Card */}
            <div className="feature-showcase-card">
              <div className="showcase-card-header">
                <div className="card-header-icon blue">
                  <FiCpu size={22} />
                </div>
                <div className="card-header-info">
                  <h3>AI Mock Interview</h3>
                  <p>Experience real interview questions with AI and get personalized feedback.</p>
                </div>
              </div>

              {/* Preview UI Video Mockup */}
              <div className="mock-interview-mockup">
                <div className="interview-video-frame">
                  {/* Avatar / Camera feed representation with real photo */}
                  <div className="interview-avatar-feed">
                    <img
                      src={priyaImg}
                      alt="AI Interviewer"
                      className="interviewer-avatar-img"
                    />
                    <div className="camera-live-badge">
                      <span className="live-dot" />
                      <span>Live AI</span>
                    </div>
                  </div>

                  {/* Question & Audio Wave side */}
                  <div className="interview-questions-feed">
                    <div className="interview-chat-bubble">
                      <div className="bubble-user-tag">
                        <span className="tag-dot" />
                        <span>AI Interviewer</span>
                      </div>
                      <div className="bubble-line full" />
                      <div className="bubble-line short" />
                    </div>
                    <div className="interview-wave-indicator">
                      <span className="wave-bar h1" />
                      <span className="wave-bar h2" />
                      <span className="wave-bar h3" />
                      <span className="wave-bar h2" />
                      <span className="wave-bar h1" />
                      <span className="wave-status">Evaluating</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 4: Placement Opportunities Card with Partner Companies */}
            <div className="feature-showcase-card">
              <div className="showcase-card-header">
                <div className="card-header-icon amber">
                  <FiBriefcase size={22} />
                </div>
                <div className="card-header-info">
                  <h3>Placement Opportunities</h3>
                  <p>Connect with top companies and find the right opportunities for your career.</p>
                </div>
              </div>

              {/* 6 Partner Company Logos Grid */}
              <div className="company-logos-grid">
                <div className="company-logo-tile" title="Tata Consultancy Services">
                  <img src={tcsLogo} alt="TCS" className="company-logo-img" />
                </div>
                <div className="company-logo-tile" title="Infosys">
                  <img src={infosysLogo} alt="Infosys" className="company-logo-img" />
                </div>
                <div className="company-logo-tile" title="Wipro">
                  <img src={wiproLogo} alt="Wipro" className="company-logo-img" />
                </div>
                <div className="company-logo-tile" title="Accenture">
                  <img src={accentureLogo} alt="Accenture" className="company-logo-img" />
                </div>
                <div className="company-logo-tile" title="HCL Technologies">
                  <img src={hclLogo} alt="HCL" className="company-logo-img" />
                </div>
                <div className="company-logo-tile" title="Cognizant">
                  <img src={cognizantLogo} alt="Cognizant" className="company-logo-img" />
                </div>
              </div>

              <div className="view-companies-link-wrap">
                <Link to="/placement" className="view-companies-link">
                  <span>View All Companies</span>
                  <FiArrowRight size={14} />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ====================================================================
          Campus Life Banner Section (Using hero3, hero4, hero5)
          ==================================================================== */}
      <section className="campus-life-showcase-section">
        <div className="campus-life-container">
          <div className="campus-life-banner-card">
            
            {/* Left side: Campus Building / Lawn panoramic view (hero3.png) */}
            <div className="campus-life-hero-img-wrap">
              <img
                src={hero3CampusImg}
                alt="SmartCampus Lawn and Academic Block"
                className="campus-life-hero-img"
              />
              <div className="campus-life-hero-gradient" />
            </div>

            {/* Middle: Content & Quick Feature Badges */}
            <div className="campus-life-center-content">
              <div className="campus-life-tag">
                <span className="campus-life-tag-icon">🎓</span>
                <span>CAMPUS LIFE</span>
              </div>
              <h2 className="campus-life-title">
                More Than Just <span className="campus-life-highlight">Academics</span>
              </h2>
              <p className="campus-life-desc">
                Be a part of a vibrant college community with events, clubs, workshops and placement drives.
              </p>

              {/* 4 Category Pills */}
              <div className="campus-life-pills-row">
                <div className="campus-life-pill">
                  <div className="pill-icon-box blue">
                    <FiCalendar size={18} />
                  </div>
                  <span className="pill-label">Events</span>
                </div>

                <div className="campus-life-pill">
                  <div className="pill-icon-box purple">
                    <FiUsers size={18} />
                  </div>
                  <span className="pill-label">Clubs</span>
                </div>

                <div className="campus-life-pill">
                  <div className="pill-icon-box cyan">
                    <FiBookOpen size={18} />
                  </div>
                  <span className="pill-label">Workshops</span>
                </div>

                <div className="campus-life-pill">
                  <div className="pill-icon-box indigo">
                    <FiAward size={18} />
                  </div>
                  <span className="pill-label">Placement Drives</span>
                </div>
              </div>
            </div>

            {/* Right side: Angled Floating Polaroids (hero4.png & hero5.png) */}
            <div className="campus-life-polaroids-col">
              
              {/* Handwritten Note Annotation */}
              <div className="campus-life-handwritten">
                <span className="campus-handwritten-text">
                  Learn <br />
                  Connect <br />
                  Grow
                </span>
                <svg
                  className="campus-handwritten-swoosh"
                  viewBox="0 0 50 35"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 25 C 20 5, 38 12, 45 28"
                    stroke="#4338ca"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Top Polaroid: Students Collaborating on Laptop (hero4.png) */}
              <div className="campus-polaroid top-polaroid">
                <img
                  src={hero4StudyImg}
                  alt="Students Collaborating"
                  className="campus-polaroid-img"
                />
              </div>

              {/* Bottom Polaroid: Live Campus Concert & Tech Fest (hero5.png) */}
              <div className="campus-polaroid bottom-polaroid">
                <img
                  src={hero5ConcertImg}
                  alt="Campus Cultural & Tech Fest"
                  className="campus-polaroid-img"
                />
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ====================================================================
          Testimonials Section ("What Our Students Say")
          ==================================================================== */}
      <section className="testimonials-showcase-section">
        <div className="testimonials-container">
          
          <div className="testimonials-header">
            <div className="testimonials-tag">
              <span className="testimonials-tag-icon">💬</span>
              <span>TESTIMONIALS</span>
            </div>
            <h2 className="testimonials-title">What Our Students Say</h2>
          </div>

          <div className="testimonials-cards-grid">
            
            {/* Card 1: Priya Sharma */}
            <div className="testimonial-card">
              <div className="testimonial-card-author">
                <div className="author-avatar-wrap">
                  <img src={priyaImg} alt="Priya Sharma" className="author-avatar-img" />
                </div>
                <div className="author-details">
                  <h4 className="author-name">Priya Sharma</h4>
                  <span className="author-role">Final Year Student</span>
                </div>
              </div>
              <p className="testimonial-quote">
                "SmartCampus helped me prepare for placements with AI mock interviews. It really boosted my confidence!"
              </p>
              <div className="testimonial-rating">
                {[...Array(5)].map((_, i) => (
                  <FiStar key={i} className="star-filled" size={15} />
                ))}
              </div>
            </div>

            {/* Card 2: Rohit Verma */}
            <div className="testimonial-card">
              <div className="testimonial-card-author">
                <div className="author-avatar-wrap">
                  <img src={rohitImg} alt="Rohit Verma" className="author-avatar-img" />
                </div>
                <div className="author-details">
                  <h4 className="author-name">Rohit Verma</h4>
                  <span className="author-role">Placed at TCS</span>
                </div>
              </div>
              <p className="testimonial-quote">
                "The resume analyzer and placement support made the process so much easier. Highly recommended!"
              </p>
              <div className="testimonial-rating">
                {[...Array(5)].map((_, i) => (
                  <FiStar key={i} className="star-filled" size={15} />
                ))}
              </div>
            </div>

            {/* Card 3: Sneha Patel */}
            <div className="testimonial-card">
              <div className="testimonial-card-author">
                <div className="author-avatar-wrap">
                  <img src={snehaImg} alt="Sneha Patel" className="author-avatar-img" />
                </div>
                <div className="author-details">
                  <h4 className="author-name">Sneha Patel</h4>
                  <span className="author-role">Computer Science Student</span>
                </div>
              </div>
              <p className="testimonial-quote">
                "A single platform for everything — academics, attendance, and placements. SmartCampus is amazing!"
              </p>
              <div className="testimonial-rating">
                {[...Array(5)].map((_, i) => (
                  <FiStar key={i} className="star-filled" size={15} />
                ))}
              </div>
            </div>

            {/* Side Callout Quote Card: Real Students, Real Success */}
            <div className="testimonial-quote-callout">
              <div className="callout-quote-icon">“</div>
              <div className="callout-quote-text">
                <span className="callout-line1">Real Students</span>
                <span className="callout-line2">Real Success</span>
              </div>
              <svg
                className="callout-arrow-curve"
                viewBox="0 0 60 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 10 C 35 15, 45 28, 48 35 M 48 35 L 38 32 M 48 35 L 47 24"
                  stroke="#6366f1"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

          </div>

        </div>
      </section>

      {/* ====================================================================
          Immediate Post-Testimonial CTA Banner Section (NO Sign Up Button)
          ==================================================================== */}
      <section className="home-cta-banner-section">
        <div className="home-cta-container">
          <div className="home-cta-banner-card">
            <div className="home-cta-left">
              <h2 className="home-cta-title">
                Ready to Start Your <span className="home-cta-gradient">Smart Campus Journey?</span>
              </h2>
              <p className="home-cta-subtext">
                Join thousands of students who are building their future with SmartCampus.
              </p>
            </div>

            <div className="home-cta-actions">
              {/* Only Login Button — NO Sign Up button as strictly requested */}
              <Link to="/login" className="btn-cta-login">
                <span>Login</span>
                <FiArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Story Modal */}
      {showStoryModal && (
        <div
          className="story-modal-backdrop"
          onClick={() => setShowStoryModal(false)}
        >
          <div
            className="story-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="story-modal-close"
              onClick={() => setShowStoryModal(false)}
            >
              <FiX size={20} />
            </button>
            <h2 style={{ fontSize: "1.6rem", marginBottom: "0.75rem" }}>
              Welcome to SmartCampus
            </h2>
            <p style={{ color: "#94a3b8", lineHeight: 1.6, marginBottom: "2rem" }}>
              SmartCampus connects your academic achievements with placement opportunities,
              AI mock interview coaching, and automated resume analysis.
            </p>
            <Link
              to="/login"
              className="btn-get-started"
              style={{ display: "inline-flex", justifyContent: "center" }}
            >
              <span>Explore The Platform</span>
              <FiArrowRight size={18} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;

