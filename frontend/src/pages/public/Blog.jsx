import { useMemo, useState } from "react";
import { FiBookOpen, FiCalendar, FiClock, FiSearch } from "react-icons/fi";
import { Link } from "react-router-dom";
import hero3Img from "../../assets/hero3.png";
import hero4Img from "../../assets/hero4.png";
import featuresImg from "../../assets/features.png";
import "./ResourcePages.css";

const posts = [
  {
    category: "Placements",
    title: "How to Prepare for Campus Placements in 2026",
    excerpt:
      "A complete guide with tips, resources, and strategies to help you dream job ready.",
    date: "Oct 28, 2026",
    readTime: "5 min read",
    image: hero4Img,
  },
  {
    category: "Technology",
    title: "Top Web Development Trends to Learn in 2026",
    excerpt:
      "Explore the most in-demand web technologies and skills for the year ahead.",
    date: "Oct 25, 2026",
    readTime: "6 min read",
    image: featuresImg,
  },
  {
    category: "Campus Life",
    title: "How SmartCampus is Transforming Campus Management",
    excerpt:
      "Discover how a unified platform can simplify academic and placement activities.",
    date: "Oct 20, 2026",
    readTime: "4 min read",
    image: hero3Img,
  },
  {
    category: "Career Tips",
    title: "Build a Resume That Gets Noticed",
    excerpt:
      "Turn your coursework, projects, and campus experience into a compelling resume.",
    date: "Oct 16, 2026",
    readTime: "7 min read",
    image: hero4Img,
  },
  {
    category: "Technology",
    title: "Make the Most of AI Tools in Your Job Search",
    excerpt:
      "A practical guide to using AI thoughtfully as you prepare for your next opportunity.",
    date: "Oct 12, 2026",
    readTime: "5 min read",
    image: featuresImg,
  },
  {
    category: "Campus Life",
    title: "Small Ways to Make Your Campus Experience Count",
    excerpt:
      "Find your community, try something new, and make the most of every semester.",
    date: "Oct 08, 2026",
    readTime: "4 min read",
    image: hero3Img,
  },
];

const categories = ["All Posts", "Placements", "Career Tips", "Technology", "Campus Life"];

export default function Blog() {
  const [category, setCategory] = useState("All Posts");
  const [search, setSearch] = useState("");

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory =
        category === "All Posts" || post.category === category;
      const matchesSearch =
        !query ||
        `${post.category} ${post.title} ${post.excerpt}`
          .toLowerCase()
          .includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  return (
    <div className="resource-page blog-page">
      <section className="resource-hero blog-hero">
        <div className="resource-hero-copy">
          <span className="resource-eyebrow"><FiBookOpen /> Blog</span>
          <h1>SmartCampus <span>Blog</span></h1>
          <p>Insights, updates, and tips for students, placement, and campus life.</p>
        </div>
        <div className="resource-hero-art blog-hero-art" aria-hidden="true">
          <span className="art-orbit" />
          <img src={hero4Img} alt="" />
        </div>
      </section>

      <section className="resource-content">
        <div className="blog-toolbar">
          <div className="blog-filters" aria-label="Filter blog posts">
            {categories.map((item) => (
              <button
                type="button"
                key={item}
                className={`resource-chip${category === item ? " selected" : ""}`}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="resource-search">
            <FiSearch aria-hidden="true" />
            <input
              type="search"
              placeholder="Search blog articles..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search blog articles"
            />
          </label>
        </div>

        {filteredPosts.length ? (
          <div className="blog-grid">
            {filteredPosts.map((post) => (
              <article className="blog-card" key={post.title}>
                <img className="blog-card-image" src={post.image} alt="" loading="lazy" />
                <div className="blog-card-body">
                  <span className="blog-category">{post.category}</span>
                  <h2>{post.title}</h2>
                  <p>{post.excerpt}</p>
                  <div className="blog-card-meta">
                    <span><FiCalendar /> {post.date}</span>
                    <span><FiClock /> {post.readTime}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="resource-empty">
            <h2>No articles found</h2>
            <p>Try a different search or choose another category.</p>
            <button type="button" className="resource-text-button" onClick={() => {
              setSearch("");
              setCategory("All Posts");
            }}>
              Clear filters
            </button>
          </div>
        )}
        <div className="resource-bottom-cta">
          <p>Need a hand finding something?</p>
          <Link to="/help">Visit the Help Center <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </div>
  );
}
