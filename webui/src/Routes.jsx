import React, { Suspense, lazy } from 'react';
import { Routes as RouterRoutes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Hardware = lazy(() => import('./pages/Hardware'));
const Benchmarks = lazy(() => import('./pages/Benchmarks'));
const Results = lazy(() => import('./pages/Results'));
const Configurations = lazy(() => import('./pages/Configurations'));
const Login = lazy(() => import('./components/Login'));

const PageFallback = () => (
  <div className="flex items-center justify-center py-12">
    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
  </div>
);

const Routes = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <Suspense fallback={<PageFallback />}>
        <RouterRoutes>
          <Route path="/login" element={<Login />} />

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
          <Route path="/results" element={<Results />} />
          <Route path="/testsystems" element={
            <ProtectedRoute>
              <Configurations />
            </ProtectedRoute>
          } />
        </RouterRoutes>
      </Suspense>
    </div>
  );
};

export default Routes;
