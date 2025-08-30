import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Filter,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Results = () => {
  const { apiKey } = useAuth();
  const [results, setResults] = useState([]);
  const [benchmarks, setBenchmarks] = useState([]);
  const [configurations, setConfigurations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    benchmark: '',
    configuration: '',
    dateFrom: '',
    dateTo: ''
  });

  const fetchData = useCallback(async () => {
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
  }, [apiKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        <Filter className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Performance Comparison</h3>
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
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No data available for the selected filters</p>
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
                Configuration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Notes
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
                      {result.score}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(result.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {result.notes || 'No notes'}
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Results
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View and analyze your benchmark results
        </p>
      </div>

      {/* Filters */}
      {renderFilters()}

      {/* Chart */}
      {renderChart()}

      {/* Results Table */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Benchmark Results
        </h2>
        {renderResultsTable()}
      </div>
    </div>
  );
};

export default Results;
