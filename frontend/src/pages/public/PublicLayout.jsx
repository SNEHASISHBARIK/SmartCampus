import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FiMenu,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { FaGraduationCap } from "react-icons/fa";
import "./PublicLayout.css";

const PublicLayout = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const location = useLocation();
  const isResourcePage = [
    "/blog",
    "/help",
    "/privacy",
    "/terms",
    "/placement-guide",
    "/interview-tips",
  ].includes(location.pathname);

  const closeMenu = () => setMobileMenuOpen(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/features`);
      setSearchOpen(false);
    }
  };

  return (
    <div className={`public-shell${isResourcePage ? " public-shell-light" : ""}`}>
      {/* Top Header / Navigation Bar matching Mockup */}
      <header className="public-navbar">
        <div className="public-navbar-container">
          {/* Brand Logo */}
          <Link to="/" className="public-brand" onClick={closeMenu}>
            <div className="public-brand-icon">
              <FaGraduationCap size={20} />
            </div>
            <div className="public-brand-text">
              <span>Smart</span>
              <span className="public-brand-highlight">Campus</span>
            </div>
          </Link>

          {/* Centered Navigation Links */}
          <nav className={`public-nav-links ${mobileMenuOpen ? "mobile-open" : ""}`}>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `public-nav-link ${isActive ? "active" : ""}`
              }
              onClick={closeMenu}
            >
              <span>Home</span>
              <span className="nav-active-indicator" />
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `public-nav-link ${isActive ? "active" : ""}`
              }
              onClick={closeMenu}
            >
              <span>About</span>
              <span className="nav-active-indicator" />
            </NavLink>

            <NavLink
              to="/features"
              className={({ isActive }) =>
                `public-nav-link ${isActive ? "active" : ""}`
              }
              onClick={closeMenu}
            >
              <span>Features</span>
              <span className="nav-active-indicator" />
            </NavLink>

            <NavLink
              to="/placement"
              className={({ isActive }) =>
                `public-nav-link ${isActive ? "active" : ""}`
              }
              onClick={closeMenu}
            >
              <span>Placements</span>
              <span className="nav-active-indicator" />
            </NavLink>

            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `public-nav-link ${isActive ? "active" : ""}`
              }
              onClick={closeMenu}
            >
              <span>Contact</span>
              <span className="nav-active-indicator" />
            </NavLink>
          </nav>

          {/* Right Action Buttons */}
          <div className="public-actions">
            {/* Search Icon / Input */}
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="public-search-form">
                <input
                  type="text"
                  placeholder="Search campus..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="public-search-input"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="public-search-close"
                >
                  <FiX size={15} />
                </button>
              </form>
            ) : (
              <button
                type="button"
                className="public-search-btn"
                onClick={() => setSearchOpen(true)}
                title="Search platform"
              >
                <FiSearch size={18} />
              </button>
            )}

            {/* Outlined Pill Login Button */}
            <Link to="/login" className="public-nav-login-pill">
              Login
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              className="public-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Content Body */}
      <main className="public-main-content">
        <Outlet />
      </main>

      {/* These pages include their own showcase footers. */}
      {!["/about", "/features", "/placement"].includes(location.pathname) && (
        <footer className="public-footer">
          <div className="public-footer-inner">
            <div className="public-footer-brand">
              © {new Date().getFullYear()} SmartCampus Ecosystem. All rights reserved.
            </div>
            <div className="public-footer-links">
              <Link to="/">Home</Link>
              <Link to="/about">About</Link>
              <Link to="/features">Features</Link>
              <Link to="/placement">Placements</Link>
              <Link to="/campus-life">Campus Life</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/blog">Blog</Link>
              <Link to="/help">Help Center</Link>
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
              <Link to="/login">Login</Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default PublicLayout;
