import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://192.168.1.16:5000/api",

  headers: {
    "Content-Type": "application/json",
  },

  timeout: 10000,
});

// Add token automatically for every request
axiosInstance.interceptors.request.use(
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

// Handle response errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      console.log("Session expired or unauthorized");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;