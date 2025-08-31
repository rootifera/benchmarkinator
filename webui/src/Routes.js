import React from 'react';
import { Routes as RouterRoutes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Hardware from './pages/Hardware';
import Benchmarks from './pages/Benchmarks';
import Results from './pages/Results';
import Configurations from './pages/Configurations';

const Routes = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <RouterRoutes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/hardware" element={<Hardware />} />
        <Route path="/benchmarks" element={<Benchmarks />} />
        <Route path="/results" element={<Results />} />
        <Route path="/testsystems" element={<Configurations />} />
      </RouterRoutes>
    </div>
  );
};

export default Routes;
