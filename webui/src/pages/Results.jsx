import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
import ConfirmModal from '../components/ConfirmModal';
import PublicThemeToggle from '../components/PublicThemeToggle';
import SearchableSelect from '../components/SearchableSelect';
import { formatResultId, formatSystemId, idBadgeClass } from '../utils/displayIds';

const formatResultSettings = (value) => {
  const parts = (value || '').split(',').map((part) => part.trim()).filter(Boolean);
  return [...new Set(parts)].join(', ') || 'Default settings';
};

const notify = (message, type = 'warning', duration) => {
  if (window.showToast) {
    window.showToast(message, type, duration);
  }
};

const parseComponentIds = (raw, fallbackId, fallbackQuantity = 1) => {
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((value) => parseInt(value, 10)).filter(Boolean);
      }
    } catch {
      // Fall back to legacy fields below.
    }
  }

  if (!fallbackId) return [];
  return Array.from(
    { length: Math.max(parseInt(fallbackQuantity, 10) || 1, 1) },
    () => fallbackId
  );
};

const Results = () => {
  const { apiKey, isAuthenticated } = useAuth();
  const [results, setResults] = useState([]);
  const [benchmarks, setBenchmarks] = useState([]);
  const [benchmarkOptions, setBenchmarkOptions] = useState([]);
  const [configurations, setConfigurations] = useState([]);
  const [cpus, setCpus] = useState([]);
  const [gpus, setGpus] = useState([]);
  const [cpuBrands, setCpuBrands] = useState([]);
  const [cpuFamilies, setCpuFamilies] = useState([]);
  const [gpuManufacturers, setGpuManufacturers] = useState([]);
  const [gpuBrands, setGpuBrands] = useState([]);
  const [gpuModels, setGpuModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showCompareForm, setShowCompareForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [filters, setFilters] = useState({
    benchmark: '',
    configuration: '',
    cpu: '',
    gpu: '',
    dateFrom: '',
    dateTo: ''
  });

  const configurationOptions = configurations.map((config) => ({
    id: config.id,
    name: config.name,
    searchText: `${formatSystemId(config.id)} ${config.name}`,
  }));

  const benchmarkOptionsForSelect = benchmarks.map((benchmark) => ({
    id: benchmark.id,
    name: benchmark.name,
  }));

  const cpuOptions = cpus.map((cpu) => {
    const brand = cpuBrands.find(b => b.id === cpu.cpu_brand_id);
    const family = cpuFamilies.find(f => f.id === cpu.cpu_family_id);
    const name = `${brand?.name || 'Unknown'} ${family?.name || 'Unknown'} ${cpu.model}`;
    const description = `${cpu.speed} - ${cpu.core_count} Cores${cpu.serial ? ` - ${cpu.serial}` : ''}`;
    return {
      id: cpu.id,
      name,
      description,
      searchText: `${name} ${description}`,
    };
  });

  const gpuOptions = gpus.map((gpu) => {
    const manufacturer = gpuManufacturers.find(m => m.id === gpu.gpu_manufacturer_id);
    const brand = gpuBrands.find(b => b.id === gpu.gpu_brand_id);
    const model = gpuModels.find(m => m.id === gpu.gpu_model_id);
    const name = `${manufacturer?.name || 'Unknown'} ${brand?.name || 'Unknown'} ${model?.name || 'Unknown'}`;
    const description = `${gpu.vram_size}${gpu.serial ? ` - ${gpu.serial}` : ''}`;
    return {
      id: gpu.id,
      name,
      description,
      searchText: `${name} ${description}`,
    };
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isAuthenticated || !apiKey) {
        const response = await axios.get(buildApiUrl('/api/public/results-data'));
        setResults(response.data.results);
        setBenchmarks(response.data.benchmarks);
        setBenchmarkOptions(response.data.benchmarkOptions || []);
        setConfigurations(response.data.configurations);
        setCpus(response.data.cpus);
        setGpus(response.data.gpus);
        setCpuBrands(response.data.cpuBrands);
        setCpuFamilies(response.data.cpuFamilies);
        setGpuManufacturers(response.data.gpuManufacturers);
        setGpuBrands(response.data.gpuBrands);
        setGpuModels(response.data.gpuModels);
        return;
      }

      const headers = { 'X-API-Key': apiKey };
      const [
        resultsRes, benchmarksRes, configsRes, cpusRes, gpusRes,
        cpuBrandsRes, cpuFamiliesRes, gpuManufacturersRes, gpuBrandsRes, gpuModelsRes,
        benchmarkOptionsRes
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
        axios.get(buildApiUrl('/api/gpu/model/'), { headers }),
        axios.get(buildApiUrl('/api/benchmark/options/'), { headers })
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
      setBenchmarkOptions(benchmarkOptionsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Could not load benchmark results.');
    } finally {
      setLoading(false);
    }
  }, [apiKey, isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [filteredResults, setFilteredResults] = useState([]);

  const filterLocalResults = useCallback(() => {
    let filtered = [...results];

    if (filters.configuration) {
      filtered = filtered.filter(r => r.config_id === parseInt(filters.configuration));
    }
    if (filters.benchmark) {
      filtered = filtered.filter(r => r.benchmark_id === parseInt(filters.benchmark));
    }
    if (filters.cpu) {
      const configIds = configurations
        .filter(config => parseComponentIds(config.cpu_component_ids, config.cpu_id, config.cpu_quantity).includes(parseInt(filters.cpu)))
        .map(config => config.id);
      filtered = filtered.filter(r => configIds.includes(r.config_id));
    }
    if (filters.gpu) {
      const configIds = configurations
        .filter(config => parseComponentIds(config.gpu_component_ids, config.gpu_id, config.gpu_quantity).includes(parseInt(filters.gpu)))
        .map(config => config.id);
      filtered = filtered.filter(r => configIds.includes(r.config_id));
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

    return filtered;
  }, [configurations, filters, results]);

  const handleEditResult = (result) => {
    if (!isAuthenticated) {
      notify('Please log in to edit results');
      return;
    }
    setEditingItem(result);
    setShowForm(true);
  };

  const requestDeleteResult = (resultId) => {
    if (!isAuthenticated) {
      notify('Please log in to delete results');
      return;
    }
    setDeleteTargetId(resultId);
  };

  const handleDeleteResult = async () => {
    if (!deleteTargetId) return;

    try {
      const headers = { 'X-API-Key': apiKey };
      await axios.delete(buildApiUrl(`/api/benchmark_results/${deleteTargetId}`), { headers });
      setDeleteTargetId(null);
      fetchData();
      fetchFilteredResults();
      notify('Result deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting result:', error);
      notify('Failed to delete result', 'error');
    }
  };

  const fetchFilteredResults = useCallback(async () => {
    if (!isAuthenticated || !apiKey) {
      setFilteredResults(filterLocalResults());
      return;
    }

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
  }, [filters, apiKey, results, isAuthenticated, filterLocalResults]);

  useEffect(() => {
    fetchFilteredResults();
  }, [fetchFilteredResults]);

  const formatDate = (value) => {
    try {
      const date = new Date(value);
      return date.getTime() > 0 ? date.toLocaleDateString() : 'No date';
    } catch {
      return 'Invalid date';
    }
  };

  const formatScore = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return value || 'N/A';
    return numeric.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

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
      
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[repeat(5,minmax(0,1fr))_auto]">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Test System
          </label>
          <SearchableSelect
            value={filters.configuration}
            onChange={(value) => setFilters({ ...filters, configuration: value ? String(value) : '' })}
            options={configurationOptions}
            placeholder="All"
            searchPlaceholder="Search test systems..."
            size="sm"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Benchmark
          </label>
          <SearchableSelect
            value={filters.benchmark}
            onChange={(value) => setFilters({ ...filters, benchmark: value ? String(value) : '' })}
            options={benchmarkOptionsForSelect}
            placeholder="All"
            searchPlaceholder="Search benchmarks..."
            size="sm"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            CPU
          </label>
          <SearchableSelect
            value={filters.cpu}
            onChange={(value) => setFilters({ ...filters, cpu: value ? String(value) : '' })}
            options={cpuOptions}
            placeholder="All"
            searchPlaceholder="Search CPUs..."
            size="sm"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            GPU
          </label>
          <SearchableSelect
            value={filters.gpu}
            onChange={(value) => setFilters({ ...filters, gpu: value ? String(value) : '' })}
            options={gpuOptions}
            placeholder="All"
            searchPlaceholder="Search GPUs..."
            size="sm"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date
          </label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="input-field h-8 py-1 text-sm"
          />
        </div>
        
        <div className="flex items-end xl:justify-end">
          <button
            onClick={() => setFilters({
              benchmark: '',
              configuration: '',
              cpu: '',
              gpu: '',
              dateFrom: '',
              dateTo: ''
            })}
            className="inline-flex h-8 items-center rounded bg-gray-600 px-3 text-xs font-medium text-white transition-colors hover:bg-gray-700"
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

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={fetchData}
            className="btn-primary mt-4"
          >
            Retry
          </button>
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
      <div className="space-y-4">
        {filteredResults.map((result) => {
          const benchmark = benchmarks.find(b => b.id === result.benchmark_id);
          const config = configurations.find(c => c.id === result.config_id);
          return (
            <article
              key={result.id}
              className="rounded-md border border-gray-200 bg-white transition-colors hover:border-primary-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary-800"
            >
              <div className="flex flex-col gap-4 border-b border-gray-200 p-4 dark:border-gray-800 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={idBadgeClass}>{formatResultId(result.id)}</span>
                    {benchmark?.lower_is_better && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        lower is better
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 break-words text-lg font-semibold text-gray-950 dark:text-white">
                    {benchmark?.name || 'Unknown benchmark'}
                  </h3>
                  <p className="mt-1 break-words text-sm text-gray-500 dark:text-gray-400">
                    {formatResultSettings(result.settings)}
                  </p>
                </div>
                <div className="flex shrink-0 items-start gap-3">
                  <div className="flex h-[60px] w-24 flex-col items-center justify-center rounded-md bg-primary-700 px-3 py-2 text-center text-white shadow-sm dark:bg-primary-400 dark:text-primary-950">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-100 dark:text-primary-950/70">Score</p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums">{formatScore(result.result)}</p>
                  </div>
                  {isAuthenticated && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditResult(result)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                        title="Edit Result"
                        aria-label="Edit Result"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => requestDeleteResult(result.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-50 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                        title="Delete Result"
                        aria-label="Delete Result"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 p-4 md:grid-cols-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Test System</p>
                  {config ? (
                    <>
                      <Link
                        to={`/systems/${config.id}`}
                        className="mt-1 block break-words text-sm font-medium text-primary-700 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-200"
                      >
                        {config.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{formatSystemId(config.id)}</p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Unknown system</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</p>
                  <p className="mt-1 text-sm font-medium text-gray-950 dark:text-white">{formatDate(result.timestamp)}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Settings</p>
                  <p className="mt-1 break-words text-sm font-medium text-gray-950 dark:text-white">{formatResultSettings(result.settings)}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Notes</p>
                  <p className="mt-1 break-words text-sm text-gray-700 dark:text-gray-300">{result.notes || 'No notes'}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Results
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            View and analyze your benchmark results
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PublicThemeToggle />
          {isAuthenticated && (
            <>
            <button
              onClick={() => setShowCompareForm(true)}
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
            >
              Compare Test Systems
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
            >
              Add New Result
            </button>
            </>
          )}
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
      <div>
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
          benchmarkOptions={benchmarkOptions}
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

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteResult}
        title="Delete Result"
        message="Are you sure you want to delete this benchmark result? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

// Result Form Component
const decodeOptionValues = (value) => {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const decodeOptionChoices = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Fall back to comma/newline text.
  }
  return String(value).split(/[\n,]/).map(item => item.trim()).filter(Boolean);
};

const ResultForm = ({ result, onClose, onSave, benchmarks, benchmarkOptions, configurations }) => {
  const [formData, setFormData] = useState({
    benchmark_id: '',
    config_id: '',
    result: '',
    settings: '',
    option_values: '',
    timestamp: new Date().toISOString(),
    notes: ''
  });
  const [optionSelections, setOptionSelections] = useState({});
  const { apiKey } = useAuth();
  const selectedBenchmarkOptions = benchmarkOptions
    .filter(option => option.benchmark_id === parseInt(formData.benchmark_id))
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  const benchmarkSelectOptions = benchmarks.map((benchmark) => ({
    id: benchmark.id,
    name: benchmark.name,
  }));
  const configurationSelectOptions = configurations.map((config) => ({
    id: config.id,
    name: config.name,
    searchText: `${formatSystemId(config.id)} ${config.name}`,
  }));

  useEffect(() => {
    if (result) {
      const parsedOptionValues = decodeOptionValues(result.option_values);
      setFormData({
        benchmark_id: result.benchmark_id,
        config_id: result.config_id,
        result: result.result,
        settings: Object.keys(parsedOptionValues).length ? '' : result.settings || '',
        option_values: result.option_values || '',
        timestamp: result.timestamp || new Date().toISOString(),
        notes: result.notes || ''
      });
      setOptionSelections(parsedOptionValues);
    } else {
      setFormData({
        benchmark_id: '',
        config_id: '',
        result: '',
        settings: '',
        option_values: '',
        timestamp: new Date().toISOString(),
        notes: ''
      });
      setOptionSelections({});
    }
  }, [result]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const headers = { 'X-API-Key': apiKey };
      const selectedOptions = selectedBenchmarkOptions.reduce((acc, option) => {
        const selected = (optionSelections[String(option.id)] || '').trim();
        if (selected) acc[String(option.id)] = selected;
        return acc;
      }, {});
      const dataToSend = {
        ...formData,
        option_values: Object.keys(selectedOptions).length ? JSON.stringify(selectedOptions) : null,
        settings: (formData.settings || '').trim() || null,
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
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
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
              <SearchableSelect
                value={formData.benchmark_id}
                onChange={(value) => {
                  setFormData({ ...formData, benchmark_id: value ? parseInt(value) : '', settings: '' });
                  setOptionSelections({});
                }}
                options={benchmarkSelectOptions}
                placeholder="Select a benchmark"
                searchPlaceholder="Search benchmarks..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Test System
              </label>
              <SearchableSelect
                value={formData.config_id}
                onChange={(value) => setFormData({ ...formData, config_id: value ? parseInt(value) : '' })}
                options={configurationSelectOptions}
                placeholder="Select Test System"
                searchPlaceholder="Search test systems..."
                required
              />
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

          {selectedBenchmarkOptions.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {selectedBenchmarkOptions.map((option) => {
                const choices = decodeOptionChoices(option.values);
                return (
                  <div key={option.id}>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {option.name}
                    </label>
                    <SearchableSelect
                      value={optionSelections[String(option.id)] || ''}
                      onChange={(value) => setOptionSelections(current => ({
                        ...current,
                        [String(option.id)]: value,
                      }))}
                      options={choices.map((choice) => ({ id: choice, name: choice }))}
                      placeholder={`Select ${option.name}`}
                      searchPlaceholder={`Search ${option.name}...`}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Custom Settings
            </label>
            <input
              type="text"
              value={formData.settings}
              onChange={(e) => setFormData({ ...formData, settings: e.target.value })}
              className="input-field"
              placeholder={selectedBenchmarkOptions.length ? 'Optional extra settings' : 'e.g., 1024x768, 32-bit color, default settings'}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {selectedBenchmarkOptions.length
                ? 'Dropdown selections will generate the main settings text. Use this only for extra run notes.'
                : 'Use this when the benchmark has no predefined dropdown options.'}
            </p>
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
    config_id_2: '',
    benchmark_id: ''
  });
  const [comparisonResults, setComparisonResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { apiKey } = useAuth();
  const configurationSelectOptions = configurations.map((config) => ({
    id: config.id,
    name: config.name,
    searchText: `${formatSystemId(config.id)} ${config.name}`,
  }));
  const benchmarkSelectOptions = benchmarks.map((benchmark) => ({
    id: benchmark.id,
    name: benchmark.name,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.config_id_1 || !formData.config_id_2) {
      notify('Please select both test systems to compare');
      return;
    }
    if (formData.config_id_1 === formData.config_id_2) {
      notify('Please select two different test systems to compare');
      return;
    }

    setLoading(true);
    try {
      const headers = { 'X-API-Key': apiKey };
      const params = new URLSearchParams({
        config_id_1: formData.config_id_1,
        config_id_2: formData.config_id_2,
      });
      if (formData.benchmark_id) {
        params.set('benchmark_id', formData.benchmark_id);
      }
      const url = buildApiUrl(`/api/benchmark_results/compare/configs?${params.toString()}`);
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
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Compare Test Systems
        </h2>
        
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Test System 1
              </label>
              <SearchableSelect
                value={formData.config_id_1}
                onChange={(value) => setFormData({ ...formData, config_id_1: value ? String(value) : '' })}
                options={configurationSelectOptions}
                placeholder="Select first test system"
                searchPlaceholder="Search test systems..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Test System 2
              </label>
              <SearchableSelect
                value={formData.config_id_2}
                onChange={(value) => setFormData({ ...formData, config_id_2: value ? String(value) : '' })}
                options={configurationSelectOptions}
                placeholder="Select second test system"
                searchPlaceholder="Search test systems..."
                required
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Benchmark
              </label>
              <SearchableSelect
                value={formData.benchmark_id}
                onChange={(value) => setFormData({ ...formData, benchmark_id: value ? String(value) : '' })}
                options={benchmarkSelectOptions}
                placeholder="All shared benchmarks"
                searchPlaceholder="Search benchmarks..."
              />
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
              {formData.benchmark_id ? ` - ${getBenchmarkName(parseInt(formData.benchmark_id))}` : ''}
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
                      Settings
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
                      <td className="max-w-xs px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        <span className="line-clamp-2">{formatResultSettings(result.settings)}</span>
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
