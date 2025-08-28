import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus,
  Edit,
  Trash2,
  Target
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
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (benchmarks.length === 0) {
      return (
        <div className="text-center py-8 text-secondary-500">
          No benchmarks found. Click the "Add New" button to create one.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-secondary-200">
          <thead className="bg-secondary-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Target
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Version
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-200">
            {benchmarks.map((benchmark) => (
              <tr key={benchmark.id} className="hover:bg-secondary-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                  {benchmark.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    <Target className="w-3 h-3 mr-1" />
                    {benchmark.target}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-secondary-900">
                  {benchmark.description || 'No description'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                  {benchmark.version || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setEditingItem(benchmark)}
                    className="text-primary-600 hover:text-primary-900 mr-3"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(benchmark.id)}
                    className="text-red-600 hover:text-red-900"
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Benchmarks</h1>
          <p className="text-secondary-600 mt-2">
            Manage your benchmark tests and their configurations
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Benchmark
        </button>
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
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">
          {benchmark ? 'Edit' : 'Add New'} Benchmark
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
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
            <label className="block text-sm font-medium text-secondary-700 mb-2">
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
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
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
            <label className="block text-sm font-medium text-secondary-700 mb-2">
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
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
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
