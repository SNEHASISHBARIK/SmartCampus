import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./StudentLayout.css";

const menuItems = [
  { label: "Dashboard", path: "/student", icon: "🏠", end: true },
  { label: "Profile", path: "/student/profile", icon: "👤" },
  { label: "Attendance", path: "/student/attendance", icon: "📊" },
  { label: "Timetable", path: "/student/timetable", icon: "🗓️" },
  { label: "Subjects", path: "/student/subjects", icon: "📚" },
  { label: "Assignments", path: "/student/assignments", icon: "📝" },
  { label: "Results", path: "/student/results", icon: "🎓" },
  { label: "Exams", path: "/student/exams", icon: "📋" },
  { label: "Leave", path: "/student/leave", icon: "📅" },
  { label: "Fees", path: "/student/fees", icon: "💳" },
  { label: "Notices", path: "/student/notices", icon: "📢" },
  { label: "Complaints", path: "/student/complaints", icon: "⚠️" },
  { label: "Placements", path: "/student/placements", icon: "💼" },
  { label: "Notes", path: "/student/notes", icon: "📖" },
];

export default function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const studentName = user?.name?.trim() || "Student";
  const avatarInitial = studentName.charAt(0).toUpperCase();

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

  // Close mobile drawer on route navigation
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
      className={`student-layout ${
        sidebarCollapsed ? "sidebar-collapsed" : ""
      } ${isFullscreen ? "is-fullscreen" : ""}`}
    >
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="student-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`student-sidebar ${mobileOpen ? "mobile-open" : ""}`}
        aria-label="Student Navigation Sidebar"
      >
        <div className="student-brand">
          <div className="student-brand-icon" title="SmartCampus Student Portal">
            🎓
          </div>
          <div className="student-brand-text">
            <strong>
              Smart<span>Campus</span>
            </strong>
            <small>Student Portal</small>
          </div>

          <button
            className="student-collapse-btn desktop-only"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label="Toggle sidebar collapse"
          >
            {sidebarCollapsed ? "⇥" : "⇤"}
          </button>
        </div>

        <div className="student-panel-label">
          <span>MAIN MENU</span>
        </div>

        <nav className="student-navigation">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              title={sidebarCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `student-nav-link${isActive ? " active" : ""}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <span className="student-nav-icon">{item.icon}</span>
              <span className="student-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="student-sidebar-divider" />

        <div className="student-panel-label">
          <span>SYSTEM</span>
        </div>

        <button
          className="student-nav-link student-action-link"
          onClick={toggleFullscreen}
          title={
            sidebarCollapsed
              ? isFullscreen
                ? "Exit Fullscreen"
                : "Enter Fullscreen"
              : undefined
          }
        >
          <span className="student-nav-icon">
            {isFullscreen ? "🗗" : "⛶"}
          </span>
          <span className="student-nav-label">
            {isFullscreen ? "Exit Fullscreen" : "Full Screen Mode"}
          </span>
        </button>

        <button
          className="student-nav-link student-action-link student-logout-link"
          onClick={handleLogout}
          title={sidebarCollapsed ? "Logout" : undefined}
        >
          <span className="student-nav-icon">↪</span>
          <span className="student-nav-label">Logout</span>
        </button>

        {!sidebarCollapsed && (
          <div className="student-sidebar-footer-card">
            <div className="student-footer-building">🏫</div>
            <h3>Smart Campus</h3>
            <p>Empowering students for a brighter tomorrow.</p>
            <span>Gandhi Engineering College</span>
          </div>
        )}
      </aside>

      {/* MAIN WORKSPACE */}
      <div className="student-workspace">
        {/* TOP NAVBAR */}
        <header className="student-navbar">
          {/* Mobile hamburger button */}
          <button
            className="student-mobile-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation drawer"
          >
            ☰
          </button>

          {/* Desktop sidebar collapse button */}
          <button
            className="student-desktop-collapse-btn desktop-only"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label="Toggle sidebar collapse"
          >
            {sidebarCollapsed ? "☰" : "⇤"}
          </button>

          <div className="student-navbar-brand">
            <span>SC</span>
            <div>
              <strong>SmartCampus</strong>
              <small>Student Portal</small>
            </div>
          </div>

          <div className="student-navbar-spacer" />

          {/* Live indicator badge */}
          <div className="student-status-badge desktop-only" title="Connection: Active">
            <span className="student-status-dot"></span>
            <span>Online</span>
          </div>

          {/* Fullscreen toggle button */}
          <button
            className="student-header-action-btn fullscreen-header-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            aria-label="Toggle full screen"
          >
            <span>{isFullscreen ? "🗗" : "⛶"}</span>
          </button>

          {/* User Profile */}
          <div className="student-user-profile" title={user?.email || studentName}>
            <div className="student-user-avatar">{avatarInitial}</div>

            <div className="student-user-details">
              <strong>{studentName}</strong>
              <span>{user?.role || "Student"}</span>
            </div>
          </div>

          {/* Quick Logout Button */}
          <button
            className="student-quick-logout-btn desktop-only"
            onClick={handleLogout}
            title="Logout"
          >
            Logout
          </button>
        </header>

        {/* PAGE CONTENT ROUTE OUTLET */}
        <main className="student-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}