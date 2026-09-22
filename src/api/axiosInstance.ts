import axios from "axios";
 
// 1. Create Axios Instance
const axiosInstance = axios.create({
  baseURL: "http://192.168.1.41:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
});
 
// 2. Request Interceptor: Attach Authorization Bearer Header Automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
 
    if (token) {
      // Attach the JWT Bearer token to all outgoing requests
      config.headers.Authorization = `Bearer ${token}`;
    }
 
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
 
// 3. Response Interceptor: Handle Unauthorized (401) & Global API Errors
axiosInstance.interceptors.response.use(
  (response) => {
    // Return successful responses directly
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
 
      // Handle 401 Unauthorized
      if (status === 401) {
        console.warn("Unauthorized / Token Expired:", data?.message || "401 Error");
 
        // Optional: Redirect to login or handle session cleanup when appropriate
        // localStorage.removeItem("token");
        // localStorage.removeItem("user");
        // window.location.href = "/login";
      }
 
      // Handle 403 Forbidden
      if (status === 403) {
        console.error("Access forbidden:", data?.message || "Forbidden");
      }
 
      // Handle 500 Internal Server Errors
      if (status >= 500) {
        console.error("Server Error:", data?.message || "Internal Server Error");
      }
    } else if (error.request) {
      // Network error / Server unreachable
      console.error("Network error: Server is unreachable.", error.message);
    } else {
      console.error("Error setting up request:", error.message);
    }
 
    return Promise.reject(error);
  }
);
 
export default axiosInstance;