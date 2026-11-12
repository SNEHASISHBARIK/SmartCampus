import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const menuItems = [
    {
      label: "Dashboard",
      path: "/student",
      icon: "🏠",
    },
    {
      label: "Profile",
      path: "/student/profile",
      icon: "👤",
    },
    {
      label: "Attendance",
      path: "/student/attendance",
      icon: "📊",
    },
    {
      label: "Timetable",
      path: "/student/timetable",
      icon: "🗓️",
    },
    {
      label: "Subjects",
      path: "/student/subjects",
      icon: "📚",
    },
    {
      label: "Assignments",
      path: "/student/assignments",
      icon: "📝",
    },
    {
      label: "Results",
      path: "/student/results",
      icon: "🎓",
    },
    {
      label: "Exams",
      path: "/student/exams",
      icon: "📋",
    },
    {
      label: "Leave",
      path: "/student/leave",
      icon: "📅",
    },
    {
      label: "Fees",
      path: "/student/fees",
      icon: "💳",
    },
    {
      label: "Notices",
      path: "/student/notices",
      icon: "📢",
    },
    {
      label: "Complaints",
      path: "/student/complaints",
      icon: "⚠️",
    },
    {
      label: "Placements",
      path: "/student/placements",
      icon: "💼",
    },
    {
      label: "Notes",
      path: "/student/notes",
      icon: "📖",
    },
  ];

  return (
    <aside style={styles.sidebar}>
      <div style={styles.menu}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/student"}
            style={({ isActive }) => ({
              ...styles.link,
              ...(isActive ? styles.activeLink : {}),
            })}
          >
            <span style={styles.icon}>{item.icon}</span>

            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

const styles = {
  sidebar: {
    width: "240px",
    minHeight: "calc(100vh - 72px)",
    background: "#111827",
    padding: "20px 12px",
    boxSizing: "border-box",
  },

  menu: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  link: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "11px 14px",
    borderRadius: "8px",
    color: "#d1d5db",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s ease",
  },

  activeLink: {
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: "600",
  },

  icon: {
    width: "24px",
    textAlign: "center",
    fontSize: "17px",
  },
};

export default Sidebar;