import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AdminLayout.css";

const menuItems = [
  { path: "/admin", label: "Dashboard", icon: "📊", end: true },
  { path: "/admin/students", label: "Students", icon: "👥" },
  { path: "/admin/faculty", label: "Faculty", icon: "👨‍🏫" },
  { path: "/admin/departments", label: "Departments", icon: "🏢" },
  { path: "/admin/subjects", label: "Subjects", icon: "📚" },
  { path: "/admin/fees", label: "Fees", icon: "💳" },
  { path: "/admin/complaints", label: "Complaints", icon: "💬" },
  { path: "/admin/leaves", label: "Leaves", icon: "📝" },
  { path: "/admin/notices", label: "Notices", icon: "📢" },
  { path: "/admin/exams", label: "Exams", icon: "📋" },
  { path: "/admin/timetable", label: "Timetable", icon: "🗓️" },
  { path: "/admin/analytics", label: "Analytics", icon: "📈" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync fullscreen state with browser changes (e.g. Esc key pressed)
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
      className={`admin-layout ${
        sidebarCollapsed ? "sidebar-collapsed" : ""
      } ${isFullscreen ? "is-fullscreen" : ""}`}
    >
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="admin-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`admin-sidebar ${mobileOpen ? "mobile-open" : ""}`}
        aria-label="Admin Navigation Sidebar"
      >
        <div className="admin-brand">
          <div className="brand-logo" title="SmartCampus Admin">
            🎓
          </div>

          <div className="brand-text">
            <h2>
              Smart<span>Campus</span>
            </h2>
            <p>Admin Panel</p>
          </div>

          <button
            className="sidebar-collapse-btn desktop-only"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label="Toggle sidebar collapse"
          >
            {sidebarCollapsed ? "⇥" : "⇤"}
          </button>
        </div>

        <div className="menu-title">
          <span>MAIN MENU</span>
        </div>

        <nav className="admin-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              title={sidebarCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `admin-nav-item ${isActive ? "active" : ""}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-divider" />

        <div className="menu-title">
          <span>SYSTEM</span>
        </div>

        <button
          className="admin-nav-item sidebar-button"
          onClick={toggleFullscreen}
          title={
            sidebarCollapsed
              ? isFullscreen
                ? "Exit Fullscreen"
                : "Enter Fullscreen"
              : undefined
          }
        >
          <span className="nav-icon">{isFullscreen ? "🗗" : "⛶"}</span>
          <span className="nav-label">
            {isFullscreen ? "Exit Fullscreen" : "Full Screen Mode"}
          </span>
        </button>

        <button
          className="admin-nav-item sidebar-button logout-button"
          onClick={handleLogout}
          title={sidebarCollapsed ? "Logout" : undefined}
        >
          <span className="nav-icon">↪</span>
          <span className="nav-label">Logout</span>
        </button>

        {!sidebarCollapsed && (
          <div className="sidebar-footer-card">
            <div className="footer-building">🏫</div>
            <h3>Smart Campus</h3>
            <p>Empowering students for a brighter tomorrow.</p>
            <span>Gandhi Engineering College</span>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="admin-main">
        {/* TOP HEADER */}
        <header className="admin-header">
          {/* Mobile hamburger button */}
          <button
            className="mobile-menu-button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle mobile menu"
          >
            ☰
          </button>

          {/* Desktop sidebar toggle button */}
          <button
            className="header-collapse-button desktop-only"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label="Toggle sidebar collapse"
          >
            {sidebarCollapsed ? "☰" : "⇤"}
          </button>

          {/* Global Search */}
          <div className="global-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search students, faculty, departments..."
              aria-label="Global search"
            />
          </div>

          <div className="header-right">
            {/* Live Campus Indicator */}
            <div className="system-status-badge desktop-only" title="Server Status: Connected">
              <span className="status-indicator-dot"></span>
              <span>Online</span>
            </div>

            {/* Fullscreen Button */}
            <button
              className="header-action-button fullscreen-header-button"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Full Screen" : "Enter Full Screen"}
              aria-label="Toggle full screen"
            >
              <span>{isFullscreen ? "🗗" : "⛶"}</span>
            </button>

            {/* Notifications */}
            <button
              className="header-action-button notification-button"
              aria-label="Notifications"
              title="Notifications"
            >
              <span>🔔</span>
              <span className="notification-count">5</span>
            </button>

            {/* Profile */}
            <div className="admin-profile" title={user?.email || "Admin Profile"}>
              <div className="profile-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>

              <div className="profile-info">
                <strong>{user?.name || "SmartCampus Admin"}</strong>
                <span>Gandhi Engg. College</span>
              </div>

              <span className="profile-arrow">⌄</span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT ROUTE OUTLET */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}