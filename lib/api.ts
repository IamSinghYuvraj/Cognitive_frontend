import axios from 'axios';
import { useAuthStore } from './auth-store';
import { AuthResponse, Context, ChatMessage, ChatResponse, CreateContextRequest } from './types';

const RAW_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const BASE_URL = `${RAW_BASE.replace(/\/$/, '')}/api`;

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // allow sending cookies (for HttpOnly refresh token flows)
  withCredentials: true,
});

// authClient does not use the interceptors attached to `api` and is used for refresh calls
const authClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
// Helper to get current access token (in-memory) and log
const getAccessToken = () => {
  return useAuthStore.getState().token;
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
    console.log(`Token sent with request: ${token}`);
  } else {
    console.log('No access token present for request');
  }
  return config;
});

// Response interceptor to handle auth errors
// Refresh flow state
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  // if already refreshing, return the existing promise
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async (): Promise<string | null> => {
    try {
      // Prefer cookie-based refresh: call refresh endpoint with credentials (HttpOnly cookie)
      console.log('Attempting token refresh via cookie (withCredentials)');
      let resp;
      try {
        resp = await authClient.post('/auth/refresh', null, { withCredentials: true });
      } catch (cookieErr) {
        // cookie refresh failed; try refresh token from storage as fallback
        console.warn('Cookie-based refresh failed, falling back to token-from-storage', cookieErr);
        let refreshToken: string | null = null;
        try {
          refreshToken = localStorage.getItem('refresh_token');
        } catch (e) {
          // ignore
        }
        if (!refreshToken) {
          refreshToken = useAuthStore.getState().refreshToken;
        }
        if (!refreshToken) throw new Error('No refresh token available');
        resp = await authClient.post('/auth/refresh', { refresh_token: refreshToken });
      }

      const newAccess = resp.data?.access_token;
      const newRefresh = resp.data?.refresh_token ?? useAuthStore.getState().refreshToken;

      if (!newAccess) throw new Error('Refresh response did not include new access token');

      // update in-memory access token and persisted refresh token (if provided)
      useAuthStore.getState().setAccessToken(newAccess);
      try {
        if (newRefresh) localStorage.setItem('refresh_token', newRefresh);
      } catch (e) {}

      console.log('Token refresh successful');
      return newAccess;
    } catch (err) {
      console.warn('Token refresh failed', err);
      // clear auth and redirect to login
      useAuthStore.getState().clearAuth();
      try {
        localStorage.removeItem('refresh_token');
      } catch (e) {}
      window.location.href = '/login';
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newAccess = await refreshAccessToken();
        if (newAccess) {
          // set authorization header and retry
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          console.log('Retrying original request with new access token');
          return api(originalRequest);
        }
      } catch (e) {
        // fallthrough to rejection
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string): Promise<{ data: AuthResponse }> =>
    api.post('/auth/login', { email, password }),
  
  signup: (username: string, email: string, password: string): Promise<{ data: AuthResponse }> =>
    api.post('/auth/signup', { username, email, password }),
};

// Context API
export const contextAPI = {
  getContexts: (): Promise<{ data: Context[] }> =>
    api.get('/contexts/').then((res) => {
      try {
        console.log('Received contexts data:', res.data);
      } catch (e) {}
      return res;
    }),
  
  getContext: (contextId: string): Promise<{ data: Context }> =>
    api.get(`/contexts/${contextId}`).then((res) => {
      try {
        console.log('Received context data:', res.data);
      } catch (e) {}
      return res;
    }),
  
  createContext: (data: CreateContextRequest): Promise<{ data: Context }> => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('file', data.file);
    
    return api.post('/contexts/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  deleteContext: (contextId: string): Promise<void> =>
    api.delete(`/contexts/${contextId}`),
};

// Chat API
export const chatAPI = {
  sendMessage: (
    contextId: string, 
    query: string, 
    chatHistory: ChatMessage[]
  ): Promise<{ data: ChatResponse }> =>
    api.post(`/chat/${contextId}`, {
      query,
      chat_history: chatHistory,
    }),
};