import { api } from '../apiClient';

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

const authAPI = {
  // Email/Password Authentication
  signup: async (data: SignupData) => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },
  
  login: async (data: LoginData): Promise<TokenPair> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  // OAuth Authentication
  getOAuthUrl: (provider: 'google' | 'github') => {
    return `http://localhost:8000/api/auth/oauth/login/${provider}`;
  },

  // Token Management
  refreshToken: async (refreshToken: string): Promise<TokenPair> => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },

  logout: async (refreshToken: string) => {
    try {
      await api.post('/auth/logout', { refresh_token: refreshToken });
    } finally {
      // Always clear tokens from client-side storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }
  },

  // User Management
  getCurrentUser: async (accessToken: string) => {
    const response = await api.get('/auth/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response.data;
  },

  // Token Storage
  storeTokens: (tokens: TokenPair) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token);
    }
  },

  clearTokens: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },

  getStoredTokens: (): { accessToken: string | null; refreshToken: string | null } => {
    if (typeof window === 'undefined') {
      return { accessToken: null, refreshToken: null };
    }
    return {
      accessToken: localStorage.getItem('access_token'),
      refreshToken: localStorage.getItem('refresh_token')
    };
  }
};

export default authAPI;
