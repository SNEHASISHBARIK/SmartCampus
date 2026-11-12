import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const FacultyLayout = () => {
  return (
    <div style={styles.app}>
      <Navbar />

      <div style={styles.body}>
        <aside style={styles.sidebar}>
          <h2 style={styles.title}>Faculty Panel</h2>

          <nav style={styles.nav}>
            <a href="/faculty">Dashboard</a>
            <a href="/faculty/attendance">Attendance</a>
            <a href="/faculty/assignments">Assignments</a>
            <a href="/faculty/marks">Marks</a>
            <a href="/faculty/notes">Notes</a>
            <a href="/faculty/exams">Exams</a>
          </nav>
        </aside>

        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const styles = {
  app: {
    minHeight: "100vh",
    background: "#f5f7fb",
  },

  body: {
    display: "flex",
    minHeight: "calc(100vh - 70px)",
  },

  sidebar: {
    width: "240px",
    background: "#111827",
    padding: "25px 15px",
  },

  title: {
    color: "#fff",
    marginBottom: "25px",
    fontSize: "20px",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  content: {
    flex: 1,
    padding: "30px",
  },
};

export default FacultyLayout;