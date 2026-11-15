import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export const resolveApiAssetUrl = (url) => {
  if (!url) return "";
  if (/^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(url) || url.startsWith("data:")) {
    return url;
  }
  return `${API_ORIGIN}/${url.replace(/^\/+/, "")}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle common API errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    return Promise.reject(error);
  }
);

export default api;
