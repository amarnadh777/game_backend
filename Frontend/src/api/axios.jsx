import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

let isLoggingOut = false; // Lock to prevent multiple popups

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => response,

  (error) => {
    // If we are already showing the logout card, just reject the promise
    if (isLoggingOut) {
      return Promise.reject(error);
    }

    // Account Disabled
    if (
      error.response?.status === 403 &&
      error.response?.data?.errorCode === "ACCOUNT_DISABLED"
    ) {
      isLoggingOut = true; // Lock it so it doesn't trigger multiple times
      
      // ONLY dispatch the event. 
      // Do NOT remove the token here, or the app will instantly redirect!
      window.dispatchEvent(new Event("accountDisabled"));
      
      return Promise.reject(error);
    }

    // Unauthorized (Standard Token Expiry)
    if (error.response?.status === 401) {
      isLoggingOut = true;
      localStorage.removeItem("token");
      localStorage.removeItem("adminUser");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;