import React from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Routes from './Routes';
import ToastContainer from './components/ToastContainer';

const AppContent = () => {
  const location = useLocation();
  
  // Don't show sidebar on login page
  const isLoginPage = location.pathname === '/login';
  
  if (isLoginPage) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900">
        <Routes />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-auto">
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
