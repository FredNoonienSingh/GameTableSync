'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  token: string | null;
  isAdmin: boolean;
  loginOpened: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  login: (token: string, isAdmin: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginOpened, setLoginOpened] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem('token'));
    setIsAdmin(localStorage.getItem('is_admin') === 'true');
  }, []);

  const openLogin = () => setLoginOpened(true);
  const closeLogin = () => setLoginOpened(false);

  const login = (newToken: string, newIsAdmin: boolean) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('is_admin', String(newIsAdmin));
    setToken(newToken);
    setIsAdmin(newIsAdmin);
    window.location.reload(); // Der gute alte Reload-Hammer
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('is_admin');
    setToken(null);
    setIsAdmin(false);
    window.location.reload(); // Der gute alte Reload-Hammer
  };

  return (
    <AuthContext.Provider value={{ token, isAdmin, loginOpened, openLogin, closeLogin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
