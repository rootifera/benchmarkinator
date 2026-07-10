import React, { createContext, useContext, useState, useEffect } from 'react';
import { authenticateUser, fetchSession, logoutUser } from '../utils/authService';

const AuthContext = createContext();
const APP_MODE = import.meta.env.VITE_APP_MODE || 'admin';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved) {
      return JSON.parse(saved);
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches || false;
  });

  useEffect(() => {
    const restoreSession = async () => {
      if (APP_MODE === 'public') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        setAuthLoading(false);
        return;
      }

      try {
        const result = await fetchSession();
        if (result.success && result.user) {
          setUser(result.user);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
        }
      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const login = async (username, password) => {
    try {
      const result = await authenticateUser(username, password);
      
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(result.user));
        return result;
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // Clear local auth state even if the server logout request fails.
    }
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const value = {
    user,
    isAuthenticated,
    authLoading,
    login,
    logout,
    darkMode,
    toggleDarkMode,
    apiKey: user ? 'cookie-auth' : ''
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
