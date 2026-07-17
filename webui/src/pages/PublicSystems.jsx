import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Cpu, Database, Filter, Monitor, Server, Settings } from 'lucide-react';
import { formatDate, usePublicData } from '../utils/publicData';
import SearchableSelect from '../components/SearchableSelect';

const getParam = (params, key, fallback = '') => params.get(key) || fallback;

const ComponentLine = ({ count = 1, title, detail }) => (
  <div className="min-w-0">
    <div className="flex items-center gap-2">
      {count > 1 && (
        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {count}x
        </span>
      )}
      <span className="break-words font-medium">{title}</span>
    </div>
    {detail && <p className="mt-0.5 break-words text-xs text-gray-500 dark:text-gray-400">{detail}</p>}
  </div>
);

const ComponentGroup = ({ icon: Icon, children }) => (
  <div className="flex min-w-0 gap-2 text-sm text-gray-700 dark:text-gray-300">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
    <div className="min-w-0 space-y-1">{children}</div>
  </div>
);

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
  const textOptions = (items) => items.map((item) => ({ id: item, name: item }));

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
            Filters work together - combine hardware, system, and OS filters
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))_auto]">
          <label>
            <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Search</span>
            <input
              type="search"
              value={filters.q}
              onChange={(event) => setFilter('q', event.target.value)}
              placeholder="Search systems, CPU, GPU, OS, motherboard..."
              className="input-field h-8 py-1 text-sm"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">CPU</span>
            <SearchableSelect
              value={filters.cpu}
              onChange={(value) => setFilter('cpu', value)}
              options={textOptions(filterOptions.cpus)}
              placeholder="All CPUs"
              searchPlaceholder="Search CPUs..."
              size="sm"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">GPU</span>
            <SearchableSelect
              value={filters.gpu}
              onChange={(value) => setFilter('gpu', value)}
              options={textOptions(filterOptions.gpus)}
              placeholder="All GPUs"
              searchPlaceholder="Search GPUs..."
              size="sm"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">OS</span>
            <SearchableSelect
              value={filters.os}
              onChange={(value) => setFilter('os', value)}
              options={textOptions(filterOptions.oses)}
              placeholder="All OSes"
              searchPlaceholder="Search OSes..."
              size="sm"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Sort</span>
            <select value={filters.sort} onChange={(event) => setFilter('sort', event.target.value)} className="input-field h-8 py-1 text-sm">
              <option value="results">Most results</option>
              <option value="newest">Newest result</option>
              <option value="name">System name</option>
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-8 items-center justify-center rounded-md bg-gray-600 px-3 text-xs font-medium text-white transition-colors hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-gray-950 dark:text-white">Test Systems</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredSystems.length} of {systemRecords.length} systems
        </div>
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
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <ComponentGroup icon={Cpu}>
                  {system.cpuDetails.length
                    ? system.cpuDetails.map((item) => <ComponentLine key={`cpu-${item.id}`} {...item} />)
                    : <ComponentLine title="Unknown CPU" />}
                </ComponentGroup>
                <ComponentGroup icon={Monitor}>
                  {system.gpuDetails.length
                    ? system.gpuDetails.map((item) => <ComponentLine key={`gpu-${item.id}`} {...item} />)
                    : <ComponentLine title="Unknown GPU" />}
                </ComponentGroup>
                <ComponentGroup icon={Settings}>
                  <ComponentLine {...system.motherboardDetail} />
                </ComponentGroup>
                <ComponentGroup icon={Database}>
                  <ComponentLine title={system.ramText || 'Unknown RAM'} detail={`Newest: ${formatDate(system.newestDate)}`} />
                </ComponentGroup>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicSystems;
