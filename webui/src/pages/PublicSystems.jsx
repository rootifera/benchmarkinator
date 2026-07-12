import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Cpu, Database, Monitor, Search, Server, X } from 'lucide-react';
import { formatDate, usePublicData } from '../utils/publicData';

const getParam = (params, key, fallback = '') => params.get(key) || fallback;

const PublicSystems = () => {
  const { loading, error, refetch, systemRecords, filterOptions } = usePublicData();
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = {
    q: getParam(searchParams, 'q'),
    cpu: getParam(searchParams, 'cpu'),
    gpu: getParam(searchParams, 'gpu'),
    os: getParam(searchParams, 'os'),
    sort: getParam(searchParams, 'sort', 'results'),
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

  const filteredSystems = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    let systems = [...systemRecords];

    if (q) systems = systems.filter((system) => system.searchText.includes(q));
    if (filters.cpu) systems = systems.filter((system) => system.cpuNames.includes(filters.cpu));
    if (filters.gpu) systems = systems.filter((system) => system.gpuNames.includes(filters.gpu));
    if (filters.os) systems = systems.filter((system) => system.osName === filters.os);

    systems.sort((a, b) => {
      if (filters.sort === 'newest') {
        return new Date(b.newestDate || 0) - new Date(a.newestDate || 0);
      }
      if (filters.sort === 'name') {
        return a.name.localeCompare(b.name);
      }
      return b.resultCount - a.resultCount || a.name.localeCompare(b.name);
    });

    return systems;
  }, [filters, systemRecords]);

  const activeFilters = [
    filters.q && ['q', `Search: ${filters.q}`],
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
          <h1 className="text-3xl font-bold text-gray-950 dark:text-white">Test Systems</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Browse every published hardware configuration and jump into its benchmark profile.
          </p>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredSystems.length} of {systemRecords.length} systems
        </div>
      </div>

      <div className="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={filters.q}
              onChange={(event) => setFilter('q', event.target.value)}
              placeholder="Search systems, CPU, GPU, OS, motherboard..."
              className="input-field pl-9"
            />
          </label>
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
            <option value="results">Most results</option>
            <option value="newest">Newest result</option>
            <option value="name">System name</option>
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

      {filteredSystems.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
          <Server className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-3 font-medium text-gray-950 dark:text-white">No systems match those filters.</p>
          <button type="button" onClick={clearFilters} className="btn-primary mt-4">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredSystems.map((system) => (
            <Link
              key={system.id}
              to={`/systems/${system.id}`}
              className="rounded-md border border-gray-200 bg-white p-5 transition-colors hover:border-primary-300 hover:bg-primary-50/40 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary-800 dark:hover:bg-primary-950/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2" title={`${system.publicId} ${system.name}`}>
                    <h2 className="text-lg font-semibold text-gray-950 dark:text-white">{system.name}</h2>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{system.osName}</p>
                </div>
                <div className="rounded-md bg-gray-100 px-3 py-2 text-right text-sm dark:bg-gray-800">
                  <p className="font-semibold text-gray-950 dark:text-white">{system.resultCount}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">results</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <div className="flex gap-2 text-gray-700 dark:text-gray-300">
                  <Cpu className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
                  <span>{system.cpuText}</span>
                </div>
                <div className="flex gap-2 text-gray-700 dark:text-gray-300">
                  <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
                  <span>{system.gpuText}</span>
                </div>
                <div className="flex gap-2 text-gray-700 dark:text-gray-300">
                  <Database className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
                  <span>{system.ramText}</span>
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  Newest: {formatDate(system.newestDate)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicSystems;
