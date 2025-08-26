import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Hardware from './pages/Hardware';
import Benchmarks from './pages/Benchmarks';
import Results from './pages/Results';
import Configurations from './pages/Configurations';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <div className="flex h-screen bg-secondary-50">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile header */}
            <div className="lg:hidden bg-white border-b border-secondary-200 px-4 py-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-secondary-600 hover:text-secondary-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Main content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-secondary-50">
              <div className="container mx-auto px-4 py-6">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/hardware" element={<Hardware />} />
                  <Route path="/benchmarks" element={<Benchmarks />} />
                  <Route path="/results" element={<Results />} />
                  <Route path="/configurations" element={<Configurations />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
