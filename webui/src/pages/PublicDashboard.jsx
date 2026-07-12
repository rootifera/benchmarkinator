import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BarChart3,
  Cpu,
  Database,
  Monitor,
  Search,
  Server,
  Trophy,
} from 'lucide-react';
import { formatDate, formatScore, usePublicData } from '../utils/publicData';

const StatCard = ({ icon: Icon, label, value, detail }) => (
  <div className="rounded-md border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
        <p className="mt-2 text-3xl font-bold text-gray-950 dark:text-white">{value}</p>
        {detail && <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">{detail}</p>}
      </div>
      <div className="rounded-md bg-primary-50 p-3 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const PublicDashboard = () => {
  const { loading, error, refetch, analytics, recentResults, leaders, systemRecords } = usePublicData();
  const activeSystems = systemRecords
    .filter((system) => system.resultCount > 0)
    .sort((a, b) => b.resultCount - a.resultCount || a.name.localeCompare(b.name))
    .slice(0, 6);

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
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:items-stretch">
        <div className="rounded-md border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">
            Public benchmark lab
          </p>
          <h1 className="mt-3 text-3xl font-bold text-gray-950 dark:text-white sm:text-4xl">
            Explore tested hardware, benchmark scores, and system comparisons.
          </h1>
          <p className="mt-4 max-w-3xl text-gray-600 dark:text-gray-400">
            Search across systems, CPUs, GPUs, benchmarks, operating systems, and notes. Open any test system for its full hardware profile and matching benchmark results.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/results" className="btn-primary inline-flex items-center">
              <Search className="mr-2 h-4 w-4" />
              Browse Results
            </Link>
            <Link to="/systems" className="btn-secondary inline-flex items-center">
              <Server className="mr-2 h-4 w-4" />
              Browse Systems
            </Link>
          </div>
        </div>
        <div className="rounded-md border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Newest published result</p>
          {analytics.newestResult ? (
            <div className="mt-4">
              <p className="text-lg font-semibold text-gray-950 dark:text-white">
                {analytics.newestResult.benchmark?.name || 'Unknown benchmark'}
              </p>
              <p className="mt-2 text-3xl font-bold text-primary-700 dark:text-primary-300">
                {formatScore(analytics.newestResult.result.result)}
              </p>
              <Link
                to={`/systems/${analytics.newestResult.system?.id}`}
                className="mt-3 inline-flex items-center text-sm font-medium text-primary-700 hover:text-primary-900 dark:text-primary-300 dark:hover:text-primary-200"
              >
                {analytics.newestResult.system?.name || 'Unknown system'}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">{formatDate(analytics.newestResult.date)}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No results have been published yet.</p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Database} label="Benchmark Results" value={analytics.totalResults} detail="Published score entries" />
        <StatCard icon={Server} label="Test Systems" value={analytics.totalSystems} detail={`${analytics.systemsWithResults} with results`} />
        <StatCard icon={Cpu} label="CPUs Tested" value={analytics.totalCpus} detail={`${analytics.totalGpus} GPUs tested`} />
        <StatCard icon={BarChart3} label="Coverage" value={`${analytics.coveragePercent}%`} detail={`${analytics.totalBenchmarks} benchmark definitions`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-md border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <h2 className="flex items-center text-lg font-semibold text-gray-950 dark:text-white">
              <Trophy className="mr-2 h-5 w-5 text-amber-500" />
              Benchmark Leaders
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {leaders.slice(0, 7).map((record) => (
              <Link key={`${record.benchmark.id}-${record.id}`} to={`/systems/${record.system?.id}`} className="block px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-950 dark:text-white">{record.benchmark.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{record.system?.name || 'Unknown system'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary-700 dark:text-primary-300">{formatScore(record.result.result)}</p>
                    {record.benchmark.lower_is_better && <p className="text-xs text-gray-500">Lower is better</p>}
                  </div>
                </div>
              </Link>
            ))}
            {leaders.length === 0 && <p className="px-5 py-8 text-center text-sm text-gray-500">No leader data yet.</p>}
          </div>
        </div>

        <div className="rounded-md border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <h2 className="flex items-center text-lg font-semibold text-gray-950 dark:text-white">
              <Award className="mr-2 h-5 w-5 text-primary-600" />
              Most Tested Systems
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {activeSystems.map((system) => (
              <Link key={system.id} to={`/systems/${system.id}`} className="block px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-950 dark:text-white">{system.name}</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{system.cpuText}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{system.gpuText}</p>
                  </div>
                  <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-semibold text-gray-950 dark:text-white">{system.resultCount}</p>
                    <p>results</p>
                  </div>
                </div>
              </Link>
            ))}
            {activeSystems.length === 0 && <p className="px-5 py-8 text-center text-sm text-gray-500">No systems have results yet.</p>}
          </div>
        </div>
      </section>

      <section className="rounded-md border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 className="flex items-center text-lg font-semibold text-gray-950 dark:text-white">
            <Monitor className="mr-2 h-5 w-5 text-primary-600" />
            Recent Results
          </h2>
          <Link to="/results?sort=newest" className="text-sm font-medium text-primary-700 hover:text-primary-900 dark:text-primary-300">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Benchmark</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">System</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Score</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {recentResults.slice(0, 8).map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-5 py-4 text-sm font-medium text-gray-950 dark:text-white">{record.benchmark?.name || 'Unknown'}</td>
                  <td className="px-5 py-4 text-sm">
                    <Link to={`/systems/${record.system?.id}`} className="font-medium text-primary-700 hover:text-primary-900 dark:text-primary-300">
                      {record.system?.name || 'Unknown'}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{formatScore(record.result.result)}</td>
                  <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{formatDate(record.date)}</td>
                </tr>
              ))}
              {recentResults.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-5 py-8 text-center text-sm text-gray-500">No recent results yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default PublicDashboard;
