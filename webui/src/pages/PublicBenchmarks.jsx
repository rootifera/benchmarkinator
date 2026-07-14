import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Filter, Trophy } from 'lucide-react';
import { formatBenchmarkId, formatResultId, formatScore, usePublicData } from '../utils/publicData';

const getParam = (params, key, fallback = '') => params.get(key) || fallback;
const sortColumns = new Set(['benchmark', 'target', 'leader', 'score', 'results']);
const descendingFirstColumns = new Set(['score', 'results']);
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const getLeaderScore = (leaderboard) => (
  leaderboard.leader ? Number(leaderboard.leader.result.result) : Number.NaN
);

const ScorePill = ({ result }) => (
  <span
    title={formatResultId(result.id)}
    className="inline-flex w-24 justify-center rounded-md bg-primary-700 px-2.5 py-1 text-sm font-semibold tabular-nums text-white shadow-sm dark:bg-primary-400 dark:text-primary-950"
  >
    {formatScore(result.result)}
  </span>
);

const compareNullableNumbers = (a, b) => {
  const aValid = Number.isFinite(a);
  const bValid = Number.isFinite(b);
  if (!aValid && !bValid) return 0;
  if (!aValid) return 1;
  if (!bValid) return -1;
  return a - b;
};

const PublicBenchmarks = () => {
  const { loading, error, refetch, benchmarkLeaderboards, filterOptions } = usePublicData();
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
      filterOptions.benchmarks.some((benchmark) => benchmark.benchmark_target_id === targetOption.id)
    )),
    [filterOptions.benchmarkTargets, filterOptions.benchmarks]
  );

  const filteredLeaderboards = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = benchmarkLeaderboards.filter((leaderboard) => {
      const benchmark = leaderboard.benchmark;
      const matchesSearch = !needle || [
        formatBenchmarkId(benchmark.id),
        benchmark.name,
        benchmark.target?.name,
        leaderboard.settingsLabel,
        leaderboard.leader?.system?.name,
      ].filter(Boolean).join(' ').toLowerCase().includes(needle);
      const matchesTarget = !target || String(benchmark.benchmark_target_id) === target;
      return matchesSearch && matchesTarget;
    });

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sort === 'target') {
        comparison = collator.compare(a.benchmark.target?.name || '', b.benchmark.target?.name || '');
      } else if (sort === 'leader') {
        comparison = collator.compare(a.leader?.system?.name || '', b.leader?.system?.name || '');
      } else if (sort === 'score') {
        comparison = compareNullableNumbers(getLeaderScore(a), getLeaderScore(b));
      } else if (sort === 'results') {
        comparison = a.records.length - b.records.length;
      } else {
        comparison = collator.compare(a.benchmark.name, b.benchmark.name);
      }

      if (comparison === 0) {
        comparison = collator.compare(a.benchmark.name, b.benchmark.name);
      }

      return dir === 'desc' ? -comparison : comparison;
    });
  }, [benchmarkLeaderboards, dir, q, sort, target]);

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
              placeholder="Search benchmarks, leaders, IDs..."
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
          {filteredLeaderboards.length} of {benchmarkLeaderboards.length} benchmarks
        </div>
      </div>

      {filteredLeaderboards.length === 0 ? (
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
                    Settings
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <SortHeader id="leader">Leader</SortHeader>
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <SortHeader id="score" align="right">Best score</SortHeader>
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <SortHeader id="results" align="right">Results</SortHeader>
                  </th>
                  <th className="w-12 px-5 py-3" aria-label="Open benchmark" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredLeaderboards.map((leaderboard) => (
                  <tr
                    key={`${leaderboard.benchmark.id}-${leaderboard.settings}`}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-5 py-4">
                      <Link
                        to={`/benchmarks/${leaderboard.benchmark.id}`}
                        className="font-medium text-gray-950 hover:text-primary-700 dark:text-white dark:hover:text-primary-300"
                        title={`${formatBenchmarkId(leaderboard.benchmark.id)} ${leaderboard.benchmark.name}`}
                      >
                        {leaderboard.benchmark.name}
                      </Link>
                      {leaderboard.benchmark.lower_is_better && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Lower is better</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {leaderboard.benchmark.target?.name || 'Benchmark'}
                    </td>
                    <td className="max-w-xs px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <span className="line-clamp-2">{leaderboard.settingsLabel}</span>
                    </td>
                    <td className="px-5 py-4">
                      {leaderboard.leader ? (
                        <Link
                          to={`/systems/${leaderboard.leader.system?.id}`}
                          className="text-sm font-medium text-primary-700 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-200"
                          title={leaderboard.leader.system?.publicId}
                        >
                          {leaderboard.leader.system?.name || 'Unknown system'}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">No results</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right text-sm">
                      {leaderboard.leader ? <ScorePill result={leaderboard.leader.result} /> : 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                      {leaderboard.records.length}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/benchmarks/${leaderboard.benchmark.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-primary-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-primary-300"
                        aria-label={`Open ${leaderboard.benchmark.name}`}
                        title={`Open ${leaderboard.benchmark.name}`}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
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
