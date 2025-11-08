'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { setRefreshTokenCallback } from '@/lib/apiClient';
import { setAxiosRefreshTokenCallback } from '@/lib/axiosClient';
import { setChatStreamRefreshCallback } from '@/lib/chat-stream';

type User = {
  id: string;
  email: string;
  name: string;
  role?: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  refreshAccessToken: () => Promise<string | null>;
};

// Global token store for API client access
// This allows the apiClient to access the current access token
let globalAccessToken: string | null = null;

// Export function to get current access token (used by apiClient)
export const getAccessToken = () => globalAccessToken;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const refreshTokenRef = useRef<string | null>(null);
  const isRefreshingRef = useRef(false);

  // Update global token store when accessToken changes
  useEffect(() => {
    globalAccessToken = accessToken;
  }, [accessToken]);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for refreshToken in localStorage (primary key)
        const storedRefreshToken = localStorage.getItem('refreshToken') || localStorage.getItem('refresh_token');
        
        if (storedRefreshToken) {
          refreshTokenRef.current = storedRefreshToken;
          // Try to refresh the access token
          try {
            const refreshToken = refreshTokenRef.current;
            if (!refreshToken) {
              setLoading(false);
              return;
            }

            isRefreshingRef.current = true;
            const response = await axios.post(`${API_URL}/api/auth/refresh`, {
              refresh_token: refreshToken
            });
            
            const { access_token, refresh_token: newRefreshToken } = response.data;
            
            // Update tokens in state and localStorage
            setAccessTokenState(access_token);
            globalAccessToken = access_token;
            localStorage.setItem('accessToken', access_token);
            
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
              refreshTokenRef.current = newRefreshToken;
            }
            
            // Fetch user data with new token
            await fetchUserData(access_token);
          } catch (error) {
            console.error('Failed to refresh token on init:', error);
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('access_token');
            refreshTokenRef.current = null;
          } finally {
            isRefreshingRef.current = false;
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('refresh_token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserData = async (token: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser({
        id: response.data.id || response.data.user_id,
        email: response.data.email,
        name: response.data.name || response.data.full_name,
        role: response.data.role
      });
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      throw error;
    }
  };

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    // Prevent multiple simultaneous refresh attempts
    if (isRefreshingRef.current) {
      // Wait for the ongoing refresh to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!isRefreshingRef.current) {
            clearInterval(checkInterval);
            resolve(globalAccessToken);
          }
        }, 100);
      });
    }

    const refreshToken = refreshTokenRef.current || localStorage.getItem('refreshToken') || localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      return null;
    }

    isRefreshingRef.current = true;

    try {
      const response = await axios.post(`${API_URL}/api/auth/refresh`, {
        refresh_token: refreshToken
      });
      
      const { access_token, refresh_token: newRefreshToken } = response.data;
      
      // Update tokens in state and localStorage
      setAccessTokenState(access_token);
      globalAccessToken = access_token;
      localStorage.setItem('accessToken', access_token);
      
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
        refreshTokenRef.current = newRefreshToken;
      }
      
      return access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear tokens on refresh failure
      setAccessTokenState(null);
      globalAccessToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('refresh_token');
      refreshTokenRef.current = null;
      return null;
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  // Register refresh callback with all API clients
  useEffect(() => {
    setRefreshTokenCallback(refreshAccessToken);
    setAxiosRefreshTokenCallback(refreshAccessToken);
    setChatStreamRefreshCallback(refreshAccessToken);
  }, [refreshAccessToken]);

  const login = async (newAccessToken: string, newRefreshToken: string) => {
    // Store both tokens in localStorage (primary keys)
    localStorage.setItem('accessToken', newAccessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    refreshTokenRef.current = newRefreshToken;
    
    // Also update state for React components
    setAccessTokenState(newAccessToken);
    globalAccessToken = newAccessToken;
    
    try {
      // Fetch user data
      await fetchUserData(newAccessToken);
    } catch (error) {
      console.error('Failed to fetch user data after login:', error);
      // Clear tokens on error
      setAccessTokenState(null);
      globalAccessToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      refreshTokenRef.current = null;
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = refreshTokenRef.current || localStorage.getItem('refreshToken') || localStorage.getItem('refresh_token');
      if (refreshToken) {
        await axios.post(`${API_URL}/api/auth/logout`, {
          refresh_token: refreshToken
        });
      }
    } catch (error) {
      console.error('Error during logout API call:', error);
      // Continue with frontend cleanup even if API call fails
    } finally {
      // Always clear tokens and state (frontend cleanup)
      setAccessTokenState(null);
      globalAccessToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      // Also clear legacy keys if they exist
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      refreshTokenRef.current = null;
      setUser(null);
      router.push('/login');
    }
  };

  const value = {
    isAuthenticated: !!accessToken,
    user,
    accessToken,
    login,
    logout,
    loading,
    refreshAccessToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
