import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

const isAuthenticatedUser = (user) =>
  user &&
  typeof user.id === "string" &&
  typeof user.name === "string" &&
  typeof user.email === "string" &&
  ["student", "faculty", "admin"].includes(user.role);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const token = localStorage.getItem("token");

    const restoreSession = async () => {
      if (!token) {
        localStorage.removeItem("user");
        if (active) {
          setLoading(false);
        }
        return;
      }

      try {
        const response = await api.get("/auth/me", {
          signal: controller.signal,
        });
        const currentUser = response.data?.user;

        if (!isAuthenticatedUser(currentUser)) {
          throw new Error("The server returned an invalid session user.");
        }

        if (active) {
          setUser(currentUser);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          console.error("Could not validate the saved session:", error);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }

    };

    restoreSession();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const login = async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const { token, user: authenticatedUser } = response.data;
    if (typeof token !== "string" || !token || !isAuthenticatedUser(authenticatedUser)) {
      throw new Error("The server returned an invalid login response.");
    }

    localStorage.setItem("token", token);
    localStorage.removeItem("user");
    setUser(authenticatedUser);

    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};