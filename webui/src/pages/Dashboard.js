import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ApiKeyModal from '../components/ApiKeyModal';
import { 
  Cpu, 
  Monitor, 
  BarChart3, 
  Settings, 
  Plus,
  TrendingUp,
  Clock,
  Award,
  Key
} from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { isAuthenticated, apiKey } = useAuth();
  const [showApiModal, setShowApiModal] = useState(false);
  const [stats, setStats] = useState({
    cpus: 0,
    gpus: 0,
    benchmarks: 0,
    results: 0,
    configurations: 0
  });
  const [loading, setLoading] = useState(true);

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
      
      const [cpuRes, gpuRes, benchmarkRes, resultRes, configRes] = await Promise.all([
        axios.get('/api/cpu/', { headers }),
        axios.get('/api/gpu/', { headers }),
        axios.get('/api/benchmark/', { headers }),
        axios.get('/api/benchmark_results/', { headers }),
        axios.get('/api/config/', { headers })
      ]);

      setStats({
        cpus: cpuRes.data.length || 0,
        gpus: gpuRes.data.length || 0,
        benchmarks: benchmarkRes.data.length || 0,
        results: resultRes.data.length || 0,
        configurations: configRes.data.length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="card">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-secondary-600">{title}</p>
          <p className="text-2xl font-semibold text-secondary-900">{value}</p>
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, icon: Icon, href, color }) => (
    <Link
      to={href}
      className="card hover:shadow-md transition-shadow duration-200 cursor-pointer group"
    >
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color} group-hover:scale-110 transition-transform duration-200`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors duration-200">
            {title}
          </h3>
          <p className="text-secondary-600">{description}</p>
        </div>
      </div>
    </Link>
  );

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <Cpu className="w-16 h-16 text-primary-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Welcome to Benchmarkinator
            </h1>
            <p className="text-secondary-600">
              Connect to your benchmark management API to get started
            </p>
          </div>
          <button
            onClick={() => setShowApiModal(true)}
            className="btn-primary text-lg px-8 py-3"
          >
            <Key className="w-5 h-5 mr-2 inline" />
            Connect API
          </button>
        </div>
        <ApiKeyModal isOpen={showApiModal} onClose={() => setShowApiModal(false)} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary-900">Dashboard</h1>
        <p className="text-secondary-600 mt-2">
          Overview of your benchmark management system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="CPUs"
          value={stats.cpus}
          icon={Cpu}
          color="bg-blue-500"
        />
        <StatCard
          title="GPUs"
          value={stats.gpus}
          icon={Monitor}
          color="bg-green-500"
        />
        <StatCard
          title="Benchmarks"
          value={stats.benchmarks}
          icon={BarChart3}
          color="bg-purple-500"
        />
        <StatCard
          title="Results"
          value={stats.results}
          icon={TrendingUp}
          color="bg-orange-500"
        />
        <StatCard
          title="Configurations"
          value={stats.configurations}
          icon={Settings}
          color="bg-indigo-500"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-secondary-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickActionCard
            title="Add Hardware"
            description="Create new CPU, GPU, or other hardware components"
            icon={Plus}
            href="/hardware"
            color="bg-blue-500"
          />
          <QuickActionCard
            title="Create Benchmark"
            description="Add new benchmarks to your testing suite"
            icon={BarChart3}
            href="/benchmarks"
            color="bg-green-500"
          />
          <QuickActionCard
            title="View Results"
            description="Analyze and compare benchmark results"
            icon={TrendingUp}
            href="/results"
            color="bg-purple-500"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold text-secondary-900 mb-4">Recent Activity</h2>
        <div className="card">
          <div className="flex items-center justify-center py-8 text-secondary-500">
            <Clock className="w-8 h-8 mr-2" />
            <span>No recent activity to display</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
