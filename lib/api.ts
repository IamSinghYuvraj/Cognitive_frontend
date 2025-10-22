import apiClient from './apiClient';
import { AuthResponse, Context, ChatMessage, CreateContextRequest, User, UploadResponse } from './types';

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

  createContext: (data: CreateContextRequest): Promise<{ data: UploadResponse }> => {
    const formData = new FormData();
    formData.append('context_name', data.name);
    // Backend expects one or more files under the 'files' field (not 'files[]')
    data.files.forEach((file) => {
      formData.append('files', file);
    });

    return apiClient.post('/documents/upload', formData, {
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
    apiClient.delete(`/chat/clear/${contextId}`),
};