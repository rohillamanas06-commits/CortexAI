import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, type User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, fullName?: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved auth state
    const savedToken = localStorage.getItem('cortex-token');
    const savedUser = localStorage.getItem('cortex-user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      
      const userData: User = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        full_name: response.user.full_name,
      };
      
      setUser(userData);
      setToken(response.token);
      localStorage.setItem('cortex-token', response.token);
      localStorage.setItem('cortex-user', JSON.stringify(userData));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string, fullName?: string) => {
    try {
      const response = await authAPI.register(username, email, password, fullName);
      
      const userData: User = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        full_name: response.user.full_name,
      };
      
      setUser(userData);
      setToken(response.token);
      localStorage.setItem('cortex-token', response.token);
      localStorage.setItem('cortex-user', JSON.stringify(userData));
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const loginWithGoogle = async (credential: string) => {
    try {
      const response = await authAPI.googleLogin(credential);
      
      const userData: User = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        full_name: response.user.full_name,
      };
      
      setUser(userData);
      setToken(response.token);
      localStorage.setItem('cortex-token', response.token);
      localStorage.setItem('cortex-user', JSON.stringify(userData));
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    // Clear local state immediately for fast logout
    setUser(null);
    setToken(null);
    localStorage.removeItem('cortex-token');
    localStorage.removeItem('cortex-user');
    
    // Call backend logout in background (don't wait)
    authAPI.logout().catch(error => {
      console.error('Logout error:', error);
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
