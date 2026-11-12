import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./FacultyLayout.css";

const navigation = [
  { label: "Dashboard", path: "/faculty/dashboard", icon: "📊" },
  { label: "Attendance", path: "/faculty/attendance", icon: "📋" },
  { label: "Assignments", path: "/faculty/assignments", icon: "📝" },
  { label: "Marks", path: "/faculty/marks", icon: "📈" },
  { label: "Notes", path: "/faculty/notes", icon: "📚" },
  { label: "Exams", path: "/faculty/exams", icon: "📅" },
];

export default function FacultyLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const facultyName = user?.name?.trim() || "Faculty Member";
  const avatarInitial = facultyName.charAt(0).toUpperCase();

  // Fullscreen change synchronization
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Fullscreen toggle handler
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
          await document.documentElement.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed:", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      className={`faculty-layout ${
        sidebarCollapsed ? "sidebar-collapsed" : ""
      } ${isFullscreen ? "is-fullscreen" : ""}`}
    >
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="faculty-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`faculty-sidebar ${mobileOpen ? "mobile-open" : ""}`}
        aria-label="Faculty Navigation Sidebar"
      >
        <div className="faculty-brand">
          <div className="faculty-brand-icon" title="SmartCampus Faculty">
            🎓
          </div>
          <div className="faculty-brand-text">
            <strong>
              Smart<span>Campus</span>
            </strong>
            <small>Faculty Portal</small>
          </div>

          <button
            className="faculty-collapse-btn desktop-only"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label="Toggle sidebar collapse"
          >
            {sidebarCollapsed ? "⇥" : "⇤"}
          </button>
        </div>

        <div className="faculty-panel-label">
          <span>FACULTY MENU</span>
        </div>

        <nav className="faculty-navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={sidebarCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `faculty-nav-link${isActive ? " active" : ""}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <span className="faculty-nav-icon">{item.icon}</span>
              <span className="faculty-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="faculty-sidebar-divider" />

        <div className="faculty-panel-label">
          <span>SYSTEM</span>
        </div>

        <button
          className="faculty-nav-link faculty-action-link"
          onClick={toggleFullscreen}
          title={
            sidebarCollapsed
              ? isFullscreen
                ? "Exit Fullscreen"
                : "Enter Fullscreen"
              : undefined
          }
        >
          <span className="faculty-nav-icon">
            {isFullscreen ? "🗗" : "⛶"}
          </span>
          <span className="faculty-nav-label">
            {isFullscreen ? "Exit Fullscreen" : "Full Screen Mode"}
          </span>
        </button>

        <button
          className="faculty-nav-link faculty-action-link faculty-logout-link"
          onClick={handleLogout}
          title={sidebarCollapsed ? "Logout" : undefined}
        >
          <span className="faculty-nav-icon">↪</span>
          <span className="faculty-nav-label">Logout</span>
        </button>

        {!sidebarCollapsed && (
          <div className="faculty-sidebar-footer-card">
            <div className="faculty-footer-building">🏫</div>
            <h3>Smart Campus</h3>
            <p>Empowering faculty with real-time academic intelligence.</p>
            <span>Gandhi Engineering College</span>
          </div>
        )}
      </aside>

      {/* MAIN WORKSPACE */}
      <div className="faculty-workspace">
        {/* TOPBAR */}
        <header className="faculty-topbar">
          {/* Mobile hamburger button */}
          <button
            className="faculty-mobile-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation drawer"
          >
            ☰
          </button>

          {/* Desktop sidebar collapse button */}
          <button
            className="faculty-desktop-collapse-btn desktop-only"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label="Toggle sidebar collapse"
          >
            {sidebarCollapsed ? "☰" : "⇤"}
          </button>

          <div className="faculty-topbar-brand">
            <span>SC</span>
            <div>
              <strong>SmartCampus</strong>
              <small>Faculty Management</small>
            </div>
          </div>

          <div className="faculty-topbar-spacer" />

          {/* Live indicator badge */}
          <div className="faculty-status-badge desktop-only" title="Connection: Active">
            <span className="faculty-status-dot"></span>
            <span>Online</span>
          </div>

          {/* Fullscreen toggle button */}
          <button
            className="faculty-header-action-btn fullscreen-header-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            aria-label="Toggle full screen"
          >
            <span>{isFullscreen ? "🗗" : "⛶"}</span>
          </button>

          {/* User Profile */}
          <div className="faculty-user-profile" title={user?.email || facultyName}>
            <div className="faculty-user-avatar">{avatarInitial}</div>

            <div className="faculty-user-details">
              <strong>{facultyName}</strong>
              <span>Faculty Member</span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT ROUTE OUTLET */}
        <main className="faculty-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
