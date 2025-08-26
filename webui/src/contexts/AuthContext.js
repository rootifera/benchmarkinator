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
  const [apiKey, setApiKey] = useState(localStorage.getItem('benchmarkinator_api_key') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('benchmarkinator_api_key', apiKey);
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('benchmarkinator_api_key');
      setIsAuthenticated(false);
    }
  }, [apiKey]);

  const login = (key) => {
    setApiKey(key);
  };

  const logout = () => {
    setApiKey('');
  };

  const value = {
    apiKey,
    isAuthenticated,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
