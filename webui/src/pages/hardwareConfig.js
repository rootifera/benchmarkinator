export const HARDWARE_TYPES = {
  cpu: {
    label: 'CPU',
    pluralLabel: 'CPUs',
    endpoint: '/api/cpu/',
    missingFieldsMessage: 'Please fill in all required fields for CPU.',
    requiredFields: ['model', 'speed', 'core_count', 'cpu_brand_id', 'cpu_family_id'],
  },
  gpu: {
    label: 'GPU',
    pluralLabel: 'GPUs',
    endpoint: '/api/gpu/',
    missingFieldsMessage: 'Please fill in all required fields for GPU: Manufacturer, VRAM Size, Brand, Model, VRAM Type',
    requiredFields: ['gpu_manufacturer_id', 'vram_size', 'gpu_brand_id', 'gpu_model_id', 'gpu_vram_type_id'],
  },
  motherboard: {
    label: 'Motherboard',
    pluralLabel: 'Motherboards',
    endpoint: '/api/motherboard/',
    missingFieldsMessage: 'Please fill in all required fields for Motherboard: Model, Manufacturer, Chipset',
    requiredFields: ['model', 'manufacturer_id', 'chipset_id'],
  },
  ram: {
    label: 'RAM Type',
    pluralLabel: 'RAM Types',
    endpoint: '/api/ram/',
    missingFieldsMessage: 'Please fill in the RAM type name.',
    requiredFields: ['name'],
  },
  disk: {
    label: 'Disk',
    pluralLabel: 'Disks',
    endpoint: '/api/disk/',
    missingFieldsMessage: 'Please fill in the disk name.',
    requiredFields: ['name'],
  },
  os: {
    label: 'OS',
    pluralLabel: 'Operating Systems',
    endpoint: '/api/oses/',
    missingFieldsMessage: 'Please fill in the OS name.',
    requiredFields: ['name'],
  },
};

export const LOOKUP_TYPES = {
  cpu: {
    brand: {
      label: 'Brand',
      endpoint: '/api/cpu/brand/',
      dependencyName: 'components',
    },
    family: {
      label: 'Family',
      endpoint: '/api/cpu/family/',
      dependencyName: 'components',
    },
  },
  gpu: {
    manufacturer: {
      label: 'Manufacturer',
      endpoint: '/api/gpu/manufacturer/',
      dependencyName: 'components',
    },
    brand: {
      label: 'Brand',
      endpoint: '/api/gpu/brand/',
      dependencyName: 'components',
    },
    model: {
      label: 'Model',
      endpoint: '/api/gpu/model/',
      dependencyName: 'components',
    },
    vram_type: {
      label: 'VRAM Type',
      endpoint: '/api/gpu/vram_type/',
      dependencyName: 'components',
    },
  },
  motherboard: {
    manufacturer: {
      label: 'Manufacturer',
      endpoint: '/api/motherboard/manufacturer/',
      dependencyName: 'components',
    },
    chipset: {
      label: 'Chipset',
      endpoint: '/api/motherboard/chipset/',
      dependencyName: 'components',
    },
  },
};

export const getHardwareConfig = (type) => HARDWARE_TYPES[type] || {
  label: type.charAt(0).toUpperCase() + type.slice(1),
  pluralLabel: type.charAt(0).toUpperCase() + type.slice(1),
  endpoint: `/api/${type}/`,
  missingFieldsMessage: 'Please fill in all required fields.',
  requiredFields: ['name'],
};

export const getLookupConfig = (activeTab, type) => LOOKUP_TYPES[activeTab]?.[type] || null;

export const hasRequiredFields = (fields, formData) => {
  return fields.every((field) => {
    const value = formData[field];
    return value !== undefined && value !== null && value !== '';
  });
};

export const showToast = (message, type = 'info', duration) => {
  if (window.showToast) {
    window.showToast(message, type, duration);
  }
};

export const showRequestError = (error, fallbackMessage) => {
  if (error.response?.data?.detail) {
    showToast(`Error: ${error.response.data.detail}`, 'error');
    return;
  }

  showToast(fallbackMessage, 'error');
};
