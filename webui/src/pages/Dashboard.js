import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ApiKeyModal from '../components/ApiKeyModal';
import { 
  Cpu, 
  Monitor, 
  BarChart3, 
  Settings, 
  HardDrive,
  Plus,
  TrendingUp
} from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { apiKey, isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    cpus: 0,
    gpus: 0,
    benchmarks: 0,
    results: 0,
    configurations: 0
  });
  const [loading, setLoading] = useState(true);
  const [showApiModal, setShowApiModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchStats = async () => {
    try {
      const headers = { 'X-API-Key': apiKey };
      const [cpus, gpus, benchmarks, results, configs] = await Promise.all([
        axios.get('/api/cpu/', { headers }),
        axios.get('/api/gpu/', { headers }),
        axios.get('/api/benchmark/', { headers }),
        axios.get('/api/benchmark_results/', { headers }),
        axios.get('/api/config/', { headers })
      ]);

      setStats({
        cpus: cpus.data.length,
        gpus: gpus.data.length,
        benchmarks: benchmarks.data.length,
        results: results.data.length,
        configurations: configs.data.length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { name: 'CPUs', value: stats.cpus, icon: Cpu, color: 'bg-blue-500', href: '/hardware' },
    { name: 'GPUs', value: stats.gpus, icon: Monitor, color: 'bg-green-500', href: '/hardware' },
    { name: 'Benchmarks', value: stats.benchmarks, icon: BarChart3, color: 'bg-purple-500', href: '/benchmarks' },
    { name: 'Results', value: stats.results, icon: TrendingUp, color: 'bg-orange-500', href: '/results' },
    { name: 'Configurations', value: stats.configurations, icon: Settings, color: 'bg-indigo-500', href: '/configurations' },
  ];

  const quickActions = [
    { name: 'Add CPU', href: '/hardware', icon: Cpu, description: 'Add a new CPU to your hardware catalog' },
    { name: 'Add GPU', href: '/hardware', icon: Monitor, description: 'Add a new GPU to your hardware catalog' },
    { name: 'Create Benchmark', href: '/benchmarks', icon: BarChart3, description: 'Create a new benchmark test' },
    { name: 'New Configuration', href: '/configurations', icon: Settings, description: 'Create a new hardware configuration' },
  ];

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">🔑</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Connect Your API
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            To get started, you'll need to connect your API key to access the benchmark data.
          </p>
          <button
            onClick={() => setShowApiModal(true)}
            className="btn-primary inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Connect API
          </button>
        </div>
        <ApiKeyModal isOpen={showApiModal} onClose={() => setShowApiModal(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome to your benchmark management system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              to={stat.href}
              className="card hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color} text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {loading ? '...' : stat.value}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.name}
                to={action.href}
                className="group block p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
              >
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg group-hover:bg-primary-200 dark:group-hover:bg-primary-800 transition-colors">
                    <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
                    {action.name}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Recent Activity
        </h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No recent activity to display</p>
          <p className="text-sm mt-2">Start by adding some hardware or running benchmarks</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
