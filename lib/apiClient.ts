import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Store refresh callback - will be set by AuthContext
let refreshTokenCallback: (() => Promise<string | null>) | null = null;

// Export function to set refresh callback (called by AuthContext)
export const setRefreshTokenCallback = (callback: () => Promise<string | null>) => {
  refreshTokenCallback = callback;
};

// Create a base API client
const createApiClient = () => {
  const instance = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    (config) => {
      // Get access token from localStorage (primary source of truth)
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      
      // Add token to Authorization header if available
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor to handle token refresh on 401 errors
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
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
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          
          // Retry the original request with the new token
          return instance(originalRequest);
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

  return instance;
};

// Create the API client instance
export const api = createApiClient();

export default api;
