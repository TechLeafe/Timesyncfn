
import axios from "axios";
import {
  startGlobalLoading,
  stopGlobalLoading,
} from "./globalLoader";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api/",
  //baseURL: "https://time-sync-backend-4452.onrender.com/api/",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

let redirectingToLogin = false;

// REQUEST INTERCEPTOR
axiosInstance.interceptors.request.use(
  (config) => {
    startGlobalLoading();

    const token = localStorage.getItem("token");

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    stopGlobalLoading();
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR
axiosInstance.interceptors.response.use(
  (response) => {
    stopGlobalLoading();
    return response;
  },
  (error) => {
    stopGlobalLoading();

    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        console.warn(
          "Unauthorized / Token Expired:",
          data?.message || "401 Error"
        );

        if (
          [
            "Authorization token is required",
            "Invalid authorization format. Use Bearer token",
            "Token has expired. Please login again",
            "Invalid token",
          ].includes(data?.message)
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("loggedInUser");
          localStorage.removeItem("employeeLoginSession");
          sessionStorage.clear();

          if (
            !redirectingToLogin &&
            window.location.pathname !== "/login"
          ) {
            redirectingToLogin = true;
            window.location.replace("/login");
          }
        }
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
        "Network error: Server is unreachable.",
        error.message
      );
    } else {
      console.error("Error setting up request:", error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
