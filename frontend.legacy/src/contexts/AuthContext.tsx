import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin' | 'pending';
  title?: string;
  avatar?: string;
  isAvailableForCall?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await api.get('/users/me');
          const normalized = { ...response.data, role: (response.data.role || '').toString().toLowerCase() };
          setUser(normalized);
        }
      } catch (error: any) {
        // If the endpoint is not applicable (e.g., on admin-only flows), ignore 404
        if (error?.response?.status !== 404) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/users/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await api.post('/users/register', { name, email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    setUser(user);
  };

  const updateProfile = async (data: Partial<User>) => {
    const response = await api.put(`/users/${user?.id}`, data);
    setUser(response.data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
        updateProfile,
      }}
    >
      {children}
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