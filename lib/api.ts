import { AuthResponse, User, Context, ChatMessage, ChatResponse, Document } from './types';
import axiosClient from './axiosClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper function to handle errors consistently
const handleApiError = (error: any) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    throw new Error(error.response.data?.message || 'Something went wrong');
  } else if (error.request) {
    // The request was made but no response was received
    throw new Error('No response from server. Please check your connection.');
  } else {
    // Something happened in setting up the request that triggered an Error
    throw new Error(error.message || 'Something went wrong');
  }
};


export const authAPI = {
  async signUp(
    email: string,
    password: string,
    fullName?: string
  ): Promise<AuthResponse> {
    try {
      const response = await axiosClient.post('/auth/signup', { 
        email, 
        password, 
        full_name: fullName 
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await axiosClient.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async getMe(): Promise<User> {
    try {
      const response = await axiosClient.get('/auth/me');
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await axiosClient.post('/auth/refresh', { 
        refresh_token: refreshToken 
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      await axiosClient.post('/auth/logout');
    } catch (error) {
      // Even if logout fails, we should still clear local storage
      console.error('Logout error:', error);
      throw error;
    }
  },

  getGoogleLoginUrl() {
    return `${API_URL}/auth/google`;
  },

  getGitHubLoginUrl() {
    return `${API_URL}/auth/github`;
  }
};

export const contextAPI = {
  async createContext(name: string, files: File[] = []): Promise<{ data: { context_id: string; processed_files: string[]; document_ids: string[] } }> {
    try {
      const formData = new FormData();
      formData.append('name', name);
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await axiosClient.post('/contexts/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async getContexts(): Promise<Context[]> {
    try {
      const response = await axiosClient.get('/contexts/');
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async getContext(id: string): Promise<Context> {
    try {
      const response = await axiosClient.get(`/contexts/${id}/`);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async uploadFiles(contextId: string, files: File[]): Promise<any> {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await axiosClient.post(`/contexts/${contextId}/upload/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async getDocuments(contextId: string): Promise<Document[]> {
    try {
      const response = await axiosClient.get(`/contexts/${contextId}/documents/`);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }
};

export const chatAPI = {
  async sendMessage(contextId: string, message: string): Promise<ChatResponse> {
    try {
      const response = await axiosClient.post(`/chat/${contextId}`, { message });
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async getChatHistory(contextId: string): Promise<ChatMessage[]> {
    try {
      const response = await axiosClient.get(`/chat/${contextId}/history`);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }
};
