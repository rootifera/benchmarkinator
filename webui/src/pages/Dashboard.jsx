import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  Database,
  LineChart,
  Plus,
  Settings,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Wrench
} from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import ApiKeyModal from '../components/ApiKeyModal';
import { buildApiUrl } from '../config/api';

const isValidDate = (value) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() > 0;
};

const formatScore = (value) => {
  const score = Number(value);
  if (!Number.isFinite(score)) return 'N/A';
  return score.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const formatDate = (value) => {
  if (!isValidDate(value)) return 'No date';
  return new Date(value).toLocaleDateString();
};

const compareScores = (a, b, lowerIsBetter) => {
  return lowerIsBetter ? a.result - b.result : b.result - a.result;
};

const Dashboard = () => {
  const { apiKey, isAuthenticated } = useAuth();
  const [data, setData] = useState({
    cpus: [],
    gpus: [],
    benchmarks: [],
    results: [],
    configurations: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApiModal, setShowApiModal] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'X-API-Key': apiKey };
      const [cpus, gpus, benchmarks, results, configs] = await Promise.all([
        axios.get(buildApiUrl('/api/cpu/'), { headers }),
        axios.get(buildApiUrl('/api/gpu/'), { headers }),
        axios.get(buildApiUrl('/api/benchmark/'), { headers }),
        axios.get(buildApiUrl('/api/benchmark_results/'), { headers }),
        axios.get(buildApiUrl('/api/config/'), { headers })
      ]);

      setData({
        cpus: cpus.data,
        gpus: gpus.data,
        benchmarks: benchmarks.data,
        results: results.data,
        configurations: configs.data
      });
    } catch (fetchError) {
      console.error('Error fetching dashboard data:', fetchError);
      setError('Could not load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchStats]);

  const analytics = useMemo(() => {
    const benchmarksById = new Map(data.benchmarks.map((benchmark) => [benchmark.id, benchmark]));
    const configsById = new Map(data.configurations.map((config) => [config.id, config]));
    const validResults = data.results
      .filter((result) => Number.isFinite(Number(result.result)))
      .map((result) => ({
        ...result,
        result: Number(result.result),
        benchmark: benchmarksById.get(result.benchmark_id),
        config: configsById.get(result.config_id)
      }));

    const uniquePairs = new Set(validResults.map((result) => `${result.config_id}:${result.benchmark_id}`));
    const totalPossiblePairs = data.configurations.length * data.benchmarks.length;
    const coveragePercent = totalPossiblePairs
      ? Math.round((uniquePairs.size / totalPossiblePairs) * 100)
      : 0;

    const resultsByBenchmark = new Map();
    validResults.forEach((result) => {
      if (!resultsByBenchmark.has(result.benchmark_id)) {
        resultsByBenchmark.set(result.benchmark_id, []);
      }
      resultsByBenchmark.get(result.benchmark_id).push(result);
    });

    const benchmarkLeaders = [];
    const benchmarkLows = [];
    const benchmarkCoverage = data.benchmarks.map((benchmark) => {
      const benchmarkResults = resultsByBenchmark.get(benchmark.id) || [];
      const ranked = [...benchmarkResults].sort((a, b) => compareScores(a, b, benchmark.lower_is_better));
      const testedSystems = new Set(benchmarkResults.map((result) => result.config_id));
      if (ranked[0]) {
        benchmarkLeaders.push({ ...ranked[0], benchmark });
      }
      if (ranked.length > 1) {
        benchmarkLows.push({ ...ranked[ranked.length - 1], benchmark });
      }
      return {
        id: benchmark.id,
        name: benchmark.name,
        tested: testedSystems.size,
        missing: Math.max(data.configurations.length - testedSystems.size, 0),
        results: benchmarkResults.length
      };
    });

    const systemScores = new Map(data.configurations.map((config) => [
      config.id,
      {
        config,
        points: 0,
        wins: 0,
        podiums: 0,
        benchmarks: new Set(),
        results: 0,
        rankTotal: 0,
        rankedBenchmarks: 0
      }
    ]));

    resultsByBenchmark.forEach((benchmarkResults, benchmarkId) => {
      const benchmark = benchmarksById.get(benchmarkId);
      if (!benchmark) return;

      const bestPerSystem = new Map();
      benchmarkResults.forEach((result) => {
        const existing = bestPerSystem.get(result.config_id);
        if (!existing || compareScores(result, existing, benchmark.lower_is_better) < 0) {
          bestPerSystem.set(result.config_id, result);
        }
      });

      [...bestPerSystem.values()]
        .sort((a, b) => compareScores(a, b, benchmark.lower_is_better))
        .forEach((result, index) => {
          const score = systemScores.get(result.config_id);
          if (!score) return;
          const rank = index + 1;
          score.results += benchmarkResults.filter((item) => item.config_id === result.config_id).length;
          score.benchmarks.add(benchmarkId);
          score.rankTotal += rank;
          score.rankedBenchmarks += 1;
          if (rank === 1) score.wins += 1;
          if (rank <= 3) score.podiums += 1;
          score.points += Math.max(6 - rank, 0);
        });
    });

    const systemStandings = [...systemScores.values()]
      .map((score) => ({
        ...score,
        benchmarkCount: score.benchmarks.size,
        averageRank: score.rankedBenchmarks ? score.rankTotal / score.rankedBenchmarks : null
      }))
      .sort((a, b) => b.points - a.points || b.wins - a.wins || b.benchmarkCount - a.benchmarkCount)
      .slice(0, 6);

    const systemsWithResults = new Set(validResults.map((result) => result.config_id));
    const benchmarksWithResults = new Set(validResults.map((result) => result.benchmark_id));
    const systemsWithoutResults = data.configurations.filter((config) => !systemsWithResults.has(config.id));
    const benchmarksWithoutResults = data.benchmarks.filter((benchmark) => !benchmarksWithResults.has(benchmark.id));

    const recentResults = [...validResults]
      .filter((result) => isValidDate(result.timestamp))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 6);

    const resultsLast30Days = validResults.filter((result) => {
      if (!isValidDate(result.timestamp)) return false;
      const resultDate = new Date(result.timestamp);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      return resultDate >= cutoff;
    }).length;

    const volumeByDate = validResults
      .filter((result) => isValidDate(result.timestamp))
      .reduce((counts, result) => {
        const key = new Date(result.timestamp).toISOString().slice(0, 10);
        counts.set(key, (counts.get(key) || 0) + 1);
        return counts;
      }, new Map());

    const volumeChart = [...volumeByDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, count]) => ({
        date: new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        count
      }));

    const coverageChart = benchmarkCoverage
      .sort((a, b) => b.results - a.results || b.tested - a.tested)
      .slice(0, 8)
      .map((item) => ({
        name: item.name.length > 18 ? `${item.name.slice(0, 18)}...` : item.name,
        tested: item.tested,
        missing: item.missing
      }));

    return {
      validResults,
      coveragePercent,
      uniquePairs: uniquePairs.size,
      totalPossiblePairs,
      benchmarkLeaders: benchmarkLeaders.slice(0, 6),
      benchmarkLows: benchmarkLows.slice(0, 6),
      benchmarkCoverage,
      coverageChart,
      systemStandings,
      systemsWithoutResults,
      benchmarksWithoutResults,
      recentResults,
      resultsLast30Days,
      volumeChart
    };
  }, [data]);

  const statCards = [
    { name: 'Test Systems', value: data.configurations.length, icon: Settings, color: 'bg-indigo-500', href: '/testsystems' },
    { name: 'Benchmarks', value: data.benchmarks.length, icon: BarChart3, color: 'bg-purple-500', href: '/benchmarks' },
    { name: 'Results', value: data.results.length, icon: TrendingUp, color: 'bg-orange-500', href: '/results' },
    { name: 'Coverage', value: `${analytics.coveragePercent}%`, icon: CheckCircle2, color: 'bg-emerald-500', href: '/results' }
  ];

  const quickActions = [
    { label: 'Add Test System', href: '/testsystems', icon: Wrench },
    { label: 'Add Benchmark', href: '/benchmarks', icon: Target },
    { label: 'Add Result', href: '/results', icon: Plus },
    { label: 'Compare Systems', href: '/results', icon: LineChart }
  ];

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <Database className="w-14 h-14 mx-auto mb-4 text-primary-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Connect Your API
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Log in to access dashboard statistics and benchmark management.
          </p>
          <button
            onClick={() => setShowApiModal(true)}
            className="btn-primary inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Connect API
          </button>
        </div>
        <ApiKeyModal isOpen={showApiModal} onClose={() => setShowApiModal(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Benchmark health, coverage, leaders, and recent activity at a glance.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.href}
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <Icon className="mr-2 h-4 w-4 text-primary-600 dark:text-primary-400" />
                {action.label}
              </Link>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              to={stat.href}
              className="card transition-shadow hover:shadow-md"
            >
              <div className="flex items-center">
                <div className={`rounded-lg p-3 text-white ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {loading ? '...' : stat.value}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="card xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              System Standings
            </h2>
            <Trophy className="h-5 w-5 text-amber-500" />
          </div>
          {analytics.systemStandings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr className="text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <th className="pb-3">System</th>
                    <th className="pb-3">Points</th>
                    <th className="pb-3">Wins</th>
                    <th className="pb-3">Podiums</th>
                    <th className="pb-3">Benchmarks</th>
                    <th className="pb-3">Avg Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {analytics.systemStandings.map((standing, index) => (
                    <tr key={standing.config.id}>
                      <td className="py-3 pr-4">
                        <div className="flex items-center">
                          <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-200">
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {standing.config.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-sm font-semibold text-gray-900 dark:text-white">{standing.points}</td>
                      <td className="py-3 text-sm text-gray-700 dark:text-gray-300">{standing.wins}</td>
                      <td className="py-3 text-sm text-gray-700 dark:text-gray-300">{standing.podiums}</td>
                      <td className="py-3 text-sm text-gray-700 dark:text-gray-300">{standing.benchmarkCount}</td>
                      <td className="py-3 text-sm text-gray-700 dark:text-gray-300">
                        {standing.averageRank ? standing.averageRank.toFixed(1) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Trophy} title="No standings yet" text="Add results for at least one test system to rank performers." />
          )}
        </section>

        <section className="card">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Data Health
            </h2>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div className="space-y-4">
            <HealthRow
              label="Test coverage"
              value={`${analytics.uniquePairs}/${analytics.totalPossiblePairs || 0}`}
              detail={`${analytics.coveragePercent}% of system and benchmark pairs`}
              good={analytics.coveragePercent >= 75}
            />
            <HealthRow
              label="Results in last 30 days"
              value={analytics.resultsLast30Days}
              detail="Recent benchmark activity"
              good={analytics.resultsLast30Days > 0}
            />
            <HealthRow
              label="Systems without results"
              value={analytics.systemsWithoutResults.length}
              detail={analytics.systemsWithoutResults.slice(0, 2).map((item) => item.name).join(', ') || 'All systems have results'}
              good={analytics.systemsWithoutResults.length === 0}
            />
            <HealthRow
              label="Benchmarks without results"
              value={analytics.benchmarksWithoutResults.length}
              detail={analytics.benchmarksWithoutResults.slice(0, 2).map((item) => item.name).join(', ') || 'All benchmarks have results'}
              good={analytics.benchmarksWithoutResults.length === 0}
            />
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PerformancePanel
          title="Best Performers"
          icon={Award}
          rows={analytics.benchmarkLeaders}
          tone="best"
        />
        <PerformancePanel
          title="Worst Performers"
          icon={TrendingDown}
          rows={analytics.benchmarkLows}
          tone="worst"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="card">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Benchmark Coverage
            </h2>
            <BarChart3 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          {analytics.coverageChart.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.coverageChart} margin={{ top: 8, right: 16, left: 0, bottom: 28 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="name" angle={-25} textAnchor="end" height={56} tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="tested" stackId="coverage" fill="#10b981" name="Tested systems" />
                  <Bar dataKey="missing" stackId="coverage" fill="#f59e0b" name="Missing systems" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={BarChart3} title="No coverage data" text="Create benchmarks and test systems to see coverage." />
          )}
        </section>

        <section className="card">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Result Volume
            </h2>
            <LineChart className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          {analytics.volumeChart.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.volumeChart} margin={{ top: 8, right: 16, left: 0, bottom: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" name="Results" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={Clock} title="No dated results" text="Add timestamps to results to see benchmark activity over time." />
          )}
        </section>
      </div>

      <section className="card">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Results
          </h2>
          <Clock className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>
        {analytics.recentResults.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {analytics.recentResults.map((result) => (
              <div key={result.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {result.benchmark?.name || 'Unknown benchmark'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {result.config?.name || 'Unknown test system'}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Score: {formatScore(result.result)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(result.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Clock} title="No recent results" text="Results with timestamps will appear here." />
        )}
      </section>
    </div>
  );
};

const HealthRow = ({ label, value, detail, good }) => (
  <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0 dark:border-gray-800">
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
      <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">{detail}</p>
    </div>
    <span
      className={`inline-flex min-w-12 justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        good
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200'
          : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200'
      }`}
    >
      {value}
    </span>
  </div>
);

const PerformancePanel = ({ title, icon: Icon, rows, tone }) => (
  <section className="card">
    <div className="mb-5 flex items-center justify-between">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
      <Icon className={`h-5 w-5 ${tone === 'best' ? 'text-emerald-500' : 'text-red-500'}`} />
    </div>
    {rows.length > 0 ? (
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {rows.map((row) => (
          <div key={`${row.benchmark_id}-${row.config_id}-${row.id}`} className="flex items-center justify-between gap-4 py-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {row.benchmark?.name || 'Unknown benchmark'}
              </p>
              <p className="truncate text-sm text-gray-600 dark:text-gray-400">
                {row.config?.name || 'Unknown test system'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatScore(row.result)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {row.benchmark?.lower_is_better ? 'Lower is better' : 'Higher is better'}
              </p>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <EmptyState icon={Icon} title={`No ${title.toLowerCase()}`} text="Add benchmark results to populate this list." />
    )}
  </section>
);

const EmptyState = ({ icon: Icon, title, text }) => (
  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
    <Icon className="mx-auto mb-4 h-12 w-12 opacity-50" />
    <p className="font-medium">{title}</p>
    <p className="mt-2 text-sm">{text}</p>
  </div>
);

export default Dashboard;
