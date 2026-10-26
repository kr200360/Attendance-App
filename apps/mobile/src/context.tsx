import React, { createContext, useContext, useState } from 'react';
import { setMobileAuthToken } from './api';

interface MobileAuthContextType {
  user: any | null;
  token: string | null;
  login: (userData: any, token: string) => void;
  logout: () => void;
}

const MobileAuthContext = createContext<MobileAuthContextType | undefined>(undefined);

export const MobileAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = (userData: any, accessToken: string) => {
    setUser(userData);
    setToken(accessToken);
    setMobileAuthToken(accessToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setMobileAuthToken(null);
  };

  return (
    <MobileAuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </MobileAuthContext.Provider>
  );
};

export const useMobileAuth = () => {
  const ctx = useContext(MobileAuthContext);
  if (!ctx) throw new Error('useMobileAuth must be used within MobileAuthProvider');
  return ctx;
};
