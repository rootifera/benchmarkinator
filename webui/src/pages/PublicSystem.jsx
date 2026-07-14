import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  ArrowRight,
  Cpu,
  Database,
  HardDrive,
  Link as LinkIcon,
  Monitor,
  Settings,
  TrendingUp,
  Tv,
} from 'lucide-react';
import { buildApiUrl } from '../config/api';
import {
  formatRank,
  formatBenchmarkId,
  formatCpuId,
  formatGpuId,
  formatMotherboardId,
  formatResultId,
  formatSystemId,
} from '../utils/publicData';

const compact = (items) => items.filter(Boolean).join(' ').trim();
const compactDescription = (items) => items.filter(Boolean).join(' | ').trim();
const displaySerial = (item, fallback) => item?.serial || fallback;

const parseComponentIds = (raw, fallbackId, fallbackQuantity = 1) => {
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((value) => parseInt(value, 10)).filter(Boolean);
      }
    } catch {
      // Fall back to legacy fields below.
    }
  }

  if (!fallbackId) return [];
  return Array.from(
    { length: Math.max(parseInt(fallbackQuantity, 10) || 1, 1) },
    () => fallbackId
  );
};

const summarizeComponentIds = (ids) => {
  if (!ids.length) return [];
  const counts = ids.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).map(([id, count]) => ({
    id: parseInt(id, 10),
    count,
  }));
};

const formatDate = (value) => {
  const date = new Date(value);
  return date.getTime() > 0 ? date.toLocaleDateString() : 'No date';
};

