import apiClient from './apiClient';
import { AuthResponse, Context, ChatMessage, CreateContextRequest, User } from './types';

// Auth API
export const authAPI = {
  login: (email: string, password: string): Promise<{ data: AuthResponse }> =>
    apiClient.post('/auth/login', { email, password }),

  signup: (email: string, password: string, fullName: string): Promise<{ data: User }> =>
    apiClient.post('/auth/signup', { email, password, full_name: fullName }),

  logout: (refreshToken: string): Promise<void> =>
    apiClient.post('/auth/logout', { refresh_token: refreshToken }),
};

// Context API
export const contextAPI = {
  getContexts: (): Promise<{ data: Context[] }> => apiClient.get('/contexts/'),

  getContext: (contextId: string): Promise<{ data: Context }> =>
    apiClient.get(`/contexts/${contextId}`),

  createContext: (data: CreateContextRequest): Promise<{ data: Context }> => {
    const formData = new FormData();
    formData.append('name', data.name);
    // Backend expects one or more files under the 'files' field
    formData.append('files', data.file);

    return apiClient.post('/contexts/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteContext: (contextId: string): Promise<void> =>
    apiClient.delete(`/contexts/${contextId}`),
};

// Chat API
export const chatAPI = {
  getChatHistory: (contextId: string): Promise<{ data: ChatMessage[] }> =>
    apiClient.get(`/chat/history/${contextId}`),

  clearChatHistory: (contextId: string): Promise<void> =>
    apiClient.delete(`/chat/${contextId}/clear`),
};