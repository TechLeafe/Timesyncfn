import axios from "axios";

const axiosInstance = axios.create({
  // baseURL: "http://localhost:5000/api/",
  baseURL: "https://time-sync-backend-4452.onrender.com/api/",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        console.warn("Unauthorized / Token Expired:", data?.message || "401 Error");
      }

      if (status === 403) {
        console.error("Access forbidden:", data?.message || "Forbidden");
      }

      if (status >= 500) {
        console.error("Server Error:", data?.message || "Internal Server Error");
      }
    } else if (error.request) {
      console.error("Network error: Server is unreachable.", error.message);
    } else {
      console.error("Error setting up request:", error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;