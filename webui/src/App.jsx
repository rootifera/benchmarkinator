import React from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Routes from './Routes';
import ToastContainer from './components/ToastContainer';

const APP_MODE = import.meta.env.VITE_APP_MODE || 'admin';

const AppContent = () => {
  const location = useLocation();
  const isPublicMode = APP_MODE === 'public';
  const isLoginPage = location.pathname === '/login';
  
  if (isLoginPage || isPublicMode) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Routes />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-auto [scrollbar-gutter:stable]">
        <Routes />
      </main>
      <ToastContainer />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
