import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Store refresh callback - will be set by AuthContext
let refreshTokenCallback: (() => Promise<string | null>) | null = null;

// Export function to set refresh callback (called by AuthContext)
export const setAxiosRefreshTokenCallback = (callback: () => Promise<string | null>) => {
  refreshTokenCallback = callback;
};

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
    // Get access token from localStorage (primary source of truth)
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

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

// Add response interceptor to handle token refresh on 401 errors
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // If error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Use the refresh callback from AuthContext
        if (!refreshTokenCallback) {
          throw new Error('No refresh token callback available');
        }
        
        const newAccessToken = await refreshTokenCallback();
        
        if (!newAccessToken) {
          // Refresh failed, clear tokens and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
        
        // Update the Authorization header with new token
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // Retry the original request with the new token
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;
