import { AuthResponse, User, Context, ChatMessage, ChatResponse, Document } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Something went wrong');
  }
  return response.json();
}

export const authAPI = {
  async signUp(
    email: string,
    password: string,
    fullName?: string
  ): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    return handleResponse<AuthResponse>(response);
  },

  async login(
    email: string,
    password: string
  ): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<AuthResponse>(response);
  },

  async getMe(token: string): Promise<User> {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<User>(response);
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    return handleResponse<AuthResponse>(response);
  },

  async logout(token: string): Promise<void> {
      await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
              Authorization: `Bearer ${token}`,
          },
      });
  },

  getGoogleLoginUrl() {
    return `${API_URL}/api/auth/google`;
  },

  getGitHubLoginUrl() {
    return `${API_URL}/api/auth/github`;
  }
};

export const contextAPI = {
  async createContext(name: string, token: string): Promise<Context> {
    const response = await fetch(`${API_URL}/api/contexts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });
    return handleResponse<Context>(response);
  },

  async getContexts(token: string): Promise<Context[]> {
    const response = await fetch(`${API_URL}/api/contexts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<Context[]>(response);
  },

  async getContext(id: string, token: string): Promise<Context> {
    const response = await fetch(`${API_URL}/api/contexts/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse<Context>(response);
  },

  async uploadFiles(contextId: string, files: File[], token: string): Promise<any> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_URL}/api/contexts/${contextId}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    return handleResponse<any>(response);
  },

  async getDocuments(contextId: string, token: string): Promise<Document[]> {
    const response = await fetch(`${API_URL}/api/contexts/${contextId}/documents`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return handleResponse<Document[]>(response);
  }
};

export const chatAPI = {
  async sendMessage(contextId: string, message: string, token: string): Promise<ChatResponse> {
    const response = await fetch(`${API_URL}/api/chat/${contextId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });
    return handleResponse<ChatResponse>(response);
  },

  async getChatHistory(contextId: string, token: string): Promise<ChatMessage[]> {
    const response = await fetch(`${API_URL}/api/chat/${contextId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return handleResponse<ChatMessage[]>(response);
  }
};
