import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

console.log("[Skill Cetamol] API Base URL:", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request Logger
api.interceptors.request.use(
  (config) => {
    console.log("[API Request]", {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      data: config.data,
    });

    const token =
      localStorage.getItem("exam_token") ||
      localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Logger & Auth Interceptor
api.interceptors.response.use(
  (response) => {
    console.log("[API Response]", {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });

    return response;
  },
  (error) => {
    const status = error.response?.status;
    const msg = typeof error.response?.data === 'string'
      ? error.response.data
      : (error.response?.data?.message || '');

    console.error("[API Error]", {
      status,
      url: error.config?.url,
      message: error.response?.data || error.message,
    });

    // Handle expired or invalid credentials
    const isAuthExpired =
      status === 401 ||
      (status === 403 && (
        typeof msg === 'string' && (
          msg.toLowerCase().includes('token') ||
          msg.toLowerCase().includes('expired') ||
          msg.toLowerCase().includes('invalid') ||
          msg.toLowerCase().includes('unauthorized')
        )
      ));

    if (isAuthExpired) {
      localStorage.removeItem("exam_token");
      localStorage.removeItem("token");
      localStorage.removeItem("exam_current_user");

      const path = window.location.pathname;
      if (!path.includes('/login') && !path.includes('/reset-password')) {
        window.location.href = '/login?expired=true';
      }
    }

    return Promise.reject(error);
  }
);

export default api;