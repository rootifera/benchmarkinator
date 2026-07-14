import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, Trophy } from 'lucide-react';
import {
  formatBenchmarkId,
  formatDate,
  formatResultId,
  formatScore,
  usePublicData,
} from '../utils/publicData';

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

const PublicBenchmark = () => {
  const { benchmarkId } = useParams();
  const numericBenchmarkId = parseInt(benchmarkId, 10);
  const { loading, error, refetch, benchmarkLeaderboards } = usePublicData();

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

  const leaderboards = benchmarkLeaderboards.filter((item) => item.benchmark.id === numericBenchmarkId);
  const benchmark = leaderboards[0]?.benchmark;
  const records = leaderboards.flatMap((leaderboard) => (
    leaderboard.records.map((record) => ({
      ...record,
      settingsLabel: leaderboard.settingsLabel,
    }))
  ));

  if (!benchmark) {
    return (
      <div className="space-y-6">
        <Link to="/benchmarks" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Benchmarks
        </Link>
        <div className="rounded-md border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="font-medium text-gray-950 dark:text-white">This benchmark was not found.</p>
        </div>
      </div>
    );
  }

  const testedSystems = new Set(records.map((record) => record.system?.id).filter(Boolean)).size;

  return (
    <div className="space-y-8">
      <div>
        <Link to="/benchmarks" className="mb-4 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Benchmarks
        </Link>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">
          {benchmark.target?.name || 'Benchmark'}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-gray-950 dark:text-white" title={`${formatBenchmarkId(benchmark.id)} ${benchmark.name}`}>
          {benchmark.name}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {benchmark.lower_is_better ? 'Lower score is better.' : 'Higher score is better.'}
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-md border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Results</p>
          <p className="mt-2 text-3xl font-bold text-gray-950 dark:text-white">{records.length}</p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Systems Tested</p>
          <p className="mt-2 text-3xl font-bold text-gray-950 dark:text-white">{testedSystems}</p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Setting Groups</p>
          <p className="mt-2 text-3xl font-bold text-primary-700 dark:text-primary-300">
            {leaderboards.length}
          </p>
        </div>
      </section>

      <section className="rounded-md border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 className="flex items-center text-lg font-semibold text-gray-950 dark:text-white">
            <Trophy className="mr-2 h-5 w-5 text-amber-500" />
            Leaderboard
          </h2>
          <BarChart3 className="h-5 w-5 text-gray-400" />
        </div>

        {records.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">No results have been published for this benchmark yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-950">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Rank</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">System</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Score</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Settings</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Hardware</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-5 py-4 text-sm font-semibold text-gray-950 dark:text-white">{record.rankLabel}</td>
                    <td className="px-5 py-4 text-sm">
                      <Link to={`/systems/${record.system?.id}`} className="font-medium text-primary-700 hover:text-primary-900 dark:text-primary-300">
                        {record.system?.name || 'Unknown system'}
                      </Link>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{record.system?.osName}</p>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <ScorePill id={record.id} value={record.result.result} />
                    </td>
                    <td className="max-w-xs px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <span className="line-clamp-2">{record.settingsLabel}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <p>{formatComponentSummary(record.system?.cpuDetails, 'Unknown CPU')}</p>
                      <p className="mt-1">{formatComponentSummary(record.system?.gpuDetails, 'Unknown GPU')}</p>
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
      </section>
    </div>
  );
};

export default PublicBenchmark;
