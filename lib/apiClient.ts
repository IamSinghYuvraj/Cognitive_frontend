import axios from 'axios';
import { useAuthStore } from './auth-store';

const apiClient = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api',
});

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      const { refreshToken, setAuth, clearAuth } = useAuthStore.getState();

      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${apiClient.defaults.baseURL}/auth/refresh`,
            { refresh_token: refreshToken }
          );
          const { access_token: newAccessToken, refresh_token: newRefreshToken, user } = data;
          setAuth(newAccessToken, newRefreshToken, user);
          
          // Retry the original request with the new token
          error.config.headers.Authorization = `Bearer ${newAccessToken}`;
          return axios(error.config);
        } catch (refreshError) {
          console.error('Token refresh failed', refreshError);
          clearAuth();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        clearAuth();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
