import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Edit,
  Trash2,
  Target,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Plus,
  X
} from 'lucide-react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';
import ConfirmModal from '../components/ConfirmModal';
import { formatBenchmarkId, formatTargetId, idBadgeClass } from '../utils/displayIds';

const notify = (message, type = 'warning', duration) => {
  if (window.showToast) {
    window.showToast(message, type, duration);
  }
};

const Benchmarks = () => {
  const { apiKey } = useAuth();
  const [benchmarks, setBenchmarks] = useState([]);
  const [benchmarkOptions, setBenchmarkOptions] = useState([]);
  const [benchmarkTargets, setBenchmarkTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showTargetForm, setShowTargetForm] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    benchmarkTargets: false, // Collapsed by default
    benchmarks: true         // Expanded by default
  });

  const fetchBenchmarks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { 'X-API-Key': apiKey };
      const [benchmarksRes, targetsRes, optionsRes] = await Promise.all([
        axios.get(buildApiUrl('/api/benchmark/'), { headers }),
        axios.get(buildApiUrl('/api/benchmark/target/'), { headers }),
        axios.get(buildApiUrl('/api/benchmark/options/'), { headers })
      ]);
      setBenchmarks(benchmarksRes.data);
      setBenchmarkTargets(targetsRes.data);
      setBenchmarkOptions(optionsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Could not load benchmarks.');
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    fetchBenchmarks();
  }, [fetchBenchmarks]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const requestDelete = (type, id) => {
    setDeleteTarget({ type, id });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const isTarget = deleteTarget.type === 'target';
    const endpoint = isTarget
      ? `/api/benchmark/target/${deleteTarget.id}`
      : `/api/benchmark/${deleteTarget.id}`;
    const label = isTarget ? 'Benchmark target' : 'Benchmark';

    try {
      const headers = { 'X-API-Key': apiKey };
      await axios.delete(buildApiUrl(endpoint), { headers });
      setDeleteTarget(null);
      fetchBenchmarks();
      notify(`${label} deleted successfully`, 'success');
    } catch (error) {
      console.error(`Error deleting ${label.toLowerCase()}:`, error);
      if (error.response?.status === 409) {
        notify(`Cannot delete this ${label.toLowerCase()} because it is currently being used.`, 'error', 8000);
      } else {
        notify(`Failed to delete ${label.toLowerCase()}`, 'error');
      }
    }
  };

  const handleEditTarget = (target) => {
    setEditingTarget(target);
    setShowTargetForm(true);
  };

  const renderTable = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={fetchBenchmarks}
            className="btn-primary mt-4"
          >
            Retry
          </button>
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
      <div className="space-y-4">
        {benchmarks.map((benchmark) => {
          const target = benchmarkTargets.find(t => t.id === benchmark.benchmark_target_id);
          const options = benchmarkOptions
            .filter(option => option.benchmark_id === benchmark.id)
            .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
          return (
            <article
              key={benchmark.id}
              className="rounded-md border border-gray-200 bg-white transition-colors hover:border-primary-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary-800"
            >
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={idBadgeClass}>{formatBenchmarkId(benchmark.id)}</span>
                    {benchmark.lower_is_better && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        lower is better
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 break-words text-lg font-semibold text-gray-950 dark:text-white">
                    {benchmark.name}
                  </h3>
                  <p className="mt-1 flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Target className="mr-1.5 h-4 w-4 text-primary-600 dark:text-primary-400" />
                    {target?.name || 'No target'}
                    {target && <span className="ml-2 text-xs text-gray-500 dark:text-gray-500">{formatTargetId(target.id)}</span>}
                  </p>
                  {options.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {options.map((option) => (
                        <span key={option.id} className="max-w-full break-words rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {option.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => { setEditingItem(benchmark); setShowForm(true); }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-primary-600 transition-colors hover:bg-primary-50 hover:text-primary-900 dark:text-primary-400 dark:hover:bg-primary-900/20 dark:hover:text-primary-300"
                    title="Edit benchmark"
                    aria-label="Edit benchmark"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => requestDelete('benchmark', benchmark.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-50 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                    title="Delete benchmark"
                    aria-label="Delete benchmark"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('benchmarkTargets')}
          >
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Benchmark Targets</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Define what components benchmarks can target (CPU, GPU, Memory, etc.)
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTargetForm(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
              >
                Add Target
              </button>
              {expandedSections.benchmarkTargets ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
            </div>
          </div>
          {expandedSections.benchmarkTargets && (
            <div className="mt-4">
              <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ID
                  </th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <span className={idBadgeClass}>{formatTargetId(target.id)}</span>
                    </td>
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
                          onClick={() => requestDelete('target', target.id)}
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
          )}
        </div>

        {/* Benchmarks Section */}
        <div className="card">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('benchmarks')}
          >
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Benchmarks</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage benchmark tests for performance evaluation
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowForm(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
              >
                Add Benchmark
              </button>
              {expandedSections.benchmarks ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
            </div>
          </div>
          
          {expandedSections.benchmarks && (
            <div className="mt-4">
              {renderTable()}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <BenchmarkForm
          benchmark={editingItem}
          benchmarkTargets={benchmarkTargets}
          benchmarkOptions={benchmarkOptions}
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

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={deleteTarget?.type === 'target' ? 'Delete Benchmark Target' : 'Delete Benchmark'}
        message={
          deleteTarget?.type === 'target'
            ? 'Are you sure you want to delete this benchmark target? This action cannot be undone.'
            : 'Are you sure you want to delete this benchmark? This action cannot be undone.'
        }
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

// Benchmark Form Component
const parseOptionValues = (value) => (
  (value || '')
    .split(/[\n,]/)
    .map(item => item.trim())
    .filter(Boolean)
);

const decodeOptionValues = (value) => {
  if (!value) return '';
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.join('\n');
  } catch {
    // Old/manual values can still be edited as plain text.
  }
  return value;
};

const BenchmarkForm = ({ benchmark, benchmarkTargets, benchmarkOptions, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    benchmark_target_id: '',
    lower_is_better: false,
  });
  const [options, setOptions] = useState([]);
  const { apiKey } = useAuth();

  useEffect(() => {
    if (benchmark) {
      setFormData({
        name: benchmark.name ?? '',
        benchmark_target_id: benchmark.benchmark_target_id ?? '',
        lower_is_better: !!benchmark.lower_is_better,
      });
      setOptions(
        benchmarkOptions
          .filter(option => option.benchmark_id === benchmark.id)
          .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
          .map(option => ({
            id: option.id,
            name: option.name,
            valuesText: decodeOptionValues(option.values),
          }))
      );
    } else {
      setFormData({
        name: '',
        benchmark_target_id: '',
        lower_is_better: false,
      });
      setOptions([]);
    }
  }, [benchmark, benchmarkOptions]);

  const addOption = () => {
    setOptions(current => [...current, { id: null, name: '', valuesText: '' }]);
  };

  const updateOption = (index, updates) => {
    setOptions(current => current.map((option, optionIndex) => (
      optionIndex === index ? { ...option, ...updates } : option
    )));
  };

  const removeOption = (index) => {
    setOptions(current => current.filter((_, optionIndex) => optionIndex !== index));
  };

  const syncBenchmarkOptions = async (benchmarkId, headers) => {
    const existingOptions = benchmarkOptions.filter(option => option.benchmark_id === benchmarkId);
    const keptIds = new Set(options.map(option => option.id).filter(Boolean));

    await Promise.all(
      existingOptions
        .filter(option => !keptIds.has(option.id))
        .map(option => axios.delete(buildApiUrl(`/api/benchmark/options/${option.id}`), { headers }))
    );

    for (const [index, option] of options.entries()) {
      const values = parseOptionValues(option.valuesText);
      const payload = {
        benchmark_id: benchmarkId,
        name: option.name.trim(),
        values: JSON.stringify(values),
        sort_order: index,
      };

      if (!payload.name && values.length === 0) continue;
      if (!payload.name || values.length === 0) {
        throw new Error('Each benchmark option needs a name and at least one value.');
      }

      if (option.id) {
        await axios.put(buildApiUrl(`/api/benchmark/options/${option.id}`), payload, { headers });
      } else {
        await axios.post(buildApiUrl('/api/benchmark/options/'), payload, { headers });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const headers = { 'X-API-Key': apiKey };

      const payload = {
        name: formData.name,
        benchmark_target_id:
          formData.benchmark_target_id === '' ? null : formData.benchmark_target_id,
        lower_is_better: !!formData.lower_is_better,
      };

      let savedBenchmark;
      if (benchmark) {
        const response = await axios.put(buildApiUrl(`/api/benchmark/${benchmark.id}`), payload, { headers });
        savedBenchmark = response.data;
      } else {
        const response = await axios.post(buildApiUrl('/api/benchmark/'), payload, { headers });
        savedBenchmark = response.data;
      }
      await syncBenchmarkOptions(savedBenchmark.id, headers);
      onSave();
    } catch (error) {
      console.error('Error saving benchmark:', error);
      notify(error.message || 'Failed to save benchmark', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex h-[min(42rem,calc(100dvh-2rem))] max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-900">
        <div className="shrink-0 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {benchmark ? 'Edit' : 'Add New'} Benchmark
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden" id="benchmark-form">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-6 py-5">
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
                    onChange={(e) => setFormData({ ...formData, benchmark_target_id: e.target.value ? parseInt(e.target.value) : '' })}
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

              {/* Lower is better */}
              <div className="flex items-center space-x-3 pt-2">
                <input
                  id="lower_is_better"
                  type="checkbox"
                  checked={!!formData.lower_is_better}
                  onChange={(e) => setFormData({ ...formData, lower_is_better: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label
                  htmlFor="lower_is_better"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 select-none"
                >
                  Lower is better (e.g., latency, compression time)
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-3 border-b border-gray-200 pb-2 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Result Options</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Optional dropdowns shown when adding results for this benchmark.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addOption}
                  className="inline-flex shrink-0 items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Option
                </button>
              </div>

              {options.length === 0 ? (
                <div className="rounded-md border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  No options defined. Results for this benchmark will not ask for extra settings.
                </div>
              ) : (
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={option.id || `new-${index}`} className="rounded-md border border-gray-200 p-4 dark:border-gray-800">
                      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="min-w-0">
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Option Name
                            </label>
                            <input
                              type="text"
                              value={option.name}
                              onChange={(e) => updateOption(index, { name: e.target.value })}
                              className="input-field"
                              placeholder="e.g., Resolution"
                            />
                          </div>
                          <div className="min-w-0">
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Values
                            </label>
                            <textarea
                              value={option.valuesText}
                              onChange={(e) => updateOption(index, { valuesText: e.target.value })}
                              className="input-field"
                              rows="3"
                              placeholder="800 x 600&#10;1024 x 768"
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Enter one per line, or comma-separated.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-50 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300 sm:mt-7"
                          title="Remove option"
                          aria-label="Remove option"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex shrink-0 space-x-3 border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
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
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
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