const formatScore = (value) => {
  const score = Number(value);
  if (!Number.isFinite(score)) return 'N/A';
  return score.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const PublicSystem = () => {
  const { configId } = useParams();
  const numericConfigId = parseInt(configId, 10);
  const [data, setData] = useState({
    results: [],
    benchmarks: [],
    configurations: [],
    cpus: [],
    gpus: [],
    cpuBrands: [],
    cpuFamilies: [],
    gpuManufacturers: [],
    gpuBrands: [],
    gpuModels: [],
    gpuVramTypes: [],
    motherboards: [],
    motherboardManufacturers: [],
    motherboardChipsets: [],
    ramTypes: [],
    disks: [],
    oses: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [compareConfigId, setCompareConfigId] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(buildApiUrl('/api/public/results-data'));
      setData((current) => ({ ...current, ...response.data }));
    } catch (fetchError) {
      console.error('Error fetching public system data:', fetchError);
      setError('Could not load this test system.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const lookups = useMemo(() => ({
    benchmarks: new Map(data.benchmarks.map((benchmark) => [benchmark.id, benchmark])),
    cpuBrands: new Map(data.cpuBrands.map((brand) => [brand.id, brand])),
    cpuFamilies: new Map(data.cpuFamilies.map((family) => [family.id, family])),
    gpuManufacturers: new Map(data.gpuManufacturers.map((manufacturer) => [manufacturer.id, manufacturer])),
    gpuBrands: new Map(data.gpuBrands.map((brand) => [brand.id, brand])),
    gpuModels: new Map(data.gpuModels.map((model) => [model.id, model])),
    gpuVramTypes: new Map(data.gpuVramTypes.map((type) => [type.id, type])),
    motherboardManufacturers: new Map(data.motherboardManufacturers.map((manufacturer) => [manufacturer.id, manufacturer])),
    motherboardChipsets: new Map(data.motherboardChipsets.map((chipset) => [chipset.id, chipset])),
    ramTypes: new Map(data.ramTypes.map((ram) => [ram.id, ram])),
    disks: new Map(data.disks.map((disk) => [disk.id, disk])),
    oses: new Map(data.oses.map((os) => [os.id, os])),
  }), [data]);

  const config = data.configurations.find((item) => item.id === numericConfigId);
  const systemResults = data.results
    .filter((result) => result.config_id === numericConfigId)
    .sort((a, b) => {
      const benchmarkA = lookups.benchmarks.get(a.benchmark_id)?.name || '';
      const benchmarkB = lookups.benchmarks.get(b.benchmark_id)?.name || '';
      return benchmarkA.localeCompare(benchmarkB);
    });
  const targetConfigId = compareConfigId ? parseInt(compareConfigId, 10) : null;
  const targetConfig = data.configurations.find((item) => item.id === targetConfigId);

  const compareScores = (a, b, lowerIsBetter) => {
    return lowerIsBetter ? a.result - b.result : b.result - a.result;
  };

  const rankByResultId = useMemo(() => {
    const ranks = new Map();

    data.benchmarks.forEach((benchmark) => {
      const sortedResults = data.results
        .filter((result) => result.benchmark_id === benchmark.id && Number.isFinite(Number(result.result)))
        .map((result) => ({ ...result, result: Number(result.result) }))
        .sort((a, b) => compareScores(a, b, benchmark.lower_is_better));

      let previousScore = null;
      let currentRank = 0;
      sortedResults.forEach((result, index) => {
        if (previousScore === null || result.result !== previousScore) {
          currentRank = index + 1;
          previousScore = result.result;
        }

        ranks.set(result.id, {
          rank: currentRank,
          total: sortedResults.length,
          label: formatRank(currentRank, sortedResults.length),
        });
      });
    });

    return ranks;
  }, [data.benchmarks, data.results]);

  const getBestResult = (results, benchmark) => {
    const validResults = results
      .filter((result) => Number.isFinite(Number(result.result)))
      .map((result) => ({ ...result, result: Number(result.result) }));
    if (!validResults.length) return null;
    return [...validResults].sort((a, b) => compareScores(a, b, benchmark.lower_is_better))[0];
  };

  const calculateComparisonLead = (primaryValue, targetValue, lowerIsBetter) => {
    if (primaryValue === targetValue) {
      return { leader: 'tie', margin: 0 };
    }

    const primaryLeads = lowerIsBetter
      ? primaryValue < targetValue
      : primaryValue > targetValue;
    const weakerValue = primaryLeads ? targetValue : primaryValue;
    const margin = weakerValue === 0
      ? 0
      : (Math.abs(primaryValue - targetValue) / Math.abs(weakerValue)) * 100;

    return {
      leader: primaryLeads ? 'primary' : 'target',
      margin,
    };
  };

  const scoreBadgeClass = (state) => {
    if (state === 'winner') {
      return 'bg-emerald-600 text-white ring-1 ring-emerald-500 dark:bg-emerald-500 dark:text-emerald-950 dark:ring-emerald-400';
    }
    if (state === 'loser') {
      return 'bg-red-600 text-white ring-1 ring-red-500 dark:bg-red-500 dark:text-red-950 dark:ring-red-400';
    }
    return 'bg-gray-200 text-gray-800 ring-1 ring-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600';
  };

  const comparisonRows = useMemo(() => {
    if (!targetConfigId) return [];

    return data.benchmarks
      .map((benchmark) => {
        const primaryResult = getBestResult(
          data.results.filter((result) => result.config_id === numericConfigId && result.benchmark_id === benchmark.id),
          benchmark
        );
        const targetResult = getBestResult(
          data.results.filter((result) => result.config_id === targetConfigId && result.benchmark_id === benchmark.id),
          benchmark
        );

        if (!primaryResult || !targetResult) return null;

        const lead = calculateComparisonLead(
          Number(primaryResult.result),
          Number(targetResult.result),
          benchmark.lower_is_better
        );

        return {
          benchmark,
          primaryResult,
          targetResult,
          primaryRank: rankByResultId.get(primaryResult.id),
          targetRank: rankByResultId.get(targetResult.id),
          lead,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.benchmark.name.localeCompare(b.benchmark.name));
  }, [data.benchmarks, data.results, numericConfigId, rankByResultId, targetConfigId]);

  const getCPUDetail = (cpuId) => {
    const cpu = data.cpus.find((item) => item.id === cpuId);
    if (!cpu) return { title: 'Unknown CPU', detail: '' };
    const brand = lookups.cpuBrands.get(cpu.cpu_brand_id)?.name;
    const family = lookups.cpuFamilies.get(cpu.cpu_family_id)?.name;
    const details = [cpu.speed, cpu.core_count ? `${cpu.core_count} Cores` : ''].filter(Boolean);
    return {
      title: compact([brand, family, cpu.model]) || formatCpuId(cpu.id),
      detail: compactDescription([...details, displaySerial(cpu, formatCpuId(cpu.id))]),
    };
  };

  const getGPUDetail = (gpuId) => {
    const gpu = data.gpus.find((item) => item.id === gpuId);
    if (!gpu) return { title: 'Unknown GPU', detail: '' };
    const manufacturer = lookups.gpuManufacturers.get(gpu.gpu_manufacturer_id)?.name;
    const brand = lookups.gpuBrands.get(gpu.gpu_brand_id)?.name;
    const model = lookups.gpuModels.get(gpu.gpu_model_id)?.name;
    const vramType = lookups.gpuVramTypes.get(gpu.gpu_vram_type_id)?.name;
    const vram = [gpu.vram_size, vramType].filter(Boolean).join(' ');
    return {
      title: compact([manufacturer, brand, model]) || formatGpuId(gpu.id),
      detail: compactDescription([vram, displaySerial(gpu, formatGpuId(gpu.id))]),
    };
  };

  const getMotherboardDetail = (motherboardId) => {
    const motherboard = data.motherboards.find((item) => item.id === motherboardId);
    if (!motherboard) return { title: 'Unknown Motherboard', detail: '' };
    const manufacturer = lookups.motherboardManufacturers.get(motherboard.manufacturer_id)?.name;
    const chipset = lookups.motherboardChipsets.get(motherboard.chipset_id)?.name;
    return {
      title: compact([manufacturer, motherboard.model]) || formatMotherboardId(motherboard.id),
      detail: compactDescription([chipset, displaySerial(motherboard, formatMotherboardId(motherboard.id))]),
    };
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link to="/results" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Results
          </Link>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {error || 'This test system was not found.'}
          </p>
        </div>
      </div>
    );
  }

  const cpuItems = summarizeComponentIds(parseComponentIds(config.cpu_component_ids, config.cpu_id, config.cpu_quantity));
  const gpuItems = summarizeComponentIds(parseComponentIds(config.gpu_component_ids, config.gpu_id, config.gpu_quantity));
  const motherboardDetail = getMotherboardDetail(config.motherboard_id);

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

  const HardwareCard = ({ label, icon: Icon, children }) => (
    <div className="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-2 flex items-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        <Icon className="mr-2 h-4 w-4 text-primary-600 dark:text-primary-400" />
        {label}
      </div>
      <div className="space-y-2 text-sm text-gray-950 dark:text-white">{children}</div>
    </div>
  );

  const hardware = [
    {
      label: 'CPU',
      icon: Cpu,
      value: cpuItems.length
        ? cpuItems.map((item) => <ComponentLine key={`cpu-${item.id}`} count={item.count} {...getCPUDetail(item.id)} />)
        : <span className="text-gray-500 dark:text-gray-400">Unknown CPU</span>,
    },
    {
      label: 'GPU',
      icon: Monitor,
      value: gpuItems.length
        ? gpuItems.map((item) => <ComponentLine key={`gpu-${item.id}`} count={item.count} {...getGPUDetail(item.id)} />)
        : <span className="text-gray-500 dark:text-gray-400">Unknown GPU</span>,
    },
    { label: 'Motherboard', icon: Settings, value: <ComponentLine {...motherboardDetail} /> },
    { label: 'Memory', icon: Database, value: <ComponentLine title={lookups.ramTypes.get(config.ram_id)?.name || 'Unknown RAM'} detail={config.ram_size || 'Unknown'} /> },
    { label: 'Storage', icon: HardDrive, value: <span className="font-medium">{lookups.disks.get(config.disk_id)?.name || 'Unknown'}</span> },
    { label: 'OS', icon: Tv, value: <span className="font-medium">{lookups.oses.get(config.os_id)?.name || 'Unknown'}</span> },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link to="/results" className="mb-4 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Results
          </Link>
          <div className="flex flex-wrap items-center gap-3" title={`${formatSystemId(config.id)} ${config.name}`}>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{config.name}</h1>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Public test system profile and benchmark results
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <LinkIcon className="mr-2 h-4 w-4" />
            {copied ? 'Copied' : 'Copy Link'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {hardware.map((item) => {
          const Icon = item.icon;
          return (
            <HardwareCard key={item.label} label={item.label} icon={Icon}>
              {item.value}
            </HardwareCard>
          );
        })}
      </div>

      {(config.cpu_driver_version || config.gpu_driver_version || config.mb_chipset_driver_version || config.notes) && (
        <div className="rounded-md border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">System Notes</h2>
          <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 dark:text-gray-300 md:grid-cols-3">
            {config.cpu_driver_version && <p><span className="font-medium">CPU driver:</span> {config.cpu_driver_version}</p>}
            {config.gpu_driver_version && <p><span className="font-medium">GPU driver:</span> {config.gpu_driver_version}</p>}
            {config.mb_chipset_driver_version && <p><span className="font-medium">Chipset driver:</span> {config.mb_chipset_driver_version}</p>}
          </div>
          {config.notes && <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{config.notes}</p>}
        </div>
      )}

      <div className="rounded-md border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Benchmark Results</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{systemResults.length} result{systemResults.length === 1 ? '' : 's'}</p>
          </div>
          <TrendingUp className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>
        {systemResults.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No benchmark results have been published for this test system yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {systemResults.map((result) => {
              const benchmark = lookups.benchmarks.get(result.benchmark_id);
              const rank = rankByResultId.get(result.id);
              return (
                <article key={result.id} className="p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-950 dark:text-gray-400">
                          {formatResultId(result.id)}
                        </span>
                        {benchmark?.lower_is_better && (
                          <span className="rounded-full border border-gray-300 px-2 py-0.5 text-[10px] text-gray-700 dark:border-gray-700 dark:text-gray-300">
                            lower is better
                          </span>
                        )}
                      </div>
                      <h3
                        className="mt-2 break-words text-base font-semibold text-gray-950 dark:text-white"
                        title={`${formatBenchmarkId(benchmark?.id)} ${benchmark?.name || 'Unknown'}`}
                      >
                        {benchmark?.name || 'Unknown benchmark'}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{formatDate(result.timestamp)}</p>
                      {result.notes && <p className="mt-2 break-words text-sm text-gray-700 dark:text-gray-300">{result.notes}</p>}
                    </div>
                    <div className="flex shrink-0 gap-3">
                      <div className="flex h-[60px] w-24 flex-col items-center justify-center rounded-md bg-primary-700 px-3 py-2 text-center text-white shadow-sm dark:bg-primary-400 dark:text-primary-950">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-100 dark:text-primary-950/70">Score</p>
                        <p className="mt-0.5 text-lg font-semibold tabular-nums">{formatScore(result.result)}</p>
                      </div>
                      <div className="flex h-[60px] w-20 flex-col items-center justify-center rounded-md bg-gray-100 px-3 py-2 text-center dark:bg-gray-800">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Rank</p>
                        <p className="mt-0.5 text-sm font-semibold tabular-nums text-gray-950 dark:text-white">{rank?.label || 'Unranked'}</p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-md border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Compare This System</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {config.name} is locked as the primary system. Select another test system to compare matching benchmark results.
          </p>
        </div>
        <div className="space-y-5 p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-end">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Primary
              </label>
              <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                {config.name}
              </div>
            </div>
            <div className="hidden pb-2 text-gray-400 lg:block">
              <ArrowRight className="h-5 w-5" />
            </div>
            <div>
              <label htmlFor="compare-target" className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Compare Against
              </label>
              <select
                id="compare-target"
                value={compareConfigId}
                onChange={(event) => setCompareConfigId(event.target.value)}
                className="input-field"
              >
                <option value="">Select a test system</option>
                {data.configurations
                  .filter((item) => item.id !== numericConfigId)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {!targetConfigId ? (
            <div className="rounded-md bg-gray-50 p-5 text-center text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              Choose a target test system to compare against {config.name}.
            </div>
          ) : comparisonRows.length === 0 ? (
            <div className="rounded-md bg-gray-50 p-5 text-center text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              {targetConfig?.name || 'The selected system'} does not share any benchmark results with {config.name}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Benchmark</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      <span title={`${formatSystemId(config.id)} ${config.name}`}>{config.name}</span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      <span title={targetConfig ? `${formatSystemId(targetConfig.id)} ${targetConfig.name}` : 'Target'}>{targetConfig?.name || 'Target'}</span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Leader</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
                  {comparisonRows.map((row) => {
                    const isPrimaryAhead = row.lead.leader === 'primary';
                    const isTie = row.lead.leader === 'tie' || row.lead.margin < 0.01;
                    const leaderName = isPrimaryAhead ? config.name : targetConfig?.name || 'Target';
                    const leaderId = isPrimaryAhead ? formatSystemId(config.id) : formatSystemId(targetConfig?.id);
                    const leaderText = isTie
                      ? 'Even'
                      : `${isPrimaryAhead ? 'Primary' : 'Target'} leads by ${row.lead.margin.toFixed(2)}%`;
                    const leaderTitle = isTie
                      ? 'Both systems are even'
                      : `${leaderId} ${leaderName} leads by ${row.lead.margin.toFixed(2)}%`;
                    const primaryScoreState = isTie ? 'tie' : isPrimaryAhead ? 'winner' : 'loser';
                    const targetScoreState = isTie ? 'tie' : isPrimaryAhead ? 'loser' : 'winner';
                    return (
                      <tr key={row.benchmark.id}>
                        <td
                          className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white"
                          title={`${formatBenchmarkId(row.benchmark.id)} ${row.benchmark.name}`}
                        >
                          {row.benchmark.name}
                          {row.benchmark.lower_is_better && (
                            <span className="ml-2 rounded-full border border-gray-300 px-2 py-0.5 text-[10px] text-gray-700 dark:border-gray-700 dark:text-gray-300">
                              lower is better
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <div className="space-y-1">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreBadgeClass(primaryScoreState)}`}>
                              {formatScore(row.primaryResult.result)}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{row.primaryRank?.label || 'Unranked'}</p>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <div className="space-y-1">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreBadgeClass(targetScoreState)}`}>
                              {formatScore(row.targetResult.result)}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{row.targetRank?.label || 'Unranked'}</p>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <span
                            title={leaderTitle}
                            className={`inline-flex max-w-64 truncate rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isTie
                              ? 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                              : isPrimaryAhead
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                          >
                            {leaderText}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicSystem;
