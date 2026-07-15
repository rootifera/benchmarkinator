import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, Trophy } from 'lucide-react';
import {
  compareScores,
  formatBenchmarkId,
  formatDate,
  formatResultId,
  formatScore,
  usePublicData,
} from '../utils/publicData';

const getParam = (params, key, fallback = '') => params.get(key) || fallback;

const formatComponentSummary = (items, fallback) => {
  if (!items?.length) return fallback;
  const first = items[0];
  const count = items.reduce((total, item) => total + (item.count || 1), 0);
  return count > 1 ? `${first.title} +${count - 1}` : first.title;
};

const ScorePill = ({ id, value }) => (
  <span
    title={formatResultId(id)}
    className="inline-flex w-24 justify-center rounded-md bg-primary-700 px-2.5 py-1 text-sm font-semibold tabular-nums text-white shadow-sm dark:bg-primary-400 dark:text-primary-950"
  >
    {formatScore(value)}
  </span>
);

const PublicResults = () => {
  const { loading, error, refetch, resultRecords, filterOptions } = usePublicData();
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = {
    q: getParam(searchParams, 'q'),
    benchmark: getParam(searchParams, 'benchmark'),
    system: getParam(searchParams, 'system'),
    cpu: getParam(searchParams, 'cpu'),
    gpu: getParam(searchParams, 'gpu'),
    os: getParam(searchParams, 'os'),
    sort: getParam(searchParams, 'sort', 'newest'),
  };

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams({});

  const selectedBenchmark = filterOptions.benchmarks.find((benchmark) => String(benchmark.id) === filters.benchmark);

  const filteredResults = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    let records = [...resultRecords];

    if (q) records = records.filter((record) => record.searchText.includes(q));
    if (filters.benchmark) records = records.filter((record) => String(record.benchmark?.id) === filters.benchmark);
    if (filters.system) records = records.filter((record) => String(record.system?.id) === filters.system);
    if (filters.cpu) records = records.filter((record) => record.system?.cpuNames.includes(filters.cpu));
    if (filters.gpu) records = records.filter((record) => record.system?.gpuNames.includes(filters.gpu));
    if (filters.os) records = records.filter((record) => record.system?.osName === filters.os);

    records.sort((a, b) => {
      if (filters.sort === 'best') {
        if (selectedBenchmark) {
          return compareScores(a.result, b.result, selectedBenchmark.lower_is_better);
        }
        return Number(b.result.result) - Number(a.result.result);
      }
      if (filters.sort === 'benchmark') {
        return (a.benchmark?.name || '').localeCompare(b.benchmark?.name || '') || (a.system?.name || '').localeCompare(b.system?.name || '');
      }
      if (filters.sort === 'system') {
        return (a.system?.name || '').localeCompare(b.system?.name || '') || (a.benchmark?.name || '').localeCompare(b.benchmark?.name || '');
      }
      return new Date(b.date || 0) - new Date(a.date || 0);
    });

    return records;
  }, [filters, resultRecords, selectedBenchmark]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950">
        <p className="font-medium text-red-800 dark:text-red-200">{error}</p>
        <button type="button" onClick={refetch} className="btn-primary mt-4">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center text-lg font-semibold text-gray-950 dark:text-white">
            <Filter className="mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" />
            Filters
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Filters work together - combine benchmark, test system, hardware, and sorting filters
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto]">
          <label>
            <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Search</span>
            <input
              type="search"
              value={filters.q}
              onChange={(event) => setFilter('q', event.target.value)}
              placeholder="Benchmark, system, notes..."
              className="input-field h-8 py-1 text-sm"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Benchmark</span>
            <select value={filters.benchmark} onChange={(event) => setFilter('benchmark', event.target.value)} className="input-field h-8 py-1 text-sm">
              <option value="">All</option>
              {filterOptions.benchmarks.map((benchmark) => <option key={benchmark.id} value={benchmark.id}>{benchmark.name}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Test System</span>
            <select value={filters.system} onChange={(event) => setFilter('system', event.target.value)} className="input-field h-8 py-1 text-sm">
              <option value="">All</option>
              {filterOptions.systems.map((system) => <option key={system.id} value={system.id}>{system.name}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">CPU</span>
            <select value={filters.cpu} onChange={(event) => setFilter('cpu', event.target.value)} className="input-field h-8 py-1 text-sm">
              <option value="">All</option>
              {filterOptions.cpus.map((cpu) => <option key={cpu} value={cpu}>{cpu}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">GPU</span>
            <select value={filters.gpu} onChange={(event) => setFilter('gpu', event.target.value)} className="input-field h-8 py-1 text-sm">
              <option value="">All</option>
              {filterOptions.gpus.map((gpu) => <option key={gpu} value={gpu}>{gpu}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Sort</span>
            <select value={filters.sort} onChange={(event) => setFilter('sort', event.target.value)} className="input-field h-8 py-1 text-sm">
              <option value="newest">Newest</option>
              <option value="best">Best score</option>
              <option value="benchmark">Benchmark</option>
              <option value="system">System</option>
            </select>
          </label>
          <div className="flex items-end">
            <button type="button" onClick={clearFilters} className="inline-flex h-8 items-center justify-center rounded-md bg-gray-600 px-3 text-xs font-medium text-white transition-colors hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600">
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-gray-950 dark:text-white">Benchmark Results</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredResults.length} of {resultRecords.length} results
        </div>
      </div>

      <div className="rounded-md border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {filteredResults.length === 0 ? (
          <div className="p-10 text-center">
            <Trophy className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-3 font-medium text-gray-950 dark:text-white">No results match those filters.</p>
            <button type="button" onClick={clearFilters} className="btn-primary mt-4">Clear filters</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-950">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Benchmark</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Settings</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">System</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Hardware</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Score</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredResults.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td
                      className="px-5 py-4 text-sm font-medium text-gray-950 dark:text-white"
                      title={`${formatBenchmarkId(record.benchmark?.id)} ${record.benchmark?.name || 'Unknown'}`}
                    >
                      {record.benchmark?.name || 'Unknown'}
                      {record.benchmark?.lower_is_better && (
                        <span className="mt-1 block w-max rounded-full border border-gray-300 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:border-gray-700 dark:text-gray-400">
                          lower is better
                        </span>
                      )}
                    </td>
                    <td className="max-w-xs px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <span className="line-clamp-2">{record.settingsLabel}</span>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <Link
                        to={`/systems/${record.system?.id}`}
                        title={`${record.system?.publicId || 'SYS-?'} ${record.system?.name || 'Unknown'}`}
                        className="font-medium text-primary-700 hover:text-primary-900 dark:text-primary-300"
                      >
                        {record.system?.name || 'Unknown'}
                      </Link>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{record.system?.osName}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <p>{formatComponentSummary(record.system?.cpuDetails, 'Unknown CPU')}</p>
                      <p className="mt-1">{formatComponentSummary(record.system?.gpuDetails, 'Unknown GPU')}</p>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <ScorePill id={record.id} value={record.result.result} />
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{formatDate(record.date)}</td>
                    <td className="max-w-xs px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <span className="line-clamp-3">{record.result.notes || 'No notes'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicResults;
