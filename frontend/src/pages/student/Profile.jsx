import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiArrowRight,
  FiBell,
  FiBookOpen,
  FiCalendar,
  FiCamera,
  FiCheck,
  FiChevronRight,
  FiEdit2,
  FiFileText,
  FiHelpCircle,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiTrendingUp,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./Profile.css";

const displayValue = (value) => {
  if (value === null || value === undefined || value === "") return "Not provided";
  return value;
};

const formatDate = (value) => {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not provided"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
};

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [results, setResults] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchProfileData = async () => {
      setLoading(true);
      setError("");
      try {
        const [profileResult, dashboardResult, resultsResult] =
          await Promise.allSettled([
            api.get("/students/profile"),
            api.get("/students/dashboard"),
            api.get("/students/results"),
          ]);
        if (!active) return;

        if (profileResult.status === "rejected") {
          throw profileResult.reason;
        }

        const student = profileResult.value.data?.student;
        setProfile(student || null);
        setDashboard(
          dashboardResult.status === "fulfilled"
            ? dashboardResult.value.data?.dashboard || null
            : null
        );
        setResults(
          resultsResult.status === "fulfilled"
            ? resultsResult.value.data?.results || []
            : []
        );
        if (dashboardResult.status === "rejected") {
          console.error("Profile dashboard summary error:", dashboardResult.reason);
        }
        if (resultsResult.status === "rejected") {
          console.error("Profile academic results error:", resultsResult.reason);
        }
        setFormData({
          phone: student?.user?.phone || "",
          address: student?.address || "",
          guardianName: student?.guardianName || "",
          guardianPhone: student?.guardianPhone || "",
          profileImage: student?.user?.profileImage || "",
        });
      } catch (requestError) {
        if (!active) return;
        console.error("Profile error:", requestError);
        setError(
          requestError.response?.data?.message || "Unable to load profile."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchProfileData();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const academicStats = useMemo(() => {
    const grades = results
      .filter((result) => result.gradePoint !== null && result.gradePoint !== undefined)
      .map((result) => Number(result.gradePoint))
      .filter(Number.isFinite);
    const cgpa = grades.length
      ? (grades.reduce((sum, value) => sum + value, 0) / grades.length).toFixed(1)
      : "—";

    const latestSemester = Math.max(
      0,
      ...results.map((result) => Number(result.semester) || 0)
    );
    const latestResults = results.filter(
      (result) => Number(result.semester) === latestSemester
    );
    const latestGrades = latestResults
      .filter((result) => result.gradePoint !== null && result.gradePoint !== undefined)
      .map((result) => Number(result.gradePoint))
      .filter(Number.isFinite);
    const sgpa = latestGrades.length
      ? (
          latestGrades.reduce((sum, value) => sum + value, 0) /
          latestGrades.length
        ).toFixed(1)
      : "—";
    const backlogs = results.filter((result) =>
      ["f", "fail", "backlog"].includes(String(result.grade || "").toLowerCase())
    ).length;

    return {
      cgpa,
      sgpa,
      backlogs,
      attendance: Number(dashboard?.attendance?.percentage || 0),
    };
  }, [dashboard?.attendance?.percentage, results]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await api.put("/students/profile", formData);
      setProfile(response.data.student);
      setFormData((previous) => ({
        ...previous,
        phone: response.data.student?.user?.phone || previous.phone,
        address: response.data.student?.address || previous.address,
        guardianName:
          response.data.student?.guardianName || previous.guardianName,
        guardianPhone:
          response.data.student?.guardianPhone || previous.guardianPhone,
        profileImage:
          response.data.student?.user?.profileImage || previous.profileImage,
      }));
      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (requestError) {
      console.error("Update profile error:", requestError);
      setError(
        requestError.response?.data?.message || "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="student-profile-state">
        <span className="student-profile-spinner" />
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="student-profile-state student-profile-error">
        <FiAlertCircle />
        <h2>{error}</h2>
        <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
          Try again
        </button>
      </div>
    );
  }

  const studentName = profile?.user?.name || user?.name || "Student";
  const initials = studentName
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const yearNumber = profile?.semester
    ? Math.ceil(Number(profile.semester) / 2)
    : null;
  const yearSuffix =
    yearNumber === 1 ? "st" : yearNumber === 2 ? "nd" : yearNumber === 3 ? "rd" : "th";
  const currentYear = yearNumber ? `${yearNumber}${yearSuffix} Year` : "Not provided";
  const navTabs = [
    ["personal-information", "Personal Information"],
    ["academic-details", "Academic Details"],
    ["contact-details", "Contact Details"],
    ["documents", "Documents"],
    ["more-information", "More"],
  ];

  return (
    <div className="student-profile-page">
      <div className="student-profile-toolbar">
        <div className="student-profile-search">
          <FiBookOpen />
          <input aria-label="Search" placeholder="Search for subjects, notices, etc..." />
        </div>
        <div className="student-profile-toolbar-user">
          <span className="student-profile-bell"><FiBell /></span>
          <span className="student-profile-small-avatar">
            {profile?.user?.profileImage ? (
              <img src={profile.user.profileImage} alt="" />
            ) : initials[0]}
          </span>
          <span>
            <strong>{studentName}</strong>
            <small>
              {profile?.department?.code || "Student"}
              {profile?.semester ? ` (${currentYear})` : ""}
            </small>
          </span>
        </div>
      </div>

      <div className="student-profile-heading">
        <div>
          <div className="student-profile-breadcrumb">
            <Link to="/student">Dashboard</Link>
            <FiChevronRight />
            <span>Profile</span>
          </div>
          <h1>My Profile</h1>
          <p>View and manage your personal information</p>
        </div>
        <button
          className="student-profile-primary-button"
          type="button"
          onClick={() => {
            setEditing((value) => !value);
            setMessage("");
            setError("");
          }}
        >
          <FiEdit2 />
          {editing ? "Close Edit" : "Edit Profile"}
        </button>
      </div>

      {message && <div className="student-profile-alert success">{message}</div>}
      {error && <div className="student-profile-alert error">{error}</div>}

      <section className="student-profile-hero">
        <div className="student-profile-avatar-wrap">
          <div className="student-profile-avatar">
            {profile?.user?.profileImage ? (
              <img src={profile.user.profileImage} alt={`${studentName} profile`} />
            ) : (
              initials
            )}
          </div>
          <button
            type="button"
            className="student-profile-camera"
            aria-label="Edit profile photo URL"
            onClick={() => setEditing(true)}
          >
            <FiCamera />
          </button>
        </div>
        <div className="student-profile-hero-info">
          <h2>{studentName}</h2>
          <span className="student-profile-role">Student</span>
          <p>
            {profile?.department?.name || "Department not provided"}
            {profile?.semester ? ` · ${currentYear}` : ""}
          </p>
          <p>{profile?.department?.code || "SmartCampus"}</p>
          <div className="student-profile-hero-contact">
            <span><FiMail />{displayValue(profile?.user?.email)}</span>
            <span><FiPhone />{displayValue(profile?.user?.phone)}</span>
            <span><FiMapPin />{displayValue(profile?.address)}</span>
          </div>
          <em>“Learn today, build a better tomorrow.”</em>
        </div>
        <div className="student-profile-hero-decoration" aria-hidden="true">
          <span>Learn</span>
          <span>Grow</span>
          <span>Belong</span>
        </div>
      </section>

      <nav className="student-profile-tabs" aria-label="Profile sections">
        {navTabs.map(([id, label], index) => (
          <a className={index === 0 ? "active" : ""} href={`#${id}`} key={id}>
            {label}
          </a>
        ))}
      </nav>

      <div className="student-profile-content-grid">
        <section
          className="student-profile-card student-personal-card"
          id="personal-information"
        >
          <ProfileCardHeading icon={<FiUser />} title="Personal Information" />
          {editing ? (
            <form className="student-profile-form" onSubmit={handleSubmit}>
              <ProfileField label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
              <ProfileField label="Address" name="address" value={formData.address} onChange={handleChange} />
              <ProfileField label="Guardian Name" name="guardianName" value={formData.guardianName} onChange={handleChange} />
              <ProfileField label="Guardian Phone" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} />
              <ProfileField label="Profile Image URL" name="profileImage" value={formData.profileImage} onChange={handleChange} />
              <div className="student-profile-form-actions">
                <button type="button" onClick={() => setEditing(false)}>Cancel</button>
                <button className="student-profile-primary-button" disabled={saving} type="submit">
                  <FiCheck />{saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="student-profile-info-rows">
              <InfoRow label="Full Name" value={studentName} />
              <InfoRow label="Date of Birth" value={formatDate(profile?.dateOfBirth)} />
              <InfoRow label="Gender" value={profile?.gender} />
              <InfoRow label="Email Address" value={profile?.user?.email} />
              <InfoRow label="Phone Number" value={profile?.user?.phone} />
              <InfoRow label="Address" value={profile?.address} />
              <InfoRow label="Guardian Name" value={profile?.guardianName} />
              <InfoRow label="Guardian Phone" value={profile?.guardianPhone} />
            </div>
          )}
        </section>

        <div className="student-profile-right-column">
          <section className="student-profile-card" id="academic-details">
            <ProfileCardHeading
              icon={<FiBookOpen />}
              title="Profile Summary"
              action={
                <button
                  className="student-profile-icon-button"
                  type="button"
                  onClick={() => {
                    setEditing(true);
                    document.getElementById("personal-information")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  aria-label="Edit profile summary"
                >
                  <FiEdit2 />
                </button>
              }
            />
            <div className="student-profile-info-rows">
              <InfoRow label="Department" value={profile?.department?.name} />
              <InfoRow label="Year" value={currentYear} />
              <InfoRow label="Section" value={profile?.section} />
              <InfoRow label="Current Semester" value={profile?.semester ? `${profile.semester}${profile.semester === 1 ? "st" : profile.semester === 2 ? "nd" : profile.semester === 3 ? "rd" : "th"} Semester` : null} />
              <InfoRow label="Batch" value={profile?.batch} />
              <InfoRow label="Student Type" value={profile?.status === "active" ? "Regular" : profile?.status} />
              <InfoRow label="Admission Date" value={formatDate(profile?.admissionDate)} />
            </div>
          </section>

          <section className="student-profile-card" id="documents">
            <ProfileCardHeading icon={<FiFileText />} title="Student Identity" />
            <div className="student-profile-info-rows">
              <InfoRow label="Student ID" value={profile?.studentId} />
              <InfoRow label="Roll Number" value={profile?.rollNumber} />
              <InfoRow label="Registration Number" value={profile?.studentId} />
              <InfoRow label="Admission Date" value={formatDate(profile?.admissionDate)} />
            </div>
          </section>

          <section className="student-profile-card student-profile-contact-card">
            <ProfileCardHeading icon={<FiTrendingUp />} title="Academic Performance" action={<Link to="/student/results">View All <FiArrowRight /></Link>} />
            <div className="student-profile-performance-grid">
              <PerformanceStat value={academicStats.cgpa} label="CGPA" color="green" />
              <PerformanceStat value={`${academicStats.attendance}%`} label="Attendance" color="blue" />
              <PerformanceStat value={academicStats.backlogs} label="Backlogs" color="orange" />
              <PerformanceStat value={academicStats.sgpa} label="Latest SGPA" color="purple" />
            </div>
          </section>

          <section className="student-profile-card student-profile-contact-card" id="contact-details">
            <ProfileCardHeading icon={<FiUsers />} title="Emergency Contact" />
            <div className="student-profile-info-rows">
              <InfoRow label="Guardian" value={profile?.guardianName} />
              <InfoRow label="Phone" value={profile?.guardianPhone} />
            </div>
          </section>
        </div>

        <aside className="student-profile-aside">
          <section className="student-profile-card">
            <ProfileCardHeading icon={<FiAlertCircle />} title="Quick Actions" />
            <div className="student-profile-quick-actions">
              <button type="button" onClick={() => setEditing(true)}><FiEdit2 />Edit Profile</button>
              <Link to="/student/results"><FiLock />View Academic Records</Link>
              <button type="button" onClick={() => setEditing(true)}><FiCamera />Update Photo</button>
              <Link to="/student/attendance"><FiCalendar />View Attendance</Link>
              <Link to="/student/subjects"><FiBookOpen />View Subjects</Link>
            </div>
          </section>
          <blockquote className="student-profile-quote">
            <span>“</span>
            <p>Discipline today<br />leads to a brighter tomorrow.</p>
          </blockquote>
          <section className="student-profile-card student-profile-help">
            <ProfileCardHeading icon={<FiHelpCircle />} title="Need Help?" />
            <p>Facing an issue? Contact your student support team.</p>
            <a href="mailto:support@smartcampus.edu">Contact Support</a>
          </section>
        </aside>
      </div>

      <footer className="student-profile-footer" id="more-information">
        <span className="student-profile-footer-icon"><FiBookOpen /></span>
        <strong>Proud to be a part of {profile?.department?.name || "SmartCampus"}</strong>
        <span>Learn&nbsp; | &nbsp;Grow&nbsp; | &nbsp;Belong</span>
        <small>#SmartCampus</small>
      </footer>
    </div>
  );
};

const ProfileCardHeading = ({ icon, title, action }) => (
  <header className="student-profile-card-heading">
    <div><span>{icon}</span><h2>{title}</h2></div>
    {action}
  </header>
);

const InfoRow = ({ label, value }) => (
  <div className="student-profile-info-row">
    <span>{label}</span>
    <strong>{displayValue(value)}</strong>
  </div>
);

const ProfileField = ({ label, name, value, onChange }) => (
  <label className="student-profile-field">
    <span>{label}</span>
    <input name={name} value={value || ""} onChange={onChange} />
  </label>
);

const PerformanceStat = ({ value, label, color }) => (
  <div className={`student-performance-stat ${color}`}>
    <strong>{value}</strong>
    <span>{label}</span>
  </div>
);

export default Profile;
