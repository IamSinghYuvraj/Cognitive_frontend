import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create an axios instance with default config
const axiosClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get the token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    // If token exists, add it to the Authorization header
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors (e.g., 401 Unauthorized)
    if (error.response?.status === 401) {
      // You might want to handle token expiration here
      console.error('Authentication error - please log in again');
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
