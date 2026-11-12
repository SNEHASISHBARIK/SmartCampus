import { useRef, useState } from "react";
import {
  FiArrowRight,
  FiBriefcase,
  FiCheck,
  FiChevronDown,
  FiClock,
  FiHeadphones,
  FiHelpCircle,
  FiHome,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiPhone,
  FiSend,
  FiShield,
  FiUser,
  FiUsers,
  FiZap,
  FiX,
} from "react-icons/fi";
import homeHeroImg from "../../assets/home-hero.png";
import useScrollReveal from "../../hooks/useScrollReveal";
import "./Contact.css";

const Contact = () => {
  const pageRef = useRef(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeFaq, setActiveFaq] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [inlineFormData, setInlineFormData] = useState({
    name: "",
    email: "",
    subject: "",
    role: "Student",
    message: "",
  });
  const [inlineSubmitted, setInlineSubmitted] = useState(false);
  useScrollReveal(pageRef);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setShowContactModal(false);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 2000);
  };

  const handleInlineSubmit = (e) => {
    e.preventDefault();
    setInlineSubmitted(true);
    setInlineFormData({
      name: "",
      email: "",
      subject: "",
      role: "Student",
      message: "",
    });
  };

  const supportOptions = [
    { title: "Student Support", description: "Get help with academics, placements, and more.", icon: FiUsers, tone: "blue" },
    { title: "Faculty Support", description: "Support for faculty tools and resources.", icon: FiUser, tone: "purple" },
    { title: "Recruitment Support", description: "For companies and hiring partners.", icon: FiBriefcase, tone: "orange" },
    { title: "Technical Support", description: "Facing an issue? We're here to help.", icon: FiHeadphones, tone: "teal" },
    { title: "Collaboration & Partnership", description: "Let's work together for a smarter campus.", icon: FiMessageCircle, tone: "pink" },
  ];

  const contactFaqs = [
    {
      question: "How can I register as a student on SmartCampus?",
      answer: 'Choose “Get Started”, select “Student”, and follow the registration steps provided for your institution.',
    },
    {
      question: "How can companies post job opportunities?",
      answer: "Contact our recruitment team to get your organization verified and share opportunities with students.",
    },
    {
      question: "Is SmartCampus free for students?",
      answer: "Students can use the SmartCampus features enabled by their institution. Contact your college for plan details.",
    },
    {
      question: "How can I contact the placement cell?",
      answer: "Reach out to your institution's placement coordinator or use the contact details provided by your college.",
    },
    {
      question: "Can I suggest a new feature for SmartCampus?",
      answer: "Yes. Send us a message using the form above and select a suggestion-related subject.",
    },
  ];

  return (
    <div className="contact-page-container" ref={pageRef}>
      {/* ====================================================================
          Contact Hero Section with Campus Background (assets/home-hero.png)
          ==================================================================== */}
      <section
        className="contact-hero-section"
        style={{ backgroundImage: `url(${homeHeroImg})` }}
      >
        {/* Atmospheric dark gradient overlay */}
        <div className="contact-hero-overlay" />

        <div className="contact-hero-inner">
          {/* Left Column: Eyebrow, Heading, Description, and Action Buttons */}
          <div className="contact-hero-left">
            <div className="contact-hero-eyebrow">CONTACT US</div>

            <h1 className="contact-hero-headline">
              Get in Touch with <br />
              <span className="contact-highlight">SmartCampus</span>
            </h1>

            <p className="contact-hero-desc">
              We're here to help! Whether you're a student, faculty member, recruiter,
              or partner, feel free to reach out. Let's build a smarter, brighter
              future together.
            </p>

            <div className="contact-hero-buttons">
              <button
                type="button"
                className="btn-contact-primary"
                onClick={() => setShowContactModal(true)}
              >
                <span>Send a Message</span>
                <FiArrowRight size={18} />
              </button>

              <a href="tel:+91 6372715615" className="btn-contact-secondary">
                <FiPhone size={16} />
                <span>Call Us Now</span>
              </a>
            </div>
          </div>

          {/* Right Column: Decorative Campus Handwritten Callout & Building Signage */}
          <div className="contact-hero-right-overlay">
            <div className="contact-handwritten-annotation">
              <span className="contact-handwritten-text">
                Let's Connect <br />
                For a Smarter <br />
                Campus Tomorrow
              </span>
              <svg
                className="contact-handwritten-arrow"
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

            <div className="contact-building-signage-badge">
              <div className="contact-building-brand-name">SMARTCAMPUS</div>
              <div className="contact-building-brand-tagline">
                LEARN • GROW • GET PLACED
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-details-strip" aria-label="Contact details">
        <a className="contact-detail-card" data-scroll-reveal href="tel:+91 6372715615">
          <span className="contact-detail-icon phone"><FiPhone /></span>
          <span><strong>Call Us</strong><b>+91 6372715615</b><small>Mon - Sat, 9:00 AM - 6:00 PM</small></span>
        </a>
        <a className="contact-detail-card" data-scroll-reveal href="mailto:contact@smartcampus.com">
          <span className="contact-detail-icon mail"><FiMail /></span>
          <span><strong>Email Us</strong><b>contact@smartcampus.com</b><small>We reply within 24 hours</small></span>
        </a>
        <a className="contact-detail-card" data-scroll-reveal href="https://maps.google.com/?q=Gandhi+Engineering+College+Jharsuguda+Odisha" target="_blank" rel="noreferrer">
          <span className="contact-detail-icon location"><FiMapPin /></span>
          <span><strong>Visit Us</strong><b>Jharsuguda, Odisha, India</b><small>PIN - 768201</small></span>
        </a>
        <button className="contact-detail-card" data-scroll-reveal type="button" onClick={() => document.getElementById("contact-message-form")?.scrollIntoView({ behavior: "smooth" })}>
          <span className="contact-detail-icon chat"><FiMessageCircle /></span>
          <span><strong>Live Chat</strong><b>Chat with our support team</b><small>Available now</small></span>
        </button>
      </section>

      <section className="contact-main-grid">
        <div className="contact-form-panel" data-scroll-reveal id="contact-message-form">
          <span className="contact-section-kicker"><FiSend /> Send Us a Message</span>
          <h2>We’d Love to <span>Hear from You</span></h2>
          <p>Have a question, suggestion, or collaboration idea? Fill out the form below and our team will get back to you soon.</p>
          {inlineSubmitted ? (
            <div className="contact-form-success" role="status">
              <FiCheck />
              <div><strong>Thanks for reaching out!</strong><span>Your message has been received. Our team will get back to you shortly.</span></div>
              <button type="button" onClick={() => setInlineSubmitted(false)}>Send another message</button>
            </div>
          ) : (
            <form className="contact-inline-form" onSubmit={handleInlineSubmit}>
              <label>
                Your Name *
                <input required value={inlineFormData.name} placeholder="Enter your full name" onChange={(e) => setInlineFormData({ ...inlineFormData, name: e.target.value })} />
              </label>
              <label>
                Your Email *
                <input required type="email" value={inlineFormData.email} placeholder="Enter your email address" onChange={(e) => setInlineFormData({ ...inlineFormData, email: e.target.value })} />
              </label>
              <label>
                Subject *
                <select required value={inlineFormData.subject} onChange={(e) => setInlineFormData({ ...inlineFormData, subject: e.target.value })}>
                  <option value="" disabled>Select a subject</option>
                  <option>General inquiry</option>
                  <option>Technical support</option>
                  <option>Placement opportunity</option>
                  <option>Partnership</option>
                  <option>Feature suggestion</option>
                </select>
              </label>
              <label>
                Role
                <select value={inlineFormData.role} onChange={(e) => setInlineFormData({ ...inlineFormData, role: e.target.value })}>
                  <option>Student</option>
                  <option>Faculty</option>
                  <option>Recruiter</option>
                  <option>Institution</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="contact-form-message">
                Message *
                <textarea required rows="4" value={inlineFormData.message} placeholder="Write your message here..." onChange={(e) => setInlineFormData({ ...inlineFormData, message: e.target.value })} />
              </label>
              <button type="submit"><FiSend /> Send Message <FiArrowRight /></button>
            </form>
          )}
        </div>

        <div className="contact-location-panel" data-scroll-reveal>
          <span className="contact-section-kicker"><FiMapPin /> Our Location</span>
          <h2>Find Us on the <span>Map</span></h2>
          <p>Visit our campus and administrative office for any inquiries.</p>
          <div className="contact-map" role="img" aria-label="Illustrated map marking Gandhi Engineering College in Jharsuguda, Odisha">
            <span className="contact-map-road road-one" />
            <span className="contact-map-road road-two" />
            <span className="contact-map-road road-three" />
            <span className="contact-map-road road-four" />
            <span className="contact-map-place">Jharsuguda</span>
            <span className="contact-map-river" />
            <span className="contact-map-pin"><FiMapPin /></span>
            <span className="contact-map-campus">Gandhi Engineering College</span>
            <a href="https://maps.google.com/?q=Gandhi+Engineering+College+Jharsuguda+Odisha" target="_blank" rel="noreferrer">Open map <FiArrowRight /></a>
          </div>
          <div className="contact-office-info">
            <div><FiHome /><strong>Office Details</strong><span>SmartCampus<br />Gandhi Engineering College<br />Jharsuguda, Odisha - 768201<br />India</span></div>
            <div><FiClock /><strong>Office Hours</strong><span>Monday - Friday <b>9:00 AM - 6:00 PM</b><br />Saturday <b>9:00 AM - 4:00 PM</b><br />Sunday <b>Closed</b></span></div>
          </div>
        </div>
      </section>

      <section className="contact-support-section">
        <div className="contact-support-heading" data-scroll-reveal>
          <div>
            <span className="contact-section-kicker"><FiHelpCircle /> How Can We Help?</span>
            <h2>Get Support for Every <span>Need</span></h2>
            <p>Choose a category to get the right support and information.</p>
          </div>
          <a href="mailto:contact@smartcampus.com">View All Support <FiArrowRight /></a>
        </div>
        <div className="contact-support-grid">
          {supportOptions.map(({ title, description, icon: Icon, tone }) => (
            <a className={`contact-support-card ${tone}`} data-scroll-reveal href="mailto:contact@smartcampus.com" key={title}>
              <Icon />
              <strong>{title}</strong>
              <span>{description}</span>
              <i><FiArrowRight /></i>
            </a>
          ))}
        </div>
      </section>

      <section className="contact-help-bottom">
        <div className="contact-faq-panel" data-scroll-reveal>
          <span className="contact-section-kicker"><FiHelpCircle /> FAQ</span>
          <h2>Frequently Asked <span>Questions</span></h2>
          <p>Find quick answers to common questions.</p>
          <div className="contact-faq-list">
            {contactFaqs.map(({ question, answer }, index) => (
              <article className={`contact-faq-item${activeFaq === index ? " open" : ""}`} key={question}>
                <button type="button" aria-expanded={activeFaq === index} onClick={() => setActiveFaq(activeFaq === index ? -1 : index)}>
                  <span>{question}</span><FiChevronDown />
                </button>
                {activeFaq === index && <p>{answer}</p>}
              </article>
            ))}
          </div>
        </div>
        <div className="contact-questions-card" data-scroll-reveal style={{ backgroundImage: `linear-gradient(90deg, rgba(7, 11, 42, .94), rgba(7, 11, 42, .57)), url(${homeHeroImg})` }}>
          <span className="contact-questions-icon"><FiHeadphones /></span>
          <span className="contact-section-kicker">We’re Here for You</span>
          <h2>Still Have <span>Questions?</span></h2>
          <p>Our support team is always ready to help you. Reach out to us anytime and we’ll get back to you as soon as possible.</p>
          <button type="button" onClick={() => document.getElementById("contact-message-form")?.scrollIntoView({ behavior: "smooth" })}>
            Contact Support <FiArrowRight />
          </button>
          <div className="contact-support-promises">
            <div><FiZap /><strong>Quick Response</strong><span>We usually reply within 24 hours.</span></div>
            <div><FiShield /><strong>Reliable Support</strong><span>Dedicated team to assist you.</span></div>
            <div><FiUsers /><strong>Personalized Help</strong><span>Get support tailored to your needs.</span></div>
          </div>
        </div>
      </section>

      {/* Interactive Quick Contact Message Modal */}
      {showContactModal && (
        <div
          className="contact-modal-backdrop"
          onClick={() => setShowContactModal(false)}
        >
          <div
            className="contact-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="contact-modal-close"
              onClick={() => setShowContactModal(false)}
              aria-label="Close modal"
            >
              <FiX size={20} />
            </button>

            {submitted ? (
              <div style={{ textAlign: "center", padding: "2rem 0" }}>
                <h2 style={{ fontSize: "1.5rem", color: "#38bdf8", marginBottom: "0.5rem" }}>
                  Thank you!
                </h2>
                <p style={{ color: "#94a3b8" }}>
                  Your message has been received. Our team will get back to you shortly.
                </p>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "#ffffff" }}>
                  Send us a Message
                </h2>
                <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                  Fill out the form below and we'll connect with you soon.
                </p>
                <form onSubmit={handleSubmit}>
                  <div className="contact-modal-field">
                    <label className="contact-modal-label">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="contact-modal-input"
                    />
                  </div>
                  <div className="contact-modal-field">
                    <label className="contact-modal-label">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="contact-modal-input"
                    />
                  </div>
                  <div className="contact-modal-field">
                    <label className="contact-modal-label">Subject</label>
                    <input
                      type="text"
                      required
                      placeholder="Admission / Partnership / Support"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="contact-modal-input"
                    />
                  </div>
                  <div className="contact-modal-field">
                    <label className="contact-modal-label">Message</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="How can we assist you today?"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="contact-modal-textarea"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-contact-primary"
                    style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}
                  >
                    <span>Submit Message</span>
                    <FiArrowRight size={18} />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Contact;
