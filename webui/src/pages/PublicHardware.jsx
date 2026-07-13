import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Cpu, Monitor, Search, X } from 'lucide-react';
import { usePublicData } from '../utils/publicData';

const getParam = (params, key, fallback = '') => params.get(key) || fallback;

const PublicHardware = () => {
  const { loading, error, refetch, cpuRecords, gpuRecords } = usePublicData();
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
    ];
    return records.filter((record) => !needle || record.searchText.includes(needle));
  }, [cpuRecords, gpuRecords, q, type]);

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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-950 dark:text-white">Hardware</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Browse CPUs and GPUs by systems tested, result count, and benchmark placements.
          </p>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {hardwareRecords.length} parts
        </div>
      </div>

      <div className="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={q}
              onChange={(event) => setFilter('q', event.target.value)}
              placeholder="Search CPU, GPU, system, ID..."
              className="input-field pl-9"
            />
          </label>
          <select value={type} onChange={(event) => setFilter('type', event.target.value)} className="input-field">
            <option value="">All hardware</option>
            <option value="cpu">CPUs</option>
            <option value="gpu">GPUs</option>
          </select>
          <button type="button" onClick={() => setSearchParams({})} className="btn-secondary inline-flex items-center justify-center">
            <X className="mr-2 h-4 w-4" />
            Clear
          </button>
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
            const Icon = record.type === 'cpu' ? Cpu : Monitor;
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
                        {record.type === 'cpu' ? 'CPU' : 'GPU'}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-gray-950 dark:text-white" title={`${record.publicId} ${record.name}`}>
                        {record.name}
                      </h2>
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
