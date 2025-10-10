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
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (username: string, password: string): Promise<{ data: AuthResponse }> => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    return api.post('/auth/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },
  
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