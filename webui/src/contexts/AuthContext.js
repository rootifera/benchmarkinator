import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    if (apiKey) {
      setIsAuthenticated(true);
      localStorage.setItem('apiKey', apiKey);
    } else {
      setIsAuthenticated(false);
      localStorage.removeItem('apiKey');
    }
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const login = (key) => {
    setApiKey(key);
  };

  const logout = () => {
    setApiKey('');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const value = {
    apiKey,
    isAuthenticated,
    login,
    logout,
    darkMode,
    toggleDarkMode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
