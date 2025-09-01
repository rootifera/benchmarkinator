import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Edit,
  Trash2,
  Target,
  BarChart3
} from 'lucide-react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';

const Benchmarks = () => {
  const { apiKey } = useAuth();
  const [benchmarks, setBenchmarks] = useState([]);
  const [benchmarkTargets, setBenchmarkTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTargetForm, setShowTargetForm] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const fetchBenchmarks = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { 'X-API-Key': apiKey };
      const [benchmarksRes, targetsRes] = await Promise.all([
        axios.get(buildApiUrl('/api/benchmark/'), { headers }),
        axios.get(buildApiUrl('/api/benchmark/target/'), { headers })
      ]);
      setBenchmarks(benchmarksRes.data);
      setBenchmarkTargets(targetsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    fetchBenchmarks();
  }, [fetchBenchmarks]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this benchmark?')) {
      try {
        const headers = { 'X-API-Key': apiKey };
        await axios.delete(buildApiUrl(`/api/benchmark/${id}`), { headers });
        fetchBenchmarks();
      } catch (error) {
        console.error('Error deleting benchmark:', error);
      }
    }
  };

  const handleEditTarget = (target) => {
    setEditingTarget(target);
    setShowTargetForm(true);
  };

  const handleDeleteTarget = async (id) => {
    if (window.confirm('Are you sure you want to delete this benchmark target?')) {
      try {
        const headers = { 'X-API-Key': apiKey };
        await axios.delete(buildApiUrl(`/api/benchmark/target/${id}`), { headers });
        fetchBenchmarks();
      } catch (error) {
        console.error('Error deleting benchmark target:', error);
      }
    }
  };

  const renderTable = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (benchmarks.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No benchmarks found</h3>
          <p className="text-sm">Click the "Add New Benchmark" button to create your first benchmark test</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Target
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {benchmarks.map((benchmark) => (
              <tr key={benchmark.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {benchmark.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 border border-primary-200 dark:border-primary-700">
                    <Target className="w-3 h-3 mr-1" />
                    {benchmarkTargets.find(t => t.id === benchmark.benchmark_target_id)?.name || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setEditingItem(benchmark)}
                    className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3 p-1 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                    title="Edit benchmark"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(benchmark.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete benchmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Benchmarks
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create and manage benchmark tests for CPU, GPU, memory, storage, and system performance evaluation
          </p>
        </div>

      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500 text-white">
              <Target className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Benchmark Targets
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : benchmarkTargets.length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500 text-white">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Benchmarks
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : benchmarks.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Benchmark Targets Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Benchmark Targets</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Define what components benchmarks can target (CPU, GPU, Memory, etc.)
              </div>
            </div>
            <button
              onClick={() => setShowTargetForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
            >
              Add Target
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {benchmarkTargets.map((target) => (
                  <tr key={target.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {target.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditTarget(target)}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTarget(target.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Benchmarks Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Benchmarks</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage benchmark tests for performance evaluation
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
            >
              Add Benchmark
            </button>
          </div>
          {renderTable()}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <BenchmarkForm
          benchmark={editingItem}
          benchmarkTargets={benchmarkTargets}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingItem(null);
            fetchBenchmarks();
          }}
        />
      )}

      {/* Benchmark Target Form Modal */}
      {showTargetForm && (
        <BenchmarkTargetForm
          target={editingTarget}
          onClose={() => {
            setShowTargetForm(false);
            setEditingTarget(null);
          }}
          onSave={() => {
            setShowTargetForm(false);
            setEditingTarget(null);
            fetchBenchmarks();
          }}
        />
      )}
    </div>
  );
};

// Benchmark Form Component
const BenchmarkForm = ({ benchmark, benchmarkTargets, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    benchmark_target_id: ''
  });
  const { apiKey } = useAuth();

  useEffect(() => {
    if (benchmark) {
      setFormData({
        name: benchmark.name,
        benchmark_target_id: benchmark.benchmark_target_id
      });
    } else {
      setFormData({
        name: '',
        benchmark_target_id: ''
      });
    }
  }, [benchmark]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const headers = { 'X-API-Key': apiKey };
      
      if (benchmark) {
        await axios.put(buildApiUrl(`/api/benchmark/${benchmark.id}`), formData, { headers });
      } else {
        await axios.post(buildApiUrl('/api/benchmark/'), formData, { headers });
      }
      onSave();
    } catch (error) {
      console.error('Error saving benchmark:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {benchmark ? 'Edit' : 'Add New'} Benchmark
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6" id="benchmark-form">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              <BarChart3 className="w-5 h-5 inline mr-2" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <BarChart3 className="w-4 h-4 inline mr-2" />
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g., 3DMark2000, Prime95"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Target className="w-4 h-4 inline mr-2" />
                  Benchmark Target
                </label>
                <select
                  value={formData.benchmark_target_id || ''}
                  onChange={(e) => setFormData({ ...formData, benchmark_target_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="input-field"
                >
                  <option value="">Select a target (optional)</option>
                  {benchmarkTargets.map((target) => (
                    <option key={target.id} value={target.id}>
                      {target.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex-1"
            >
              {benchmark ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Benchmark Target Form Component
const BenchmarkTargetForm = ({ target, onClose, onSave }) => {
  const [formData, setFormData] = useState({ name: '' });
  const { apiKey } = useAuth();

  useEffect(() => {
    if (target) {
      setFormData(target);
    } else {
      setFormData({ name: '' });
    }
  }, [target]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const headers = { 'X-API-Key': apiKey };
      
      if (target) {
        await axios.put(buildApiUrl(`/api/benchmark/target/${target.id}`), formData, { headers });
      } else {
        await axios.post(buildApiUrl('/api/benchmark/target/'), formData, { headers });
      }
      onSave();
    } catch (error) {
      console.error('Error saving benchmark target:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {target ? 'Edit' : 'Add New'} Benchmark Target
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Target className="w-4 h-4 inline mr-2" />
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="e.g., CPU, GPU, Memory"
              required
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex-1"
            >
              {target ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Benchmarks;
