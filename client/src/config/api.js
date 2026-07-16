import axios from "axios";

// Environment variable VITE_API_URL or defaults to localhost in dev / Render URL in prod
export const API_BASE = import.meta.env.VITE_API_URL || "https://talkflow-backend-k286.onrender.com";

// Pre-configured Axios instance with Authorization header attached automatically
export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
