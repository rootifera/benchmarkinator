import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';

export const emptyPublicData = {
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
};

export const parseComponentIds = (raw, fallbackId, fallbackQuantity = 1) => {
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((value) => parseInt(value, 10)).filter(Boolean);
      }
    } catch {
      // Legacy fields below cover older rows.
    }
  }

  if (!fallbackId) return [];
  return Array.from(
    { length: Math.max(parseInt(fallbackQuantity, 10) || 1, 1) },
    () => fallbackId
  );
};

export const isValidDate = (value) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() > 0;
};

export const formatDate = (value) => {
  if (!isValidDate(value)) return 'No date';
  return new Date(value).toLocaleDateString();
};

export const formatScore = (value) => {
  const score = Number(value);
  if (!Number.isFinite(score)) return 'N/A';
  return score.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

export const compareScores = (a, b, lowerIsBetter) => (
  lowerIsBetter ? Number(a.result) - Number(b.result) : Number(b.result) - Number(a.result)
);

export const formatRank = (rank, total) => {
  if (!rank || !total) return 'Unranked';
  return `#${rank} of ${total}`;
};

export const formatPublicId = (prefix, id) => {
  if (!id && id !== 0) return `${prefix}-?`;
  return `${prefix}-${id}`;
};

export const formatSystemId = (id) => formatPublicId('SYS', id);
export const formatResultId = (id) => formatPublicId('RES', id);
export const formatBenchmarkId = (id) => formatPublicId('BM', id);
export const formatCpuId = (id) => formatPublicId('CPU', id);
export const formatGpuId = (id) => formatPublicId('GPU', id);
export const formatMotherboardId = (id) => formatPublicId('MB', id);

const byId = (items) => new Map(items.map((item) => [item.id, item]));
const compact = (items) => items.filter(Boolean).join(' ').trim();
const uniqueSorted = (items) => [...new Set(items.filter(Boolean))].sort((a, b) => a.localeCompare(b));

export const buildPublicModel = (data) => {
  const lookups = {
    benchmarks: byId(data.benchmarks),
    configs: byId(data.configurations),
    cpus: byId(data.cpus),
    gpus: byId(data.gpus),
    cpuBrands: byId(data.cpuBrands),
    cpuFamilies: byId(data.cpuFamilies),
    gpuManufacturers: byId(data.gpuManufacturers),
    gpuBrands: byId(data.gpuBrands),
    gpuModels: byId(data.gpuModels),
    gpuVramTypes: byId(data.gpuVramTypes),
    motherboards: byId(data.motherboards),
    motherboardManufacturers: byId(data.motherboardManufacturers),
    motherboardChipsets: byId(data.motherboardChipsets),
    ramTypes: byId(data.ramTypes),
    disks: byId(data.disks),
    oses: byId(data.oses),
  };

  const getCPUDisplayName = (cpuId) => {
    const cpu = lookups.cpus.get(cpuId);
    if (!cpu) return 'Unknown CPU';
    const brand = lookups.cpuBrands.get(cpu.cpu_brand_id)?.name;
    const family = lookups.cpuFamilies.get(cpu.cpu_family_id)?.name;
    const details = [cpu.speed, cpu.core_count ? `${cpu.core_count} cores` : ''].filter(Boolean);
    return `${compact([brand, family, cpu.model])}${details.length ? ` (${details.join(', ')})` : ''}`.trim();
  };

  const getGPUDisplayName = (gpuId) => {
    const gpu = lookups.gpus.get(gpuId);
    if (!gpu) return 'Unknown GPU';
    const manufacturer = lookups.gpuManufacturers.get(gpu.gpu_manufacturer_id)?.name;
    const brand = lookups.gpuBrands.get(gpu.gpu_brand_id)?.name;
    const model = lookups.gpuModels.get(gpu.gpu_model_id)?.name;
    const vramType = lookups.gpuVramTypes.get(gpu.gpu_vram_type_id)?.name;
    const vram = compact([gpu.vram_size, vramType]);
    return `${compact([manufacturer, brand, model])}${vram ? ` (${vram})` : ''}`.trim();
  };

  const getMotherboardDisplayName = (motherboardId) => {
    const motherboard = lookups.motherboards.get(motherboardId);
    if (!motherboard) return 'Unknown motherboard';
    const manufacturer = lookups.motherboardManufacturers.get(motherboard.manufacturer_id)?.name;
    const chipset = lookups.motherboardChipsets.get(motherboard.chipset_id)?.name;
    return `${compact([manufacturer, motherboard.model])}${chipset ? ` (${chipset})` : ''}`.trim();
  };

  const summarizeComponents = (ids, getName) => {
    if (!ids.length) return ['Unknown'];
    const counts = ids.reduce((acc, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([id, count]) => {
      const name = getName(parseInt(id, 10));
      return count > 1 ? `${count}x ${name}` : name;
    });
  };

  const systemRecords = data.configurations.map((config) => {
    const cpuIds = parseComponentIds(config.cpu_component_ids, config.cpu_id, config.cpu_quantity);
    const gpuIds = parseComponentIds(config.gpu_component_ids, config.gpu_id, config.gpu_quantity);
    const cpuNames = summarizeComponents(cpuIds, getCPUDisplayName);
    const gpuNames = summarizeComponents(gpuIds, getGPUDisplayName);
    const osName = lookups.oses.get(config.os_id)?.name || 'Unknown OS';
    const ramName = lookups.ramTypes.get(config.ram_id)?.name || 'Unknown RAM';
    const diskName = lookups.disks.get(config.disk_id)?.name || 'Unknown storage';
    const motherboardName = getMotherboardDisplayName(config.motherboard_id);
    const configResults = data.results.filter((result) => result.config_id === config.id);
    const datedResults = configResults.filter((result) => isValidDate(result.timestamp));
    const newestResult = datedResults.length
      ? [...datedResults].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]
      : null;
    const benchmarkCount = new Set(configResults.map((result) => result.benchmark_id)).size;

    return {
      config,
      id: config.id,
      publicId: formatSystemId(config.id),
      name: config.name,
      cpuNames,
      gpuNames,
      cpuText: cpuNames.join(', '),
      gpuText: gpuNames.join(', '),
      osName,
      ramText: compact([ramName, config.ram_size]),
      diskName,
      motherboardName,
      resultCount: configResults.length,
      benchmarkCount,
      newestResult,
      newestDate: newestResult?.timestamp || null,
      searchText: compact([
        formatSystemId(config.id),
        config.name,
        cpuNames.join(' '),
        gpuNames.join(' '),
        cpuIds.map(formatCpuId).join(' '),
        gpuIds.map(formatGpuId).join(' '),
        formatMotherboardId(config.motherboard_id),
        osName,
        ramName,
        config.ram_size,
        diskName,
        motherboardName,
        config.notes,
      ]).toLowerCase(),
    };
  });

  const systemsById = byId(systemRecords.map((system) => ({ id: system.id, ...system })));

  const resultRecords = data.results.map((result) => {
    const benchmark = lookups.benchmarks.get(result.benchmark_id);
    const system = systemsById.get(result.config_id);
    return {
      result,
      id: result.id,
      publicId: formatResultId(result.id),
      benchmark,
      system,
      score: Number(result.result),
      date: result.timestamp,
      searchText: compact([
        formatResultId(result.id),
        formatBenchmarkId(benchmark?.id),
        benchmark?.name,
        system?.name,
        system?.cpuText,
        system?.gpuText,
        system?.osName,
        system?.motherboardName,
        result.notes,
      ]).toLowerCase(),
    };
  });

  const validResults = resultRecords.filter((record) => Number.isFinite(record.score));
  const resultsByBenchmark = new Map();
  validResults.forEach((record) => {
    if (!record.benchmark) return;
    if (!resultsByBenchmark.has(record.benchmark.id)) {
      resultsByBenchmark.set(record.benchmark.id, []);
    }
    resultsByBenchmark.get(record.benchmark.id).push(record);
  });

  const benchmarkLeaderboards = [...resultsByBenchmark.entries()]
    .map(([benchmarkId, records]) => {
      const benchmark = lookups.benchmarks.get(benchmarkId);
      const sortedRecords = [...records].sort((a, b) => compareScores(a.result, b.result, benchmark?.lower_is_better));
      let previousScore = null;
      let currentRank = 0;
      const rankedRecords = sortedRecords.map((record, index) => {
        const score = Number(record.result.result);
        if (previousScore === null || score !== previousScore) {
          currentRank = index + 1;
          previousScore = score;
        }

        return {
          ...record,
          rank: currentRank,
          rankTotal: sortedRecords.length,
          rankLabel: formatRank(currentRank, sortedRecords.length),
        };
      });

      return {
        benchmark,
        records: rankedRecords,
        leader: rankedRecords[0] || null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.benchmark.name.localeCompare(b.benchmark.name));

  const rankByResultId = new Map();
  benchmarkLeaderboards.forEach((leaderboard) => {
    leaderboard.records.forEach((record) => {
      rankByResultId.set(record.id, {
        rank: record.rank,
        rankTotal: record.rankTotal,
        rankLabel: record.rankLabel,
      });
    });
  });

  const rankedResultRecords = resultRecords.map((record) => ({
    ...record,
    ...(rankByResultId.get(record.id) || {
      rank: null,
      rankTotal: null,
      rankLabel: 'Unranked',
    }),
  }));

  const leaders = benchmarkLeaderboards
    .map((leaderboard) => leaderboard.leader && { ...leaderboard.leader, benchmark: leaderboard.benchmark })
    .filter(Boolean);

  const recentResults = [...rankedResultRecords]
    .filter((record) => isValidDate(record.date))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const systemsWithResults = new Set(data.results.map((result) => result.config_id));
  const benchmarksWithResults = new Set(data.results.map((result) => result.benchmark_id));
  const uniquePairs = new Set(data.results.map((result) => `${result.config_id}:${result.benchmark_id}`));
  const totalPossiblePairs = data.configurations.length * data.benchmarks.length;
  const coveragePercent = totalPossiblePairs
    ? Math.round((uniquePairs.size / totalPossiblePairs) * 100)
    : 0;

  const filterOptions = {
    benchmarks: data.benchmarks
      .filter((benchmark) => benchmarksWithResults.has(benchmark.id))
      .sort((a, b) => a.name.localeCompare(b.name)),
    systems: systemRecords
      .filter((system) => system.resultCount > 0)
      .sort((a, b) => a.name.localeCompare(b.name)),
    cpus: uniqueSorted(systemRecords.flatMap((system) => system.cpuNames)),
    gpus: uniqueSorted(systemRecords.flatMap((system) => system.gpuNames)),
    oses: uniqueSorted(systemRecords.map((system) => system.osName)),
  };

  return {
    data,
    lookups,
    systemRecords,
    resultRecords: rankedResultRecords,
    validResults: rankedResultRecords.filter((record) => Number.isFinite(record.score)),
    benchmarkLeaderboards,
    leaders,
    recentResults,
    filterOptions,
    analytics: {
      totalSystems: data.configurations.length,
      systemsWithResults: systemsWithResults.size,
      totalResults: data.results.length,
      totalBenchmarks: data.benchmarks.length,
      totalCpus: data.cpus.length,
      totalGpus: data.gpus.length,
      coveragePercent,
      newestResult: recentResults[0] || null,
    },
  };
};

export const usePublicData = () => {
  const [data, setData] = useState(emptyPublicData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(buildApiUrl('/api/public/results-data'));
      setData((current) => ({ ...current, ...response.data }));
    } catch (fetchError) {
      console.error('Error fetching public benchmark data:', fetchError);
      setError('Could not load public benchmark data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const model = useMemo(() => buildPublicModel(data), [data]);

  return {
    ...model,
    loading,
    error,
    refetch: fetchData,
  };
};
