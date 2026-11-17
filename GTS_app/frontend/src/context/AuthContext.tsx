'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { LoginModal } from '@gts/ui'; // Or adjust import path if LoginModal is local

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  discord_id?: string | null;
  discord_account?: string | null;
  avatar_url?: string | null;
}

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  isAdmin: boolean;
  loginOpened: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  login: (token: string, isAdmin: boolean, user?: AuthUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginOpened, setLoginOpened] = useState(false);

  // Modal request state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const syncAuth = () => {
      const savedToken = localStorage.getItem('token');
      const savedAdmin = localStorage.getItem('is_admin') === 'true';
      const savedUser = localStorage.getItem('gts_user');
      setToken(savedToken);
      setIsAdmin(savedAdmin);
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          setUser(null);
        }
      }
    };

    syncAuth();
    window.addEventListener('gts-user-updated', syncAuth);
    return () => {
      window.removeEventListener('gts-user-updated', syncAuth);
    };
  }, []);

  const openLogin = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoginOpened(true);
  };

  const closeLogin = () => {
    setLoginOpened(false);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const login = (
    newToken: string,
    newIsAdmin: boolean,
    newUser?: AuthUser | null,
    clubRoles?: unknown[]
  ) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('is_admin', String(newIsAdmin));
    if (newUser) {
      localStorage.setItem('gts_user', JSON.stringify(newUser));
      setUser(newUser);
    }
    if (Array.isArray(clubRoles)) {
      localStorage.setItem('gts_club_roles', JSON.stringify(clubRoles));
    }
    setToken(newToken);
    setIsAdmin(newIsAdmin);
    setLoginOpened(false);
    window.location.reload();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('is_admin');
    localStorage.removeItem('is_app_admin');
    localStorage.removeItem('gts_user');
    localStorage.removeItem('gts_club_roles');
    setToken(null);
    setUser(null);
    setIsAdmin(false);
    window.location.reload();
  };

  const handleApiLogin = async (payload: { email: string; password: string }) => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.msg || 'Anmeldung fehlgeschlagen.');
        return;
      }
      login(
        data.access_token,
        Boolean(data.is_app_admin),
        data.user || null,
        data.club_roles
      );
    } catch {
      setErrorMsg('Server nicht erreichbar. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiRegister = async (payload: {
    username: string;
    email: string;
    password: string;
    discord_account: string | null;
  }) => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.msg || 'Registrierung fehlgeschlagen.');
        return;
      }
      setSuccessMsg(data.msg || 'Account erstellt! Logge dich jetzt automatisch ein...');
      // Immediately log the new user in after registration
      await handleApiLogin({ email: payload.email, password: payload.password });
    } catch {
      setErrorMsg('Server nicht erreichbar. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ token, user, isAdmin, loginOpened, openLogin, closeLogin, login, logout }}
    >
      {children}
      <LoginModal
        opened={loginOpened}
        onClose={closeLogin}
        onLogin={handleApiLogin}
        onRegister={handleApiRegister}
        isLoading={isLoading}
        errorMsg={errorMsg}
        successMsg={successMsg}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};