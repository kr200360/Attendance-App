import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser, UserRole } from '@school/shared-types';
import { api } from '../api/client';

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  isLoading: boolean;
  login: (tokens: { accessToken: string; refreshToken: string; user: IUser }) => void;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('edutrack_access_token');
    const savedUser = localStorage.getItem('edutrack_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user:', e);
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = (data: { accessToken: string; refreshToken: string; user: IUser }) => {
    localStorage.setItem('edutrack_access_token', data.accessToken);
    localStorage.setItem('edutrack_refresh_token', data.refreshToken);
    localStorage.setItem('edutrack_user', JSON.stringify(data.user));
    setToken(data.accessToken);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    }
    localStorage.removeItem('edutrack_access_token');
    localStorage.removeItem('edutrack_refresh_token');
    localStorage.removeItem('edutrack_user');
    setToken(null);
    setUser(null);
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
