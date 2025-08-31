import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus,
  Edit,
  Trash2,
  Target,
  BarChart3,
  Monitor
} from 'lucide-react';
import axios from 'axios';

const Benchmarks = () => {
  const { apiKey } = useAuth();
  const [benchmarks, setBenchmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchBenchmarks = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { 'X-API-Key': apiKey };
      const response = await axios.get('/api/benchmark/', { headers });
      setBenchmarks(response.data);
    } catch (error) {
      console.error('Error fetching benchmarks:', error);
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
        await axios.delete(`/api/benchmark/${id}`, { headers });
        fetchBenchmarks();
      } catch (error) {
        console.error('Error deleting benchmark:', error);
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Version
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
                    {benchmark.target}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {benchmark.description || 'No description'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {benchmark.version || 'N/A'}
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
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
        >
          Add New Benchmark
        </button>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500 text-white">
              <Target className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                CPU Benchmarks
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : benchmarks.filter(b => b.target === 'CPU').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500 text-white">
              <Monitor className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                GPU Benchmarks
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : benchmarks.filter(b => b.target === 'GPU').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-500 text-white">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Other Benchmarks
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : benchmarks.filter(b => !['CPU', 'GPU'].includes(b.target)).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="card">
        {renderTable()}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <BenchmarkForm
          benchmark={editingItem}
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
    </div>
  );
};

// Benchmark Form Component
const BenchmarkForm = ({ benchmark, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    target: 'CPU',
    description: '',
    version: ''
  });
  const { apiKey } = useAuth();

  useEffect(() => {
    if (benchmark) {
      setFormData(benchmark);
    }
  }, [benchmark]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const headers = { 'X-API-Key': apiKey };
      if (benchmark) {
        await axios.put(`/api/benchmark/${benchmark.id}`, formData, { headers });
      } else {
        await axios.post('/api/benchmark/', formData, { headers });
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
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
                  Target
                </label>
                <select
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="CPU">CPU</option>
                  <option value="GPU">GPU</option>
                  <option value="Memory">Memory</option>
                  <option value="Storage">Storage</option>
                  <option value="System">System</option>
                  <option value="Network">Network</option>
                  <option value="Audio">Audio</option>
                  <option value="Video">Video</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows="3"
                placeholder="Brief description of the benchmark"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Version
              </label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="input-field"
                placeholder="e.g., 1.0, 2000"
              />
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

export default Benchmarks;
