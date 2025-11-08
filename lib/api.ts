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
  async createContext(name: string, files: File[] = []): Promise<{ id: string; name: string; user_id: string; created_at: string; context_id: string }> {
    try {
      const formData = new FormData();
      formData.append('name', name);
      files.forEach(file => {
        formData.append('file', file); // Note: backend expects 'file' not 'files'
      });

      const response = await axiosClient.post('/contexts/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Log the response for debugging
      console.log('API Response Data:', response.data);
      
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async getContexts(): Promise<Context[]> {
    try {
      console.log('Making API call to GET /api/contexts/');
      const response = await axiosClient.get('/contexts/');
      console.log('Raw API response:', response);
      console.log('Response data:', response.data);
      
      // Ensure document_count is set for each context (default to 0 if not provided)
      const contexts = Array.isArray(response.data) 
        ? response.data.map((ctx: any) => ({
            ...ctx,
            document_count: ctx.document_count ?? 0
          }))
        : [];
      
      console.log('Processed contexts:', contexts);
      return contexts;
    } catch (error) {
      console.error('Error in getContexts API call:', error);
      handleApiError(error);
      throw error;
    }
  },

  async getContext(id: string): Promise<Context> {
    try {
      console.log('Fetching context:', id);
      const response = await axiosClient.get(`/contexts/${id}/`);
      console.log('Context API response:', response.data);
      
      // Ensure document_count is set
      const context = {
        ...response.data,
        document_count: response.data.document_count ?? 0,
      };
      
      return context;
    } catch (error) {
      console.error('Error fetching context:', error);
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
      console.log('Fetching chat history for context:', contextId);
      // Try both endpoint formats for compatibility
      let response;
      try {
        response = await axiosClient.get(`/chat/history/${contextId}`);
      } catch (err: any) {
        // Fallback to alternative endpoint format
        if (err.response?.status === 404) {
          response = await axiosClient.get(`/chat/${contextId}/history`);
        } else {
          throw err;
        }
      }
      
      console.log('Chat history API response:', response.data);
      
      // Ensure we return an array
      const history = Array.isArray(response.data) ? response.data : [];
      console.log('Returning chat history:', history);
      return history;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      handleApiError(error);
      throw error;
    }
  },

  async clearChatHistory(contextId: string): Promise<void> {
    try {
      await axiosClient.delete(`/chat/${contextId}/clear`);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }
};
