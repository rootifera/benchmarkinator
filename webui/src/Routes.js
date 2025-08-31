import React from 'react';
import { Routes as RouterRoutes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Hardware from './pages/Hardware';
import Benchmarks from './pages/Benchmarks';
import Results from './pages/Results';
import Configurations from './pages/Configurations';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';

const Routes = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <RouterRoutes>
        {/* Public routes - no authentication required */}
        <Route path="/login" element={<Login />} />
        <Route path="/results" element={<Results />} />
        
        {/* Protected routes - authentication required */}
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/hardware" element={
          <ProtectedRoute>
            <Hardware />
          </ProtectedRoute>
        } />
        <Route path="/benchmarks" element={
          <ProtectedRoute>
            <Benchmarks />
          </ProtectedRoute>
        } />
        <Route path="/testsystems" element={
          <ProtectedRoute>
            <Configurations />
          </ProtectedRoute>
        } />
      </RouterRoutes>
    </div>
  );
};

export default Routes;
