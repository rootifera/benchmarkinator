import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Routes from './Routes';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <Routes />
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
