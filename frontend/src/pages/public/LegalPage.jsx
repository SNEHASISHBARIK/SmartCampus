import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiFileText, FiShield } from "react-icons/fi";
import "./ResourcePages.css";

const legalContent = {
  privacy: {
    label: "Privacy Policy",
    description:
      "Your privacy matters to us. This policy explains how SmartCampus collects, uses, and protects your information.",
    sections: [
      {
        title: "Overview",
        paragraphs: [
          'SmartCampus ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.',
        ],
      },
      {
        title: "Information We Collect",
        paragraphs: ["We may collect the following information:"],
        bullets: [
          "Personal information (e.g., name, email, phone number, college details).",
          "Academic and placement-related information (e.g., resume, skills, applications).",
          "Usage data (e.g., pages visited, features used, device information).",
        ],
      },
      {
        title: "How We Use Your Information",
        paragraphs: ["We use the collected information to:"],
        bullets: [
          "Provide and improve SmartCampus services.",
          "Facilitate placement and job opportunities.",
          "Communicate important updates and notifications.",
        ],
      },
      {
        title: "Data Sharing",
        paragraphs: [
          "We share information only when needed to provide the platform, support institution-managed services, comply with applicable law, or protect the security of our users.",
        ],
      },
      {
        title: "Data Security",
        paragraphs: [
          "We use reasonable administrative and technical safeguards designed to protect information. No online service can guarantee absolute security.",
        ],
      },
      {
        title: "Your Rights",
        paragraphs: [
          "You may contact your institution or our support team to request access to, correction of, or deletion of personal information, subject to applicable requirements.",
        ],
      },
      {
        title: "Changes to This Policy",
        paragraphs: [
          "We may update this policy from time to time. Any updates will be posted on this page with a revised effective date.",
        ],
      },
      {
        title: "Contact Us",
        paragraphs: [
          "For questions about this policy or your information, please contact the SmartCampus support team.",
        ],
      },
    ],
  },
  terms: {
    label: "Terms & Conditions",
    description:
      "Please read these terms and conditions carefully before using SmartCampus.",
    sections: [
      {
        title: "Acceptance of Terms",
        paragraphs: [
          "By accessing or using SmartCampus, you agree to be bound by these Terms & Conditions and all applicable laws and regulations.",
        ],
      },
      {
        title: "Use of the Platform",
        paragraphs: [
          "SmartCampus is a platform designed to connect students, colleges, and recruiters for placement, academic, and campus management purposes.",
        ],
      },
      {
        title: "User Responsibilities",
        paragraphs: ["You agree to:"],
        bullets: [
          "Provide accurate and up-to-date information.",
          "Maintain the confidentiality of your account credentials.",
          "Use the platform only for lawful and intended purposes.",
          "Comply with all applicable policies of your institution.",
        ],
      },
      {
        title: "Prohibited Activities",
        paragraphs: [
          "You may not misuse the platform, interfere with its operation, attempt unauthorized access, or submit misleading or unlawful content.",
        ],
      },
      {
        title: "Intellectual Property",
        paragraphs: [
          "The platform and its original content, features, and functionality are owned by SmartCampus or its licensors and are protected by applicable intellectual property laws.",
        ],
      },
      {
        title: "Termination",
        paragraphs: [
          "Access may be suspended or terminated where these terms or applicable institutional policies are violated, subject to applicable law.",
        ],
      },
      {
        title: "Changes to Terms",
        paragraphs: [
          "We may revise these terms from time to time. Continued use of the platform after an update means you accept the revised terms.",
        ],
      },
      {
        title: "Contact Us",
        paragraphs: [
          "If you have questions about these terms, please contact the SmartCampus support team.",
        ],
      },
    ],
  },
};

export default function LegalPage({ type }) {
  const location = useLocation();
  const content = legalContent[type];
  const Icon = type === "privacy" ? FiShield : FiFileText;

  useEffect(() => {
    const section = location.hash.slice(1);
    if (section) {
      document.getElementById(section)?.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.hash]);

  return (
    <div className="resource-page legal-page">
      <section className="resource-hero legal-hero">
        <div className="resource-hero-copy">
          <span className="resource-eyebrow"><Icon /> {content.label}</span>
          <h1>{type === "privacy" ? <>Privacy <span>Policy</span></> : <>Terms <span>&amp; Conditions</span></>}</h1>
          <p>{content.description}</p>
        </div>
        <div className="resource-hero-art legal-hero-art" aria-hidden="true">
          <div className="legal-document"><Icon /><span /><span /><span /><span /></div>
          <span className="legal-leaf">✦</span>
        </div>
      </section>

      <section className="resource-content legal-content">
        <aside className="legal-toc">
          <strong>On This Page</strong>
          <nav aria-label="On this page">
            {content.sections.map((section, index) => (
              <a href={`#legal-section-${index}`} key={section.title}>
                <span aria-hidden="true">›</span>{section.title}
              </a>
            ))}
          </nav>
          <p>Questions? <Link to="/contact">Contact us</Link></p>
        </aside>
        <div className="legal-article">
          {content.sections.map((section, index) => (
            <section id={`legal-section-${index}`} key={section.title}>
              <h2>{index + 1}. {section.title}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.bullets && (
                <ul>
                  {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              )}
            </section>
          ))}
          <p className="legal-updated">Last updated: October 2026</p>
        </div>
      </section>
    </div>
  );
}
