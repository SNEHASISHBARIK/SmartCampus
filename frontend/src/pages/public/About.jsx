import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiBriefcase,
  FiPlay,
  FiThumbsUp,
  FiUsers,
  FiX,
  FiAward,
  FiTarget,
  FiEye,
  FiTrendingUp,
} from "react-icons/fi";

import {
  FaBuilding,
  FaRocket,
  FaGem,
  FaCalendarAlt,
  FaFileAlt,
  FaRobot,
  FaGraduationCap,
  FaLinkedinIn,
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaMapMarkerAlt,
  FaEnvelope,
} from "react-icons/fa";
import about1stheroImg from "../../assets/about1sthero.png";
import ourImpactImg from "../../assets/Our_Impact.png";
import ourJourneyImg from "../../assets/our_journey.png";
import "./About.css";

const About = () => {
  const [showStoryModal, setShowStoryModal] = useState(false);

  return (
    <div className="about-page-container">
      {/* ====================================================================
          Hero Section with Campus Background (assets/home-hero.png)
          ==================================================================== */}
      <section className="about-hero-section">
        {/* Atmospheric dark gradient overlay */}
        <div className="about-hero-overlay" />

        <div className="about-hero-inner">
          {/* Left Column: Heading, Subtitle, CTAs, and Stats */}
          <div className="about-hero-left">
            <div className="about-hero-eyebrow">
              ABOUT SMARTCAMPUS
            </div>

            <h1 className="about-hero-headline">
              Building a Smarter <br />
              Future for <span className="about-highlight">Every Student</span>
            </h1>

            <p className="about-hero-desc">
              SmartCampus is an all-in-one campus management and placement enablement
              platform that empowers students, faculty, and administrators with modern
              technology and AI-driven insights.
            </p>

            <div className="about-hero-buttons">
              <button
                type="button"
                className="btn-about-mission"
                onClick={() => setShowStoryModal(true)}
              >
                <span>Our Mission</span>
                <FiArrowRight size={18} />
              </button>

              <button
                type="button"
                className="btn-watch-story"
                onClick={() => setShowStoryModal(true)}
              >
                <div className="story-play-icon">
                  <FiPlay size={14} fill="currentColor" />
                </div>
                <span>Watch Our Story</span>
              </button>
            </div>

            {/* 4 Performance Indicators */}
            <div className="about-hero-stats">
              <div className="about-stat-item">
                <div className="about-stat-icon-wrap purple">
                  <FiUsers size={18} />
                </div>
                <div className="about-stat-info">
                  <span className="about-stat-number">10K+</span>
                  <span className="about-stat-label">Students</span>
                </div>
              </div>

              <div className="about-stat-item">
                <div className="about-stat-icon-wrap purple">
                  <FiAward size={18} />
                </div>
                <div className="about-stat-info">
                  <span className="about-stat-number">500+</span>
                  <span className="about-stat-label">Placements</span>
                </div>
              </div>

              <div className="about-stat-item">
                <div className="about-stat-icon-wrap indigo">
                  <FaBuilding size={16} />
                </div>
                <div className="about-stat-info">
                  <span className="about-stat-number">50+</span>
                  <span className="about-stat-label">Partner Companies</span>
                </div>
              </div>

              <div className="about-stat-item">
                <div className="about-stat-icon-wrap purple">
                  <FiThumbsUp size={16} />
                </div>
                <div className="about-stat-info">
                  <span className="about-stat-number">95%</span>
                  <span className="about-stat-label">Student Satisfaction</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Decorative Campus Overlays */}
          <div className="about-hero-right-overlay">
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
          Who We Are & Purpose Section (Using assets/about1sthero.png)
          ==================================================================== */}
      <section className="about-story-section">
        <div className="about-story-container">
          
          {/* Row 1: Who We Are Card (2fr) + Our Purpose Card (1fr) */}
          <div className="about-story-top-row">
            
            {/* Who We Are Card */}
            <div className="about-who-card">
              <div className="about-who-content">
                <div className="about-story-tag">
                  <span>✨</span>
                  <span>OUR STORY</span>
                </div>
                <h2 className="about-who-title">
                  Who <span className="who-gradient">We Are</span>
                </h2>
                <p className="about-who-desc">
                  SmartCampus is a modern college management platform designed to simplify academic operations,
                  enhance campus engagement, and prepare students for real-world success. We combine the power of
                  technology and AI to create a connected and productive campus ecosystem for everyone.
                </p>
                <Link to="/features" className="btn-who-learn">
                  <span>Learn More</span>
                  <FiArrowRight size={16} />
                </Link>
              </div>

              {/* Photo Frame with about1sthero.png */}
              <div className="about-who-image-wrap">
                <img
                  src={about1stheroImg}
                  alt="Students Collaborating on Campus"
                  className="about-who-img"
                />
              </div>
            </div>

            {/* Our Purpose Card */}
            <div className="about-purpose-card">
              <div>
                <div className="about-purpose-header">
                  <div className="purpose-icon-box">
                    <FiTarget size={22} />
                  </div>
                  <h3 className="purpose-title">Our Purpose</h3>
                </div>
                <p className="purpose-desc">
                  To empower educational institutions and students with smart, accessible, and
                  AI-powered solutions for a brighter future.
                </p>
              </div>

              <div className="purpose-quote-box">
                <span className="purpose-quote-mark">“</span>
                <p className="purpose-quote-text">
                  <strong>Technology</strong> is not just about systems, it's about people,{" "}
                  <strong>possibilities, and progress.</strong> ”
                </p>
              </div>
            </div>

          </div>

          {/* Row 2: 3 Core Pillars (Mission, Vision, Values) */}
          <div className="about-tri-cards-grid">
            
            {/* Card 1: Our Mission */}
            <div className="about-tri-card mission-card">
              <div className="tri-icon-box blue">
                <FaRocket size={22} />
              </div>
              <div className="tri-card-info">
                <h3 className="tri-card-title">Our Mission</h3>
                <p className="tri-card-text">
                  To simplify campus management and provide intelligent tools that help students,
                  faculty, and administrators achieve more.
                </p>
              </div>
            </div>

            {/* Card 2: Our Vision */}
            <div className="about-tri-card vision-card">
              <div className="tri-icon-box purple">
                <FiEye size={24} />
              </div>
              <div className="tri-card-info">
                <h3 className="tri-card-title">Our Vision</h3>
                <p className="tri-card-text">
                  To become the most trusted and innovative platform for campus management and
                  student success across India and beyond.
                </p>
              </div>
            </div>

            {/* Card 3: Our Values */}
            <div className="about-tri-card values-card">
              <div className="tri-icon-box teal">
                <FaGem size={22} />
              </div>
              <div className="tri-card-info">
                <h3 className="tri-card-title">Our Values</h3>
                <p className="tri-card-text">
                  Innovation, Inclusivity, Integrity, Student Success, and Continuous Improvement
                  drive everything we do.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ====================================================================
          Our Impact Banner Section (Rectangular Card using Our_Impact.png)
          ==================================================================== */}
      <section className="about-impact-section">
        <div className="about-impact-container">
          <div className="about-impact-banner-card">
            {/* Background image & gradient overlay */}
            <div
              className="about-impact-bg"
              style={{ backgroundImage: `url(${ourImpactImg})` }}
            />
            <div className="about-impact-overlay" />

            {/* Banner Inner Content */}
            <div className="about-impact-content-wrap">
              {/* Left Column: Heading, Subtext & CTA */}
              <div className="about-impact-left">
                <div className="about-impact-tag">
                  <span className="impact-tag-dot">✦</span>
                  <span>OUR IMPACT</span>
                </div>

                <h2 className="about-impact-title">
                  Transforming Campus <br />
                  <span className="impact-title-highlight">Life with Technology</span>
                </h2>

                <p className="about-impact-desc">
                  From academics and attendance to placements and skill development,
                  SmartCampus is helping thousands of students and institutions build a smarter tomorrow.
                </p>

                <Link to="/features" className="btn-impact-achievements">
                  <span>See Our Achievements</span>
                  <FiArrowRight size={16} />
                </Link>
              </div>

              {/* Right Column: 4 Frosted Glass Metric Cards */}
              <div className="about-impact-metrics-grid">
                {/* Metric 1 */}
                <div className="impact-metric-glass-card">
                  <div className="impact-metric-icon-wrap blue">
                    <FiUsers size={24} />
                  </div>
                  <div className="impact-metric-number">10K+</div>
                  <div className="impact-metric-label">
                    Students <br /> Empowered
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="impact-metric-glass-card">
                  <div className="impact-metric-icon-wrap cyan">
                    <FiBriefcase size={24} />
                  </div>
                  <div className="impact-metric-number">500+</div>
                  <div className="impact-metric-label">
                    Successful <br /> Placements
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="impact-metric-glass-card">
                  <div className="impact-metric-icon-wrap sky">
                    <FaBuilding size={22} />
                  </div>
                  <div className="impact-metric-number">50+</div>
                  <div className="impact-metric-label">
                    Partner <br /> Companies
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="impact-metric-glass-card">
                  <div className="impact-metric-icon-wrap purple">
                    <FiTrendingUp size={24} />
                  </div>
                  <div className="impact-metric-number">95%</div>
                  <div className="impact-metric-label">
                    Student <br /> Satisfaction
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          What We Do / Our Platform Section
          ==================================================================== */}
      <section className="about-what-we-do-section">
        <div className="about-what-we-do-container">
          {/* Left Column: Heading, Eyebrow badge, Description */}
          <div className="what-we-do-left">
            <div className="what-we-do-tag">
              <span className="what-we-do-tag-icon">⚡</span>
              <span>OUR PLATFORM</span>
            </div>

            <h2 className="what-we-do-title">
              What <span className="what-we-do-title-highlight">We Do</span>
            </h2>

            <p className="what-we-do-desc">
              SmartCampus brings together academic management, campus engagement,
              and placement preparation in one powerful platform.
            </p>
          </div>

          {/* Right Column: 2x3 Feature Items Grid */}
          <div className="what-we-do-grid">
            {/* Item 1 */}
            <div className="what-we-do-item">
              <div className="what-we-do-icon-wrap purple">
                <FiUsers size={22} />
              </div>
              <div className="what-we-do-item-content">
                <h4 className="what-we-do-item-title">Student Management</h4>
                <p className="what-we-do-item-desc">
                  Manage profiles, records and academic progress
                </p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="what-we-do-item">
              <div className="what-we-do-icon-wrap teal">
                <FaCalendarAlt size={20} />
              </div>
              <div className="what-we-do-item-content">
                <h4 className="what-we-do-item-title">Attendance System</h4>
                <p className="what-we-do-item-desc">
                  Track attendance easily and accurately
                </p>
              </div>
            </div>

            {/* Item 3 */}
            <div className="what-we-do-item">
              <div className="what-we-do-icon-wrap amber">
                <FiBriefcase size={22} />
              </div>
              <div className="what-we-do-item-content">
                <h4 className="what-we-do-item-title">Placement Support</h4>
                <p className="what-we-do-item-desc">
                  Get placed with top companies
                </p>
              </div>
            </div>

            {/* Item 4 */}
            <div className="what-we-do-item">
              <div className="what-we-do-icon-wrap violet">
                <FaFileAlt size={20} />
              </div>
              <div className="what-we-do-item-content">
                <h4 className="what-we-do-item-title">AI Resume Analyzer</h4>
                <p className="what-we-do-item-desc">
                  Get instant feedback with AI insights
                </p>
              </div>
            </div>

            {/* Item 5 */}
            <div className="what-we-do-item">
              <div className="what-we-do-icon-wrap sky">
                <FaRobot size={22} />
              </div>
              <div className="what-we-do-item-content">
                <h4 className="what-we-do-item-title">AI Mock Interview</h4>
                <p className="what-we-do-item-desc">
                  Practice with AI and build confidence
                </p>
              </div>
            </div>

            {/* Item 6 */}
            <div className="what-we-do-item">
              <div className="what-we-do-icon-wrap magenta">
                <FiUsers size={22} />
              </div>
              <div className="what-we-do-item-content">
                <h4 className="what-we-do-item-title">Campus Engagement</h4>
                <p className="what-we-do-item-desc">
                  Events, clubs, workshops and more
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          Our Journey / Milestones & Growth Section
          ==================================================================== */}
      <section className="about-journey-section">
        <div className="about-journey-container">
          <div className="about-journey-banner-card">
            {/* Left side: Campus imagery */}
            <div className="about-journey-visual-wrap">
              <img
                src={ourJourneyImg}
                alt="SmartCampus Campus View"
                className="about-journey-img"
              />
              <div className="about-journey-img-fade" />
            </div>

            {/* Right side: Header & Timeline */}
            <div className="about-journey-content">
              {/* Header */}
              <div className="about-journey-header">
                <div className="about-journey-tag">
                  <span className="about-journey-tag-icon">⚡</span>
                  <span>OUR JOURNEY</span>
                </div>
                <h2 className="about-journey-title">
                  Milestones & <span className="about-journey-title-highlight">Growth</span>
                </h2>
              </div>

              {/* Horizontal Timeline Track */}
              <div className="about-journey-timeline">
                <div className="journey-track-line" />

                <div className="journey-milestones-row">
                  {/* Milestone 1: 2023 */}
                  <div className="journey-milestone-node">
                    <div className="journey-node-dot" />
                    <div className="journey-milestone-icon">
                      <FaRocket size={24} />
                    </div>
                    <div className="journey-milestone-year">2023</div>
                    <div className="journey-milestone-desc">
                      Project <br /> Initiated
                    </div>
                  </div>

                  {/* Milestone 2: 2024 */}
                  <div className="journey-milestone-node">
                    <div className="journey-node-dot" />
                    <div className="journey-milestone-icon">
                      <FiUsers size={24} />
                    </div>
                    <div className="journey-milestone-year">2024</div>
                    <div className="journey-milestone-desc">
                      Launched <br /> Core Platform
                    </div>
                  </div>

                  {/* Milestone 3: 2025 */}
                  <div className="journey-milestone-node">
                    <div className="journey-node-dot" />
                    <div className="journey-milestone-icon">
                      <FiTrendingUp size={24} />
                    </div>
                    <div className="journey-milestone-year">2025</div>
                    <div className="journey-milestone-desc">
                      Added AI Features <br /> & Placement Support
                    </div>
                  </div>

                  {/* Milestone 4: 2026 */}
                  <div className="journey-milestone-node">
                    <div className="journey-node-dot" />
                    <div className="journey-milestone-icon">
                      <FaBuilding size={24} />
                    </div>
                    <div className="journey-milestone-year">2026</div>
                    <div className="journey-milestone-desc">
                      Growing <br /> Bigger Together
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          Section 1: Let's Build a Smarter Campus Together (CTA Banner)
          ==================================================================== */}
      <section className="about-join-cta-section">
        <div className="about-join-cta-container">
          <div className="about-join-cta-card">
            {/* Background image: Our_Impact.png with dark night/gradient tint */}
            <div
              className="about-join-cta-bg"
              style={{ backgroundImage: `url(${ourImpactImg})` }}
            />
            <div className="about-join-cta-overlay" />

            {/* Content Wrap */}
            <div className="about-join-cta-content">
              {/* Left Column: Eyebrow, Title & Subtitle */}
              <div className="about-join-cta-left">
                <div className="about-join-cta-badge">
                  <span className="cta-badge-icon">⚡</span>
                  <span>BE A PART OF OUR JOURNEY</span>
                </div>
                <h2 className="about-join-cta-title">
                  Let's Build a <span className="cta-title-gradient">Smarter Campus</span> Together
                </h2>
                <p className="about-join-cta-desc">
                  Join thousands of students, faculty, and institutions who are already
                  experiencing the power of SmartCampus.
                </p>
              </div>

              {/* Right Column: CTA Buttons */}
              <div className="about-join-cta-actions">
                <Link to="/login" className="btn-join-primary">
                  <span>Get Started</span>
                  <FiArrowRight size={16} />
                </Link>
                <Link to="/contact" className="btn-join-secondary">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          Section 2: Clean SmartCampus Showcase Footer
          ==================================================================== */}
      <footer className="about-showcase-footer">
        <div className="about-footer-container">
          <div className="about-footer-grid">
            {/* Column 1: Brand Info */}
            <div className="about-footer-col about-footer-brand-col">
              <Link to="/" className="about-footer-logo-link">
                <div className="about-footer-logo-icon">
                  <FaGraduationCap size={20} />
                </div>
                <div className="about-footer-logo-text">
                  <span className="brand-bold">Smart</span>
                  <span className="brand-accent">Campus</span>
                </div>
              </Link>
              <div className="about-footer-tagline">
                Learn • Grow • Get Placed
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="about-footer-col">
              <h4 className="about-footer-col-title">Quick Links</h4>
              <ul className="about-footer-link-list">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/features">Features</Link></li>
                <li><Link to="/placement">Placements</Link></li>
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div className="about-footer-col">
              <h4 className="about-footer-col-title">Resources</h4>
              <ul className="about-footer-link-list">
                <li><Link to="/blog">Blog</Link></li>
                <li><Link to="/help">Help Center</Link></li>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms &amp; Conditions</Link></li>
              </ul>
            </div>

            {/* Column 4: Connect With Us */}
            <div className="about-footer-col about-footer-connect-col">
              <h4 className="about-footer-col-title">Connect With Us</h4>
              <div className="about-footer-socials">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="about-footer-social-link"
                  aria-label="LinkedIn"
                >
                  <FaLinkedinIn size={16} />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="about-footer-social-link"
                  aria-label="Instagram"
                >
                  <FaInstagram size={16} />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="about-footer-social-link"
                  aria-label="Facebook"
                >
                  <FaFacebookF size={15} />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="about-footer-social-link"
                  aria-label="YouTube"
                >
                  <FaYoutube size={17} />
                </a>
              </div>
              <div className="about-footer-contact-info">
                <div className="about-footer-contact-item">
                  <span className="contact-mail-text">contact@smartcampus.com</span>
                </div>
                <div className="about-footer-contact-item">
                  <FaMapMarkerAlt size={14} className="contact-pin-icon" />
                  <span>Jharsuguda, Odisha, India</span>
                </div>
              </div>
            </div>

            {/* Column 5: Handcrafted Handwritten Script Banner */}
            <div className="about-footer-col about-footer-script-col">
              <div className="about-footer-script-wrap">
                <div className="about-footer-handwritten-text">
                  <span>Learn</span>
                  <span>Connect</span>
                  <span>Grow</span>
                  <span>Get Placed</span>
                </div>
                {/* Decorative curved arrow svg matching reference mockup */}
                <svg
                  className="about-footer-curved-arrow"
                  width="70"
                  height="34"
                  viewBox="0 0 70 34"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M62 4C58 14 42 28 8 28"
                    stroke="#a855f7"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="none"
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

          {/* Bottom Copyright & Subtext Bar */}
          <div className="about-footer-bottom-bar">
            <div className="about-footer-copyright">
              © 2026 SmartCampus. All rights reserved.
            </div>
            <div className="about-footer-bottom-tagline">
              Empowering Students. Enabling Futures.
            </div>
          </div>
        </div>
      </footer>

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
              Our Story & Vision
            </h2>
            <p style={{ color: "#94a3b8", lineHeight: 1.6, marginBottom: "2rem" }}>
              SmartCampus was built to solve the challenges students and universities face
              navigating modern academic life and competitive placements. We bring AI tools,
              verified credentials, and corporate partners into one cohesive experience.
            </p>
            <Link
              to="/login"
              className="btn-about-mission"
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

export default About;
