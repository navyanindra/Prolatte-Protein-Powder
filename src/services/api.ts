import axios, { AxiosHeaders } from "axios";

// Auto-detect API URL based on environment
const getApiUrl = () => {
  // If we have an explicit env var, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // If we're on the deployed domain, use relative API path
  if (typeof window !== 'undefined' && window.location.hostname === 'healthfirstlifesciences.com') {
    return 'https://healthfirstlifesciences.com/api';
  }
  
  // Default to localhost for development
  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getApiUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

export default api;
