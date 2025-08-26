import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart3, 
  Plus,
  Filter,
  TrendingUp,
  Calendar,
  Target
} from 'lucide-react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Results = () => {
  const { apiKey } = useAuth();
  const [results, setResults] = useState([]);
  const [benchmarks, setBenchmarks] = useState([]);
  const [configurations, setConfigurations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    benchmark: '',
    configuration: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { 'X-API-Key': apiKey };
      
      const [resultsRes, benchmarksRes, configsRes] = await Promise.all([
        axios.get('/api/benchmark_results/', { headers }),
        axios.get('/api/benchmark/', { headers }),
        axios.get('/api/config/', { headers })
      ]);

      setResults(resultsRes.data);
      setBenchmarks(benchmarksRes.data);
      setConfigurations(configsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter(result => {
    if (filters.benchmark && result.benchmark_id !== parseInt(filters.benchmark)) return false;
    if (filters.configuration && result.config_id !== parseInt(filters.configuration)) return false;
    if (filters.dateFrom && new Date(result.date) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(result.date) > new Date(filters.dateTo)) return false;
    return true;
  });

  const chartData = filteredResults.map(result => {
    const benchmark = benchmarks.find(b => b.id === result.benchmark_id);
    const config = configurations.find(c => c.id === result.config_id);
    return {
      name: `${benchmark?.name || 'Unknown'} - ${config?.name || 'Unknown'}`,
      score: result.score,
      date: new Date(result.date).toLocaleDateString(),
      benchmark: benchmark?.name || 'Unknown',
      configuration: config?.name || 'Unknown'
    };
  });

  const renderFilters = () => (
    <div className="card mb-6">
      <div className="flex items-center mb-4">
        <Filter className="w-5 h-5 mr-2 text-secondary-600" />
        <h3 className="text-lg font-medium text-secondary-900">Filters</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Benchmark
          </label>
          <select
            value={filters.benchmark}
            onChange={(e) => setFilters({ ...filters, benchmark: e.target.value })}
            className="input-field"
          >
            <option value="">All Benchmarks</option>
            {benchmarks.map(benchmark => (
              <option key={benchmark.id} value={benchmark.id}>
                {benchmark.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Configuration
          </label>
          <select
            value={filters.configuration}
            onChange={(e) => setFilters({ ...filters, configuration: e.target.value })}
            className="input-field"
          >
            <option value="">All Configurations</option>
            {configurations.map(config => (
              <option key={config.id} value={config.id}>
                {config.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Date From
          </label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="input-field"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Date To
          </label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="input-field"
          />
        </div>
      </div>
    </div>
  );

  const renderChart = () => (
    <div className="card mb-6">
      <h3 className="text-lg font-medium text-secondary-900 mb-4">Performance Comparison</h3>
      {chartData.length > 0 ? (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="score" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-8 text-secondary-500">
          No data available for the selected filters
        </div>
      )}
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
        <div className="text-center py-8 text-secondary-500">
          No results found matching the current filters
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-secondary-200">
          <thead className="bg-secondary-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Benchmark
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Configuration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-200">
            {filteredResults.map((result) => {
              const benchmark = benchmarks.find(b => b.id === result.benchmark_id);
              const config = configurations.find(c => c.id === result.config_id);
              
              return (
                <tr key={result.id} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                    {benchmark?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                    {config?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                    <span className="font-semibold text-lg">{result.score}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                    {new Date(result.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary-900">
                    {result.notes || '-'}
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Benchmark Results</h1>
          <p className="text-secondary-600 mt-2">
            View and analyze your benchmark results with charts and comparisons
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Result
        </button>
      </div>

      {renderFilters()}
      {renderChart()}

      {/* Results Table */}
      <div className="card">
        <h3 className="text-lg font-medium text-secondary-900 mb-4">Results</h3>
        {renderResultsTable()}
      </div>

      {/* Add Result Form Modal */}
      {showForm && (
        <ResultForm
          onClose={() => setShowForm(false)}
          onSave={() => {
            setShowForm(false);
            fetchData();
          }}
          benchmarks={benchmarks}
          configurations={configurations}
        />
      )}
    </div>
  );
};

// Result Form Component (simplified for now)
const ResultForm = ({ onClose, onSave, benchmarks, configurations }) => {
  const [formData, setFormData] = useState({
    benchmark_id: '',
    config_id: '',
    score: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const { apiKey } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const headers = { 'X-API-Key': apiKey };
      await axios.post('/api/benchmark_results/', formData, { headers });
      onSave();
    } catch (error) {
      console.error('Error saving result:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">
          Add New Result
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Benchmark
            </label>
            <select
              value={formData.benchmark_id}
              onChange={(e) => setFormData({ ...formData, benchmark_id: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Select Benchmark</option>
              {benchmarks.map(benchmark => (
                <option key={benchmark.id} value={benchmark.id}>
                  {benchmark.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Configuration
            </label>
            <select
              value={formData.config_id}
              onChange={(e) => setFormData({ ...formData, config_id: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Select Configuration</option>
              {configurations.map(config => (
                <option key={config.id} value={config.id}>
                  {config.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Score
            </label>
            <input
              type="number"
              value={formData.score}
              onChange={(e) => setFormData({ ...formData, score: e.target.value })}
              className="input-field"
              placeholder="Enter benchmark score"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input-field"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field"
              rows="3"
              placeholder="Additional notes about this result"
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
              Save Result
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Results;
