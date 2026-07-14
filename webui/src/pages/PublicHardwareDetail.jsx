import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Cpu, Monitor, Settings } from 'lucide-react';
import {
  formatBenchmarkId,
  formatDate,
  formatResultId,
  formatScore,
  usePublicData,
} from '../utils/publicData';

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

const PublicHardwareDetail = () => {
  const { type, id } = useParams();
  const numericId = parseInt(id, 10);
  const { loading, error, refetch, cpuRecords, gpuRecords, motherboardRecords, resultRecords } = usePublicData();

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

  const collections = {
    cpu: cpuRecords,
    gpu: gpuRecords,
    motherboard: motherboardRecords,
  };
  const collection = collections[type] || [];
  const record = collection.find((item) => item.id === numericId);
  const Icon = hardwareIcons[type] || Cpu;

  if (!record) {
    return (
      <div className="space-y-6">
        <Link to="/hardware" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Hardware
        </Link>
        <div className="rounded-md border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="font-medium text-gray-950 dark:text-white">This hardware item was not found.</p>
        </div>
      </div>
    );
  }

  const systemIds = new Set(record.systems.map((system) => system.id));
  const records = resultRecords
    .filter((result) => result.system && systemIds.has(result.system.id))
    .sort((a, b) => (a.benchmark?.name || '').localeCompare(b.benchmark?.name || '') || a.rank - b.rank);

  return (
    <div className="space-y-8">
      <div>
        <Link to="/hardware" className="mb-4 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Hardware
        </Link>
        <div className="flex items-start gap-3">
          <Icon className="mt-2 h-6 w-6 text-primary-600 dark:text-primary-400" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">
              {hardwareLabels[record.type] || 'Hardware'}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950 dark:text-white" title={`${record.publicId} ${record.name}`}>
              {record.name}
            </h1>
            {record.detail && (
              <p className="mt-2 break-words text-gray-600 dark:text-gray-400">{record.detail}</p>
            )}
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-md border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Systems</p>
          <p className="mt-2 text-3xl font-bold text-gray-950 dark:text-white">{record.systemCount}</p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Results</p>
          <p className="mt-2 text-3xl font-bold text-gray-950 dark:text-white">{record.resultCount}</p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Best Rank</p>
          <p className="mt-2 text-3xl font-bold text-primary-700 dark:text-primary-300">
            {record.bestRanks[0]?.rankLabel || 'N/A'}
          </p>
        </div>
      </section>

      <section className="rounded-md border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-950 dark:text-white">Systems Using This Part</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {record.systems.map((system) => (
            <Link key={system.id} to={`/systems/${system.id}`} className="block px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-primary-700 dark:text-primary-300">{system.name}</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{system.osName}</p>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    {formatComponentSummary(system.cpuDetails, 'Unknown CPU')}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {formatComponentSummary(system.gpuDetails, 'Unknown GPU')}
                  </p>
                </div>
                <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-semibold text-gray-950 dark:text-white">{system.resultCount}</p>
                  <p>results</p>
                </div>
              </div>
            </Link>
          ))}
          {record.systems.length === 0 && <p className="px-5 py-8 text-center text-sm text-gray-500">No systems use this part yet.</p>}
        </div>
      </section>

      <section className="rounded-md border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-950 dark:text-white">Benchmark Results</h2>
        </div>
        {records.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">No results use this part yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-950">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Benchmark</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Rank</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Score</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Settings</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">System</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {records.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-5 py-4 text-sm font-medium text-gray-950 dark:text-white" title={`${formatBenchmarkId(result.benchmark?.id)} ${result.benchmark?.name || 'Unknown'}`}>
                      <Link to={`/benchmarks/${result.benchmark?.id}`} className="hover:text-primary-700 dark:hover:text-primary-300">
                        {result.benchmark?.name || 'Unknown'}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{result.rankLabel}</td>
                    <td className="px-5 py-4 text-sm">
                      <ScorePill id={result.id} value={result.result.result} />
                    </td>
                    <td className="max-w-xs px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <span className="line-clamp-2">{result.settingsLabel}</span>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <Link to={`/systems/${result.system?.id}`} className="font-medium text-primary-700 hover:text-primary-900 dark:text-primary-300">
                        {result.system?.name || 'Unknown system'}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{formatDate(result.date)}</td>
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

export default PublicHardwareDetail;
