import { useMemo, useState } from "react";
import {
  FiBriefcase,
  FiChevronRight,
  FiHelpCircle,
  FiLock,
  FiSearch,
  FiSettings,
  FiUser,
  FiZap,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import "./ResourcePages.css";

const topics = [
  { title: "Getting Started", description: "Set up your account and explore key features.", icon: FiZap },
  { title: "Account & Login", description: "Login, password, and account related help.", icon: FiUser },
  { title: "Placements", description: "Job postings, applications, and interview details.", icon: FiBriefcase },
  { title: "Technical Support", description: "Report issues and get technical assistance.", icon: FiSettings },
];

const articles = [
  {
    category: "Getting Started",
    question: "How to register as a student?",
    answer:
      "Choose Get Started or Login and follow your institution's registration instructions. Your college may provide an invite or account credentials. If you have not received them, contact your campus administrator.",
  },
  {
    category: "Account & Login",
    question: "I forgot my password. What should I do?",
    answer:
      "Use the password reset option on the login screen if it is enabled for your institution. Otherwise, contact your campus administrator to securely reset your account.",
  },
  {
    category: "Placements",
    question: "How to apply for a job on SmartCampus?",
    answer:
      "Sign in to your student account, open Placements, and select an opportunity to review its eligibility requirements and application details.",
  },
  {
    category: "Placements",
    question: "How to contact the placement cell?",
    answer:
      "Open the Contact page to find the support details provided by your institution, or ask your placement coordinator for assistance.",
  },
  {
    category: "Technical Support",
    question: "Why can't I see my classes or assignments?",
    answer:
      "Course information is managed by your institution. Check that you are signed in to the correct account, then contact your faculty or campus administrator if the information is still missing.",
  },
  {
    category: "Technical Support",
    question: "Which browsers can I use?",
    answer:
      "Use a recent version of a modern browser such as Chrome, Edge, Firefox, or Safari. Keeping your browser up to date helps ensure the best experience.",
  },
];

export default function HelpCenter() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [openArticle, setOpenArticle] = useState(articles[0].question);
  const [hasSearched, setHasSearched] = useState(false);

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return articles.filter((article) => {
      const matchesCategory =
        !activeCategory || article.category === activeCategory;
      const matchesQuery =
        !query ||
        `${article.category} ${article.question} ${article.answer}`
          .toLowerCase()
          .includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, search]);

  const submitSearch = (event) => {
    event.preventDefault();
    setHasSearched(true);
  };

  return (
    <div className="resource-page help-page">
      <section className="resource-hero help-hero">
        <div className="resource-hero-copy">
          <span className="resource-eyebrow"><FiHelpCircle /> Help Center</span>
          <h1>How Can We <span>Help You?</span></h1>
          <p>Find guides, FAQs, and support for using SmartCampus.</p>
          <form className="help-search-form" onSubmit={submitSearch}>
            <FiSearch aria-hidden="true" />
            <input
              type="search"
              placeholder="Search for help articles, guides, or issues..."
              aria-label="Search help articles"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="submit">Search</button>
          </form>
        </div>
        <div className="resource-hero-art help-hero-art" aria-hidden="true">
          <div className="help-avatar"><FiUser /></div>
          <div className="help-chat-bubble">•••</div>
          <div className="help-orbit">?</div>
        </div>
      </section>

      <section className="resource-content help-content">
        <div className="help-topic-grid">
          {topics.map(({ title, description, icon: Icon }) => (
            <button
              type="button"
              className={`help-topic-card${activeCategory === title ? " selected" : ""}`}
              key={title}
              aria-pressed={activeCategory === title}
              onClick={() =>
                setActiveCategory((current) => current === title ? "" : title)
              }
            >
              <Icon className="help-topic-icon" aria-hidden="true" />
              <strong>{title}</strong>
              <span>{description}</span>
            </button>
          ))}
        </div>

        <div className="help-section-heading">
          <h2><FiLock aria-hidden="true" /> {hasSearched || activeCategory || search.trim() ? "Help Articles" : "Popular Help Articles"}</h2>
          {(search || activeCategory) && (
            <button
              type="button"
              className="resource-text-button"
              onClick={() => {
                setSearch("");
                setActiveCategory("");
                setHasSearched(false);
              }}
            >
              Clear filters
            </button>
          )}
        </div>
        {filteredArticles.length ? (
          <div className="help-article-list">
            {filteredArticles.map((article) => {
              const isOpen = openArticle === article.question;
              return (
                <article className={`help-article${isOpen ? " open" : ""}`} key={article.question}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenArticle(isOpen ? "" : article.question)}
                  >
                    <span className="help-article-icon"><FiHelpCircle /></span>
                    <span>{article.question}</span>
                    <FiChevronRight className="help-article-chevron" />
                  </button>
                  {isOpen && <p>{article.answer}</p>}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="resource-empty">
            <h2>No matching help articles</h2>
            <p>Try a different search, or contact your campus support team.</p>
          </div>
        )}
        <div className="help-contact-card">
          <div><FiHelpCircle /><strong>Still need help?</strong><span>Our team is here to point you in the right direction.</span></div>
          <Link to="/contact">Contact us <FiChevronRight /></Link>
        </div>
      </section>
    </div>
  );
}
