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
export const formatRamId = (id) => formatPublicId('RAM', id);
export const formatDiskId = (id) => formatPublicId('DISK', id);
export const formatOsId = (id) => formatPublicId('OS', id);
export const formatTargetId = (id) => formatPublicId('TGT', id);

export const idForType = (type, id) => {
  const formatters = {
    cpu: formatCpuId,
    gpu: formatGpuId,
    motherboard: formatMotherboardId,
    ram: formatRamId,
    disk: formatDiskId,
    os: formatOsId,
    benchmark: formatBenchmarkId,
    result: formatResultId,
    system: formatSystemId,
    target: formatTargetId,
  };
  return (formatters[type] || ((value) => formatPublicId('ID', value)))(id);
};

export const idBadgeClass = 'inline-flex rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-900 dark:text-gray-400';
