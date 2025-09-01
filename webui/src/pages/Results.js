import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Filter,
  TrendingUp,
  BarChart3,
  Edit,
  Trash2
} from 'lucide-react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { buildApiUrl } from '../config/api';

const Results = () => {
  const { apiKey, isAuthenticated } = useAuth();
  const [results, setResults] = useState([]);
  const [benchmarks, setBenchmarks] = useState([]);
  const [configurations, setConfigurations] = useState([]);
  const [cpus, setCpus] = useState([]);
  const [gpus, setGpus] = useState([]);
  const [cpuBrands, setCpuBrands] = useState([]);
  const [cpuFamilies, setCpuFamilies] = useState([]);
  const [gpuManufacturers, setGpuManufacturers] = useState([]);
  const [gpuBrands, setGpuBrands] = useState([]);
  const [gpuModels, setGpuModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCompareForm, setShowCompareForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filters, setFilters] = useState({
    benchmark: '',
    configuration: '',
    cpu: '',
    gpu: '',
    dateFrom: '',
    dateTo: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { 'X-API-Key': apiKey };
      const [
        resultsRes, benchmarksRes, configsRes, cpusRes, gpusRes,
        cpuBrandsRes, cpuFamiliesRes, gpuManufacturersRes, gpuBrandsRes, gpuModelsRes
      ] = await Promise.all([
        axios.get(buildApiUrl('/api/benchmark_results/'), { headers }),
        axios.get(buildApiUrl('/api/benchmark/'), { headers }),
        axios.get(buildApiUrl('/api/config/'), { headers }),
        axios.get(buildApiUrl('/api/cpu/'), { headers }),
        axios.get(buildApiUrl('/api/gpu/'), { headers }),
        axios.get(buildApiUrl('/api/cpu/brand/'), { headers }),
        axios.get(buildApiUrl('/api/cpu/family/'), { headers }),
        axios.get(buildApiUrl('/api/gpu/manufacturer/'), { headers }),
        axios.get(buildApiUrl('/api/gpu/brand/'), { headers }),
        axios.get(buildApiUrl('/api/gpu/model/'), { headers })
      ]);

      setResults(resultsRes.data);
      setBenchmarks(benchmarksRes.data);
      setConfigurations(configsRes.data);
      setCpus(cpusRes.data);
      setGpus(gpusRes.data);
      setCpuBrands(cpuBrandsRes.data);
      setCpuFamilies(cpuFamiliesRes.data);
      setGpuManufacturers(gpuManufacturersRes.data);
      setGpuBrands(gpuBrandsRes.data);
      setGpuModels(gpuModelsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [filteredResults, setFilteredResults] = useState([]);

  const handleEditResult = (result) => {
    if (!isAuthenticated) {
      alert('Please log in to edit results');
      return;
    }
    setEditingItem(result);
    setShowForm(true);
  };

  const handleDeleteResult = async (resultId) => {
    if (!isAuthenticated) {
      alert('Please log in to delete results');
      return;
    }
    if (window.confirm('Are you sure you want to delete this result?')) {
      try {
        const headers = { 'X-API-Key': apiKey };
        await axios.delete(buildApiUrl(`/api/benchmark_results/${resultId}`), { headers });
        fetchData();
        fetchFilteredResults();
      } catch (error) {
        console.error('Error deleting result:', error);
        alert('Failed to delete result');
      }
    }
  };

  const fetchFilteredResults = useCallback(async () => {
    if (!filters.benchmark && !filters.configuration && !filters.cpu && !filters.gpu && !filters.dateFrom && !filters.dateTo) {
      setFilteredResults(results);
      return;
    }

    try {
      const headers = { 'X-API-Key': apiKey };
      let endpoint = buildApiUrl('/api/benchmark_results/');
      let filtered = [];

      if (filters.configuration) {
        endpoint = buildApiUrl(`/api/benchmark_results/config/${filters.configuration}`);
        const response = await axios.get(endpoint, { headers });
        filtered = response.data;
        if (filters.benchmark) {
          filtered = filtered.filter(r => r.benchmark_id === parseInt(filters.benchmark));
        }
      } else if (filters.cpu && filters.gpu) {
        endpoint = buildApiUrl(`/api/benchmark_results/cpu-gpu/${filters.cpu}/${filters.gpu}`);
        const response = await axios.get(endpoint, { headers });
        filtered = response.data;
        if (filters.benchmark) {
          filtered = filtered.filter(r => r.benchmark_id === parseInt(filters.benchmark));
        }
      } else if (filters.cpu) {
        endpoint = buildApiUrl(`/api/benchmark_results/cpu/${filters.cpu}`);
        const response = await axios.get(endpoint, { headers });
        filtered = response.data;
        if (filters.benchmark) {
          filtered = filtered.filter(r => r.benchmark_id === parseInt(filters.benchmark));
        }
      } else if (filters.gpu) {
        endpoint = buildApiUrl(`/api/benchmark_results/gpu/${filters.gpu}`);
        const response = await axios.get(endpoint, { headers });
        filtered = response.data;
        if (filters.benchmark) {
          filtered = filtered.filter(r => r.benchmark_id === parseInt(filters.benchmark));
        }
      } else {
        const response = await axios.get(endpoint, { headers });
        filtered = response.data;
        if (filters.benchmark) {
          filtered = filtered.filter(r => r.benchmark_id === parseInt(filters.benchmark));
        }
      }

      if (filters.dateFrom) {
        filtered = filtered.filter(result => {
          try {
            const d = new Date(result.timestamp);
            return d.getTime() > 0 && d >= new Date(filters.dateFrom);
          } catch { return false; }
        });
      }
      if (filters.dateTo) {
        filtered = filtered.filter(result => {
          try {
            const d = new Date(result.timestamp);
            return d.getTime() > 0 && d <= new Date(filters.dateTo);
          } catch { return false; }
        });
      }

      setFilteredResults(filtered);
    } catch (error) {
      console.error('Error fetching filtered results:', error);
      setFilteredResults([]);
    }
  }, [filters, apiKey, results]);

  useEffect(() => {
    fetchFilteredResults();
  }, [fetchFilteredResults]);

  const renderFilters = () => (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Filter className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h3>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Filters work together - combine benchmark, test system, and date filters
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Test System
          </label>
          <select
            value={filters.configuration}
            onChange={(e) => setFilters({ ...filters, configuration: e.target.value })}
            className="input-field text-sm py-1"
          >
            <option value="">All</option>
            {configurations.map(config => (
              <option key={config.id} value={config.id}>
                {config.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Benchmark
          </label>
          <select
            value={filters.benchmark}
            onChange={(e) => setFilters({ ...filters, benchmark: e.target.value })}
            className="input-field text-sm py-1"
          >
            <option value="">All</option>
            {benchmarks.map(benchmark => (
              <option key={benchmark.id} value={benchmark.id}>
                {benchmark.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            CPU
          </label>
          <select
            value={filters.cpu}
            onChange={(e) => setFilters({ ...filters, cpu: e.target.value })}
            className="input-field text-sm py-1"
          >
            <option value="">All</option>
            {cpus.map(cpu => {
              const brand = cpuBrands.find(b => b.id === cpu.cpu_brand_id);
              const family = cpuFamilies.find(f => f.id === cpu.cpu_family_id);
              return (
                <option key={cpu.id} value={cpu.id}>
                  {brand?.name || 'Unknown'} {family?.name || 'Unknown'} {cpu.model} [{cpu.speed} - {cpu.core_count} Cores]{cpu.serial ? ` [${cpu.serial}]` : ''}
                </option>
              );
            })}
          </select>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            GPU
          </label>
          <select
            value={filters.gpu}
            onChange={(e) => setFilters({ ...filters, gpu: e.target.value })}
            className="input-field text-sm py-1"
          >
            <option value="">All</option>
            {gpus.map(gpu => {
              const manufacturer = gpuManufacturers.find(m => m.id === gpu.gpu_manufacturer_id);
              const brand = gpuBrands.find(b => b.id === gpu.gpu_brand_id);
              const model = gpuModels.find(m => m.id === gpu.gpu_model_id);
              return (
                <option key={gpu.id} value={gpu.id}>
                  {manufacturer?.name || 'Unknown'} {brand?.name || 'Unknown'} {model?.name || 'Unknown'} {gpu.vram_size}{gpu.serial ? ` [${gpu.serial}]` : ''}
                </option>
              );
            })}
          </select>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date
          </label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="input-field text-sm py-1"
          />
        </div>
        
        <div className="flex items-end">
          <button
            onClick={() => setFilters({
              benchmark: '',
              configuration: '',
              cpu: '',
              gpu: '',
              dateFrom: '',
              dateTo: ''
            })}
            className="bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium px-3 py-1 rounded transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );

  const renderResultsTable = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (filteredResults.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No results found matching the current filters</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Benchmark
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Test System
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Result
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredResults.map((result) => {
              const benchmark = benchmarks.find(b => b.id === result.benchmark_id);
              const config = configurations.find(c => c.id === result.config_id);
              return (
                <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {benchmark?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {config?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                      {result.result}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {(() => {
                      try {
                        const date = new Date(result.timestamp);
                        return date.getTime() > 0 ? date.toLocaleDateString() : 'No date';
                      } catch {
                        return 'Invalid date';
                      }
                    })()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {result.notes || 'No notes'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditResult(result)}
                        disabled={!isAuthenticated}
                        className={`p-1 rounded transition-colors ${
                          isAuthenticated
                            ? 'text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={isAuthenticated ? "Edit Result" : "Login required to edit"}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteResult(result.id)}
                        disabled={!isAuthenticated}
                        className={`p-1 rounded transition-colors ${
                          isAuthenticated
                            ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={isAuthenticated ? "Delete Result" : "Login required to delete"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
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
            Results
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            View and analyze your benchmark results
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              if (!isAuthenticated) {
                alert('Please log in to compare test systems');
                return;
              }
              setShowCompareForm(true);
            }}
            disabled={!isAuthenticated}
            className={`text-xs font-medium px-3 py-2 rounded-lg transition-colors ${
              isAuthenticated 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-400 text-gray-600 cursor-not-allowed'
            }`}
          >
            Compare Test Systems
          </button>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                alert('Please log in to add new results');
                return;
              }
              setShowForm(true);
            }}
            disabled={!isAuthenticated}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              isAuthenticated 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-400 text-gray-600 cursor-not-allowed'
            }`}
          >
            Add New Result
          </button>
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500 text-white">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Results
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : results.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {renderFilters()}

      {/* Results Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Benchmark Results
          </h2>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Detailed view of all benchmark results
          </div>
        </div>
        {renderResultsTable()}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && isAuthenticated && (
        <ResultForm
          result={editingItem}
          benchmarks={benchmarks}
          configurations={configurations}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingItem(null);
            fetchData();
          }}
        />
      )}

      {/* Compare Test Systems Modal */}
      {showCompareForm && isAuthenticated && (
        <CompareForm
          configurations={configurations}
          benchmarks={benchmarks}
          onClose={() => setShowCompareForm(false)}
        />
      )}
    </div>
  );
};

// Result Form Component
const ResultForm = ({ result, onClose, onSave, benchmarks, configurations }) => {
  const [formData, setFormData] = useState({
    benchmark_id: '',
    config_id: '',
    result: '',
    timestamp: new Date().toISOString(),
    notes: ''
  });
  const { apiKey } = useAuth();

  useEffect(() => {
    if (result) {
      setFormData({
        benchmark_id: result.benchmark_id,
        config_id: result.config_id,
        result: result.result,
        timestamp: result.timestamp || new Date().toISOString(),
        notes: result.notes || ''
      });
    } else {
      setFormData({
        benchmark_id: '',
        config_id: '',
        result: '',
        timestamp: new Date().toISOString(),
        notes: ''
      });
    }
  }, [result]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const headers = { 'X-API-Key': apiKey };
      const dataToSend = {
        ...formData,
        timestamp: formData.timestamp || new Date().toISOString()
      };
      if (result) {
        await axios.put(buildApiUrl(`/api/benchmark_results/${result.id}`), dataToSend, { headers });
      } else {
        await axios.post(buildApiUrl('/api/benchmark_results/'), dataToSend, { headers });
      }
      onSave();
    } catch (error) {
      console.error('Error saving result:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {result ? 'Edit' : 'Add New'} Benchmark Result
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Benchmark
              </label>
              <select
                value={formData.benchmark_id}
                onChange={(e) => setFormData({ ...formData, benchmark_id: parseInt(e.target.value) })}
                className="input-field"
                required
              >
                <option value="">Select a benchmark</option>
                {benchmarks.map((benchmark) => (
                  <option key={benchmark.id} value={benchmark.id}>
                    {benchmark.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Test System
              </label>
              <select
                value={formData.config_id}
                onChange={(e) => setFormData({ ...formData, config_id: parseInt(e.target.value) })}
                className="input-field"
                required
              >
                <option value="">Select Test System</option>
                {configurations.map((config) => (
                  <option key={config.id} value={config.id}>
                    {config.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Result Score
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.result}
              onChange={(e) => setFormData({ ...formData, result: parseFloat(e.target.value) })}
              className="input-field"
              placeholder="Enter benchmark result score"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.timestamp ? formData.timestamp.slice(0, 10) : ''}
              onChange={(e) => setFormData({ ...formData, timestamp: new Date(e.target.value + 'T00:00:00').toISOString() })}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field"
              rows="3"
              placeholder="Optional notes about this result"
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
              {result ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Compare Form Component
const CompareForm = ({ configurations, benchmarks, onClose }) => {
  const [formData, setFormData] = useState({
    config_id_1: '',
    config_id_2: ''
  });
  const [comparisonResults, setComparisonResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { apiKey } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.config_id_1 || !formData.config_id_2) {
      alert('Please select both test systems to compare');
      return;
    }
    if (formData.config_id_1 === formData.config_id_2) {
      alert('Please select two different test systems to compare');
      return;
    }

    setLoading(true);
    try {
      const headers = { 'X-API-Key': apiKey };
      const url = buildApiUrl(
        `/api/benchmark_results/compare/configs?config_id_1=${formData.config_id_1}&config_id_2=${formData.config_id_2}`
      );
      const response = await axios.get(url, { headers });
      setComparisonResults(response.data);
    } catch (error) {
      console.error('Error fetching comparison:', error);
      setComparisonResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getConfigName = (configId) => {
    const config = configurations.find(c => c.id === parseInt(configId));
    return config ? config.name : 'Unknown';
  };

  const getBenchmarkName = (benchmarkId) => {
    const benchmark = benchmarks.find(b => b.id === benchmarkId);
    return benchmark ? benchmark.name : `Benchmark ${benchmarkId}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Compare Test Systems
        </h2>
        
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Test System 1
              </label>
              <select
                value={formData.config_id_1}
                onChange={(e) => setFormData({ ...formData, config_id_1: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select first test system</option>
                {configurations.map((config) => (
                  <option key={config.id} value={config.id}>
                    {config.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Test System 2
              </label>
              <select
                value={formData.config_id_2}
                onChange={(e) => setFormData({ ...formData, config_id_2: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select second test system</option>
                {configurations.map((config) => (
                  <option key={config.id} value={config.id}>
                    {config.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {loading ? 'Comparing...' : 'Compare'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </form>

        {/* Comparison Results */}
        {comparisonResults.length > 0 ? (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Comparison Results: {getConfigName(formData.config_id_1)} vs {getConfigName(formData.config_id_2)}
            </h3>
            
            {/* Bar Chart Comparison */}
            <div className="mb-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonResults}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="benchmark_id" 
                      tickFormatter={(value) => getBenchmarkName(value)}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      domain={[0, 'dataMax + (dataMax * 0.1)']}
                      tickCount={8}
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        value, 
                        name === 'config_1_result' ? getConfigName(formData.config_id_1) : getConfigName(formData.config_id_2)
                      ]}
                      labelFormatter={(value) => `Benchmark: ${getBenchmarkName(value)}`}
                    />
                    <Legend 
                      formatter={(value) => 
                        value === 'config_1_result' ? getConfigName(formData.config_id_1) : getConfigName(formData.config_id_2)
                      }
                    />
                    <Bar dataKey="config_1_result" fill="#3b82f6" name="config_1_result" />
                    <Bar dataKey="config_2_result" fill="#10b981" name="config_2_result" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Overall Performance Summary */}
            <div className="mb-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg w-full">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      Overall Performance
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {comparisonResults.reduce((sum, r) => sum + r.percentage_change, 0) > 0 ? 'Improvement' : 'Regression'}
                    </p>
                  </div>
                  <p className={`text-3xl font-bold ${
                    comparisonResults.reduce((sum, r) => sum + r.percentage_change, 0) > 0 
                      ? 'text-green-900 dark:text-green-100' 
                      : 'text-red-900 dark:text-red-100'
                  }`}>
                    {comparisonResults.length > 0 ? 
                      Math.round(comparisonResults.reduce((sum, r) => sum + r.percentage_change, 0) / comparisonResults.length) : 
                      0
                    }%
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Results Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Benchmark
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {getConfigName(formData.config_id_1)}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {getConfigName(formData.config_id_2)}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Difference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      % Change
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {comparisonResults.map((result, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {getBenchmarkName(result.benchmark_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {result.config_1_result}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                          {result.config_2_result}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          result.config_2_result > result.config_1_result 
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}>
                          {result.config_2_result > result.config_1_result ? '+' : ''}
                          {result.config_2_result - result.config_1_result}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          result.percentage_change > 0 
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}>
                          {result.percentage_change > 0 ? '+' : ''}
                          {result.percentage_change}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="border-t pt-6">
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select two test systems and click "Compare Systems" to see results</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;
