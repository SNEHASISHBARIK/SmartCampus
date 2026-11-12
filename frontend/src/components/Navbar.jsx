import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav style={styles.navbar}>
      {/* Brand */}
      <div style={styles.brand}>
        <div style={styles.logo}>SC</div>

        <div>
          <h2 style={styles.title}>SmartCampus</h2>
          <span style={styles.subtitle}>College Management System</span>
        </div>
      </div>

      {/* Right Side */}
      <div style={styles.right}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div>
            <div style={styles.userName}>
              {user?.name || "User"}
            </div>

            <div style={styles.role}>
              {user?.role || "student"}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          style={styles.logout}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    height: "72px",
    padding: "0 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#ffffff",
    borderBottom: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    boxSizing: "border-box",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  logo: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "16px",
  },

  title: {
    margin: 0,
    fontSize: "20px",
    color: "#111827",
  },

  subtitle: {
    fontSize: "11px",
    color: "#6b7280",
  },

  right: {
    display: "flex",
    alignItems: "center",
    gap: "22px",
  },

  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  avatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontWeight: "700",
  },

  userName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#111827",
  },

  role: {
    fontSize: "12px",
    color: "#6b7280",
    textTransform: "capitalize",
  },

  logout: {
    padding: "9px 16px",
    border: "none",
    borderRadius: "7px",
    background: "#dc2626",
    color: "#ffffff",
    fontSize: "14px",
    cursor: "pointer",
  },
};

export default Navbar;