import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiUser,
  FiUsers,
  FiShield,
} from "react-icons/fi";
import { FaGraduationCap, FaGoogle, FaMicrosoft } from "react-icons/fa";
import "./Login.css";

const roleConfig = {
  student: {
    title: "Student Login",
    description:
      "Access your student dashboard to manage your academic journey.",
    label: "Email or Roll Number",
    placeholder: "Enter your email or roll number",
  },

  faculty: {
    title: "Faculty Login",
    description:
      "Access your faculty dashboard to manage classes, track students, and more.",
    label: "Faculty ID / Email",
    placeholder: "Enter your faculty ID or email",
  },

  admin: {
    title: "Admin Login",
    description:
      "Secure access to the SmartCampus Admin Portal.",
    label: "Admin ID / Email",
    placeholder: "Enter your admin ID or email",
  },
};

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const config = roleConfig[role];

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email/ID and password.");
      return;
    }

    try {
      setLoading(true);

      const loggedInUser = await login(email.trim(), password);

      /*
       * Verify that the selected login portal matches
       * the role returned by the backend.
       */
      const resolvedRole = loggedInUser?.user?.role || loggedInUser?.role;
      if (resolvedRole && resolvedRole !== role) {
        setError(
          `This account belongs to the ${resolvedRole} portal.`
        );
        return;
      }

      if (rememberMe) {
        localStorage.setItem("smartcampus_remember", "true");
      } else {
        localStorage.removeItem("smartcampus_remember");
      }

      const targetRole = resolvedRole || role;
      if (targetRole === "student") {
        navigate("/student");
      } else if (targetRole === "faculty") {
        navigate("/faculty");
      } else {
        navigate("/admin");
      }
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Invalid email/ID or password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError("Google login will be available after OAuth is configured.");
  };

  const handleMicrosoftLogin = () => {
    setError(
      "Microsoft login will be available after OAuth is configured."
    );
  };

  return (
    <div className="login-page">
      {/* Top navigation */}
      <div className="login-topbar">
        {role === "student" && (
          <>
            <span>Need an account?</span>
            <button
              className="top-register-btn"
              onClick={() =>
                setError(
                  "Student accounts are provisioned by your campus administrator."
                )
              }
            >
              Contact Admin
            </button>
          </>
        )}

        {role === "faculty" && (
          <>
            <span>New to SmartCampus?</span>
            <button
              className="top-register-btn"
              onClick={() =>
                setError("Please contact the SmartCampus administrator.")
              }
            >
              Contact Admin
            </button>
          </>
        )}

        {role === "admin" && (
          <>
            <span>Not an admin?</span>

            <button
              className="top-register-btn"
              onClick={() => handleRoleChange("student")}
            >
              Student Login
            </button>

            <button
              className="top-register-btn"
              onClick={() => handleRoleChange("faculty")}
            >
              Faculty Login
            </button>
          </>
        )}
      </div>

      {/* Login card */}
      <div className="login-card">
        {/* Logo */}
        <div className="brand-section">
          <div className="brand-icon">
            <FaGraduationCap />
          </div>

          <h1>
            <span className="brand-smart">Smart</span>
            <span className="brand-campus">Campus</span>
          </h1>

          <h2>{config.title}</h2>

          <p>{config.description}</p>
        </div>

        {/* Role selector */}
        <div className="role-selector">
          <button
            type="button"
            className={`role-btn ${
              role === "student" ? "active" : ""
            }`}
            onClick={() => handleRoleChange("student")}
          >
            <span className="role-icon">
              <FiUser />
            </span>
            Student
          </button>

          <button
            type="button"
            className={`role-btn ${
              role === "faculty" ? "active" : ""
            }`}
            onClick={() => handleRoleChange("faculty")}
          >
            <span className="role-icon">
              <FiUsers />
            </span>
            Faculty
          </button>

          <button
            type="button"
            className={`role-btn ${
              role === "admin" ? "active" : ""
            }`}
            onClick={() => handleRoleChange("admin")}
          >
            <span className="role-icon">
              <FiShield />
            </span>
            Admin
          </button>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>{config.label}</label>

            <div className="input-wrapper">
              <span className="input-icon" aria-hidden="true">
                <FiMail />
              </span>

              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={config.placeholder}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>

            <div className="input-wrapper">
              <span className="input-icon" aria-hidden="true">
                <FiLock />
              </span>

              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className="login-options">
            <label className="remember-option">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) =>
                  setRememberMe(e.target.checked)
                }
              />

              <span>Remember me</span>
            </label>

            <button
              type="button"
              className="forgot-password"
              onClick={() =>
                setError(
                  "Password reset will be available after the reset service is configured."
                )
              }
            >
              Forgot password?
            </button>
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* OR */}
        <div className="divider">
          <span></span>
          <strong>OR</strong>
          <span></span>
        </div>

        {/* Social login */}
        <div className="social-login">
          <button
            type="button"
            className="social-btn"
            onClick={handleGoogleLogin}
          >
            <span className="google-icon">
              <FaGoogle />
            </span>
            Continue with Google
          </button>

          <button
            type="button"
            className="social-btn"
            onClick={handleMicrosoftLogin}
          >
            <span className="microsoft-icon">
              <FaMicrosoft />
            </span>
            Continue with Microsoft
          </button>
        </div>

        {/* Bottom link */}
        <div className="login-bottom">
          {role === "student" && (
            <>
              <span>New student?</span>
              <button
                type="button"
                onClick={() =>
                  setError(
                    "Student accounts are provisioned by your campus administrator."
                  )
                }
              >
                Contact Admin
              </button>
            </>
          )}

          {role === "faculty" && (
            <>
              <span>New to SmartCampus?</span>
              <button
                type="button"
                onClick={() =>
                  setError(
                    "Please contact the SmartCampus administrator."
                  )
                }
              >
                Contact Admin
              </button>
            </>
          )}

          {role === "admin" && (
            <>
              <span>A Connected Campus.</span>
              <span>A Stronger Community.</span>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="login-footer">
        <span>Privacy Policy</span>
        <span>|</span>
        <span>Terms of Service</span>
        <span>|</span>
        <span>Contact Us</span>
      </div>
    </div>
  );
};

export default Login;