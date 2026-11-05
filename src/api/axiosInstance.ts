
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api/",

  headers: {
    "Content-Type": "application/json",
  },

  timeout: 10000,
});

// REQUEST INTERCEPTOR
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

// RESPONSE INTERCEPTOR
axiosInstance.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        console.warn(
          "Unauthorized:",
          data?.message || "401 Error"
        );
      }

      if (status === 403) {
        console.error(
          "Access forbidden:",
          data?.message || "Forbidden"
        );
      }

      if (status >= 500) {
        console.error(
          "Server Error:",
          data?.message || "Internal Server Error"
        );
      }
    } else if (error.request) {
      console.error(
        "Network error:",
        error.message
      );
    } else {
      console.error(
        "Request error:",
        error.message
      );
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
