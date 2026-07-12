import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpDown, BarChart3, Search, Trophy, X } from 'lucide-react';
import { compareScores, formatDate, formatScore, usePublicData } from '../utils/publicData';

const getParam = (params, key, fallback = '') => params.get(key) || fallback;

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

  const activeFilters = [
    filters.q && ['q', `Search: ${filters.q}`],
    filters.benchmark && ['benchmark', selectedBenchmark?.name || 'Benchmark'],
    filters.system && ['system', filterOptions.systems.find((system) => String(system.id) === filters.system)?.name || 'System'],
    filters.cpu && ['cpu', filters.cpu],
    filters.gpu && ['gpu', filters.gpu],
    filters.os && ['os', filters.os],
  ].filter(Boolean);

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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-950 dark:text-white">Benchmark Results</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Search scores by benchmark, hardware, test system, operating system, and notes.
          </p>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredResults.length} of {resultRecords.length} results
        </div>
      </div>

      <div className="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.4fr)_repeat(6,minmax(0,1fr))_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={filters.q}
              onChange={(event) => setFilter('q', event.target.value)}
              placeholder="Search benchmark, CPU, GPU, system, OS..."
              className="input-field pl-9"
            />
          </label>
          <select value={filters.benchmark} onChange={(event) => setFilter('benchmark', event.target.value)} className="input-field">
            <option value="">All benchmarks</option>
            {filterOptions.benchmarks.map((benchmark) => <option key={benchmark.id} value={benchmark.id}>{benchmark.name}</option>)}
          </select>
          <select value={filters.system} onChange={(event) => setFilter('system', event.target.value)} className="input-field">
            <option value="">All systems</option>
            {filterOptions.systems.map((system) => <option key={system.id} value={system.id}>{system.name}</option>)}
          </select>
          <select value={filters.cpu} onChange={(event) => setFilter('cpu', event.target.value)} className="input-field">
            <option value="">All CPUs</option>
            {filterOptions.cpus.map((cpu) => <option key={cpu} value={cpu}>{cpu}</option>)}
          </select>
          <select value={filters.gpu} onChange={(event) => setFilter('gpu', event.target.value)} className="input-field">
            <option value="">All GPUs</option>
            {filterOptions.gpus.map((gpu) => <option key={gpu} value={gpu}>{gpu}</option>)}
          </select>
          <select value={filters.os} onChange={(event) => setFilter('os', event.target.value)} className="input-field">
            <option value="">All OSes</option>
            {filterOptions.oses.map((os) => <option key={os} value={os}>{os}</option>)}
          </select>
          <select value={filters.sort} onChange={(event) => setFilter('sort', event.target.value)} className="input-field">
            <option value="newest">Newest</option>
            <option value="best">Best score</option>
            <option value="benchmark">Benchmark</option>
            <option value="system">System</option>
          </select>
          <button type="button" onClick={clearFilters} className="btn-secondary inline-flex items-center justify-center">
            <X className="mr-2 h-4 w-4" />
            Clear
          </button>
        </div>

        {activeFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeFilters.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key, '')}
                className="inline-flex items-center rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {label}
                <X className="ml-2 h-3 w-3" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-md border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 className="flex items-center text-lg font-semibold text-gray-950 dark:text-white">
            <BarChart3 className="mr-2 h-5 w-5 text-primary-600 dark:text-primary-400" />
            Results
          </h2>
          <ArrowUpDown className="h-5 w-5 text-gray-400" />
        </div>

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
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Score</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">System</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Hardware</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredResults.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-5 py-4 text-sm font-medium text-gray-950 dark:text-white">
                      {record.benchmark?.name || 'Unknown'}
                      {record.benchmark?.lower_is_better && (
                        <span className="mt-1 block w-max rounded-full border border-gray-300 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:border-gray-700 dark:text-gray-400">
                          lower is better
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <span className="inline-flex rounded-full bg-primary-50 px-3 py-1 font-semibold text-primary-800 dark:bg-primary-950 dark:text-primary-200">
                        {formatScore(record.result.result)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <Link to={`/systems/${record.system?.id}`} className="font-medium text-primary-700 hover:text-primary-900 dark:text-primary-300">
                        {record.system?.name || 'Unknown'}
                      </Link>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{record.system?.osName}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <p>{record.system?.cpuText || 'Unknown CPU'}</p>
                      <p className="mt-1">{record.system?.gpuText || 'Unknown GPU'}</p>
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
