import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Trophy } from 'lucide-react';
import { formatBenchmarkId, usePublicData } from '../utils/publicData';

const getParam = (params, key, fallback = '') => params.get(key) || fallback;
const sortColumns = new Set(['benchmark', 'target', 'direction', 'options']);
const descendingFirstColumns = new Set(['options']);
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const decodeOptionValues = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
  } catch {
    // Older/manual values can still be shown as comma/newline separated text.
  }
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const PublicBenchmarks = () => {
  const { loading, error, refetch, data, filterOptions } = usePublicData();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = getParam(searchParams, 'q');
  const target = getParam(searchParams, 'target');
  const sort = sortColumns.has(getParam(searchParams, 'sort')) ? getParam(searchParams, 'sort') : 'benchmark';
  const dir = getParam(searchParams, 'dir') === 'desc' ? 'desc' : 'asc';

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const setSort = (key) => {
    const next = new URLSearchParams(searchParams);
    const defaultDir = descendingFirstColumns.has(key) ? 'desc' : 'asc';
    const nextDir = sort === key ? (dir === 'asc' ? 'desc' : 'asc') : defaultDir;
    next.set('sort', key);
    next.set('dir', nextDir);
    setSearchParams(next);
  };

  const targets = useMemo(
    () => filterOptions.benchmarkTargets.filter((targetOption) => (
      data.benchmarks.some((benchmark) => benchmark.benchmark_target_id === targetOption.id)
    )),
    [data.benchmarks, filterOptions.benchmarkTargets]
  );

  const benchmarks = useMemo(() => {
    const targetsById = new Map(filterOptions.benchmarkTargets.map((targetOption) => [targetOption.id, targetOption]));
    const optionsByBenchmark = new Map();

    data.benchmarkOptions.forEach((option) => {
      const list = optionsByBenchmark.get(option.benchmark_id) || [];
      list.push({
        ...option,
        parsedValues: decodeOptionValues(option.values),
      });
      optionsByBenchmark.set(option.benchmark_id, list);
    });

    optionsByBenchmark.forEach((options) => {
      options.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id);
    });

    return data.benchmarks.map((benchmark) => ({
      ...benchmark,
      target: targetsById.get(benchmark.benchmark_target_id) || null,
      options: optionsByBenchmark.get(benchmark.id) || [],
    }));
  }, [data.benchmarkOptions, data.benchmarks, filterOptions.benchmarkTargets]);

  const filteredBenchmarks = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = benchmarks.filter((benchmark) => {
      const matchesSearch = !needle || [
        formatBenchmarkId(benchmark.id),
        benchmark.name,
        benchmark.target?.name,
        benchmark.lower_is_better ? 'lower is better' : 'higher is better',
        ...benchmark.options.flatMap((option) => [option.name, ...option.parsedValues]),
      ].filter(Boolean).join(' ').toLowerCase().includes(needle);
      const matchesTarget = !target || String(benchmark.benchmark_target_id) === target;
      return matchesSearch && matchesTarget;
    });

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sort === 'target') {
        comparison = collator.compare(a.target?.name || '', b.target?.name || '');
      } else if (sort === 'direction') {
        comparison = collator.compare(
          a.lower_is_better ? 'Lower is better' : 'Higher is better',
          b.lower_is_better ? 'Lower is better' : 'Higher is better'
        );
      } else if (sort === 'options') {
        comparison = a.options.length - b.options.length;
      } else {
        comparison = collator.compare(a.name, b.name);
      }

      if (comparison === 0) {
        comparison = collator.compare(a.name, b.name);
      }

      return dir === 'desc' ? -comparison : comparison;
    });
  }, [benchmarks, dir, q, sort, target]);

  const SortHeader = ({ id, align = 'left', children }) => {
    const active = sort === id;
    const direction = active ? (dir === 'asc' ? 'up' : 'down') : 'idle';
    const justify = align === 'right' ? 'justify-end' : 'justify-start';

    return (
      <button
        type="button"
        onClick={() => setSort(id)}
        className={`inline-flex w-full items-center gap-1.5 ${justify} text-xs font-medium uppercase tracking-wider text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100`}
        aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        <span>{children}</span>
        <span className={active ? 'text-primary-700 dark:text-primary-300' : 'text-gray-400 dark:text-gray-600'}>
          {direction === 'up' ? '↑' : direction === 'down' ? '↓' : '↕'}
        </span>
      </button>
    );
  };

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
            Filters work together - combine benchmark, target, and search filters
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
          <label>
            <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Search</span>
            <input
              type="search"
              value={q}
              onChange={(event) => setFilter('q', event.target.value)}
              placeholder="Search benchmarks, targets, settings, IDs..."
              className="input-field h-8 py-1 text-sm"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Target</span>
            <select value={target} onChange={(event) => setFilter('target', event.target.value)} className="input-field h-8 py-1 text-sm">
              <option value="">All targets</option>
              {targets.map((targetOption) => (
                <option key={targetOption.id} value={targetOption.id}>
                  {targetOption.name}
                </option>
              ))}
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
        <h1 className="text-xl font-semibold text-gray-950 dark:text-white">Benchmarks</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredBenchmarks.length} of {benchmarks.length} benchmarks
        </div>
      </div>

      {filteredBenchmarks.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
          <Trophy className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-3 font-medium text-gray-950 dark:text-white">No benchmarks match those filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-950">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <SortHeader id="benchmark">Benchmark</SortHeader>
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <SortHeader id="target">Target</SortHeader>
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <SortHeader id="direction">Score Direction</SortHeader>
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <SortHeader id="options">Available Values</SortHeader>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredBenchmarks.map((benchmark) => (
                  <tr
                    key={benchmark.id}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-5 py-4">
                      <div
                        className="font-medium text-gray-950 dark:text-white"
                        title={`${formatBenchmarkId(benchmark.id)} ${benchmark.name}`}
                      >
                        {benchmark.name}
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{formatBenchmarkId(benchmark.id)}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {benchmark.target?.name || 'Benchmark'}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {benchmark.lower_is_better ? 'Lower is better' : 'Higher is better'}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {benchmark.options.length ? (
                        <div className="space-y-2">
                          {benchmark.options.map((option) => (
                            <div key={option.id}>
                              <span className="font-medium text-gray-950 dark:text-white">{option.name}:</span>
                              <span className="ml-1 line-clamp-2">
                                {option.parsedValues.join(', ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">Default only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicBenchmarks;
