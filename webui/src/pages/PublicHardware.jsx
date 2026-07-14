import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Cpu, Filter, Monitor, Settings } from 'lucide-react';
import { usePublicData } from '../utils/publicData';

const getParam = (params, key, fallback = '') => params.get(key) || fallback;
const hardwareLabels = {
  cpu: 'CPU',
  gpu: 'GPU',
  motherboard: 'Motherboard',
};
const hardwareIcons = {
  cpu: Cpu,
  gpu: Monitor,
  motherboard: Settings,
};

const PublicHardware = () => {
  const { loading, error, refetch, cpuRecords, gpuRecords, motherboardRecords } = usePublicData();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = getParam(searchParams, 'q');
  const type = getParam(searchParams, 'type');

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const hardwareRecords = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const records = [
      ...(!type || type === 'cpu' ? cpuRecords : []),
      ...(!type || type === 'gpu' ? gpuRecords : []),
      ...(!type || type === 'motherboard' ? motherboardRecords : []),
    ];
    return records.filter((record) => !needle || record.searchText.includes(needle));
  }, [cpuRecords, gpuRecords, motherboardRecords, q, type]);

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" /></div>;
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
            Filters work together - combine hardware type and search filters
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
          <label>
            <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Search</span>
            <input
              type="search"
              value={q}
              onChange={(event) => setFilter('q', event.target.value)}
              placeholder="Search CPU, GPU, motherboard, system, ID..."
              className="input-field h-8 py-1 text-sm"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Hardware Type</span>
            <select value={type} onChange={(event) => setFilter('type', event.target.value)} className="input-field h-8 py-1 text-sm">
              <option value="">All hardware</option>
              <option value="cpu">CPUs</option>
              <option value="gpu">GPUs</option>
              <option value="motherboard">Motherboards</option>
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="inline-flex h-8 items-center justify-center rounded-md bg-gray-600 px-3 text-xs font-medium text-white transition-colors hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-gray-950 dark:text-white">Hardware</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {hardwareRecords.length} parts
        </div>
      </div>

      {hardwareRecords.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
          <Cpu className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-3 font-medium text-gray-950 dark:text-white">No hardware matches those filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {hardwareRecords.map((record) => {
            const Icon = hardwareIcons[record.type] || Cpu;
            return (
              <Link
                key={`${record.type}-${record.id}`}
                to={`/hardware/${record.type}/${record.id}`}
                className="rounded-md border border-gray-200 bg-white p-5 transition-colors hover:border-primary-300 hover:bg-primary-50/40 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary-800 dark:hover:bg-primary-950/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <Icon className="mt-1 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" />
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {hardwareLabels[record.type] || 'Hardware'}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-gray-950 dark:text-white" title={`${record.publicId} ${record.name}`}>
                        {record.name}
                      </h2>
                      {record.detail && (
                        <p className="mt-1 break-words text-sm text-gray-500 dark:text-gray-400">{record.detail}</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-md bg-gray-100 px-3 py-2 text-right text-sm dark:bg-gray-800">
                    <p className="font-semibold text-gray-950 dark:text-white">{record.resultCount}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">results</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Systems</p>
                    <p className="mt-1 font-semibold text-gray-950 dark:text-white">{record.systemCount}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Best Rank</p>
                    <p className="mt-1 font-semibold text-gray-950 dark:text-white">
                      {record.bestRanks[0]?.rankLabel || 'Unranked'}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PublicHardware;
