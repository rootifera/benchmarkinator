import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ApiKeyModal from '../components/ApiKeyModal';
import { 
  BarChart3, 
  Plus,
  Settings,
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
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApiModal, setShowApiModal] = useState(false);


  const fetchStats = useCallback(async () => {
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

      // Fetch recent activity (latest 5 results)
      if (results.data.length > 0) {
        const recentResults = results.data
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5);
        
        const activityItems = recentResults.map(result => {
          const benchmark = benchmarks.data.find(b => b.id === result.benchmark_id);
          const config = configs.data.find(c => c.id === result.config_id);
          return {
            id: result.id,
            type: 'benchmark_result',
            title: `New benchmark result: ${benchmark?.name || 'Unknown'}`,
            subtitle: `Test System: ${config?.name || 'Unknown'}`,
            timestamp: result.timestamp,
            value: result.result
          };
        });
        
        setRecentActivity(activityItems);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchStats]);



  const statCards = [
            { name: 'Test Systems', value: stats.configurations, icon: Settings, color: 'bg-indigo-500', href: '/testsystems' },
    { name: 'Benchmarks', value: stats.benchmarks, icon: BarChart3, color: 'bg-purple-500', href: '/benchmarks' },
    { name: 'Results', value: stats.results, icon: TrendingUp, color: 'bg-orange-500', href: '/results' },
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
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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



      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Recent Activity
        </h2>
        {recentActivity.length > 0 ? (
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.subtitle}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Score: {activity.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity to display</p>
            <p className="text-sm mt-2">Start by adding some hardware or running benchmarks</p>
          </div>
        )}
      </div>


          </div>
    );
  };










export default Dashboard;
