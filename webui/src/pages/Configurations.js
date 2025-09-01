import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Edit,
  Trash2,
  Wrench,
  Cpu,
  Monitor,
  Settings,
  Database,
  HardDrive,
  Tv,
  Search
} from 'lucide-react';
import axios from 'axios';
import SearchableSelect from '../components/SearchableSelect';
import { buildApiUrl } from '../config/api';

const Configurations = () => {
  const { apiKey } = useAuth();
  const [configurations, setConfigurations] = useState([]);
  const [cpus, setCpus] = useState([]);
  const [gpus, setGpus] = useState([]);
  const [motherboards, setMotherboards] = useState([]);
  const [ramTypes, setRamTypes] = useState([]);
  const [disks, setDisks] = useState([]);
  const [oses, setOses] = useState([]);
  // Add lookup data for hierarchical display
  const [cpuBrands, setCpuBrands] = useState([]);
  const [cpuFamilies, setCpuFamilies] = useState([]);
  const [gpuBrands, setGpuBrands] = useState([]);
  const [gpuModels, setGpuModels] = useState([]);
  const [gpuVRAMTypes, setGpuVRAMTypes] = useState([]);
  const [gpuManufacturers, setGpuManufacturers] = useState([]);
  const [motherboardManufacturers, setMotherboardManufacturers] = useState([]);
  const [motherboardChipsets, setMotherboardChipsets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { 'X-API-Key': apiKey };
      
      const [
        configsRes, cpusRes, gpusRes, mobosRes, ramRes, disksRes, osesRes,
        cpuBrandsRes, cpuFamiliesRes, gpuBrandsRes, gpuModelsRes, gpuVRAMTypesRes, gpuManufacturersRes,
        motherboardManufacturersRes, motherboardChipsetsRes
      ] = await Promise.all([
        axios.get(buildApiUrl('/api/config/'), { headers }),
        axios.get(buildApiUrl('/api/cpu/'), { headers }),
        axios.get(buildApiUrl('/api/gpu/'), { headers }),
        axios.get(buildApiUrl('/api/motherboard/'), { headers }),
        axios.get(buildApiUrl('/api/ram/'), { headers }),
        axios.get(buildApiUrl('/api/disk/'), { headers }),
        axios.get(buildApiUrl('/api/oses/'), { headers }),
        axios.get(buildApiUrl('/api/cpu/brand/'), { headers }),
        axios.get(buildApiUrl('/api/cpu/family/'), { headers }),
        axios.get(buildApiUrl('/api/gpu/brand/'), { headers }),
        axios.get(buildApiUrl('/api/gpu/model/'), { headers }),
        axios.get(buildApiUrl('/api/gpu/vram_type/'), { headers }),
        axios.get(buildApiUrl('/api/gpu/manufacturer/'), { headers }),
        axios.get(buildApiUrl('/api/motherboard/manufacturer/'), { headers }),
        axios.get(buildApiUrl('/api/motherboard/chipset/'), { headers })
      ]);

      setConfigurations(configsRes.data);
      setCpus(cpusRes.data);
      setGpus(gpusRes.data);
      setMotherboards(mobosRes.data);
      setRamTypes(ramRes.data);
      setDisks(disksRes.data);
      setOses(osesRes.data);
      setCpuBrands(cpuBrandsRes.data);
      setCpuFamilies(cpuFamiliesRes.data);
      setGpuBrands(gpuBrandsRes.data);
      setGpuModels(gpuModelsRes.data);
      setGpuVRAMTypes(gpuVRAMTypesRes.data);
      setGpuManufacturers(gpuManufacturersRes.data);
      setMotherboardManufacturers(motherboardManufacturersRes.data);
      setMotherboardChipsets(motherboardChipsetsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this configuration?')) {
      try {
        const headers = { 'X-API-Key': apiKey };
        await axios.delete(buildApiUrl(`/api/config/${id}`), { headers });
        fetchData();
      } catch (error) {
        console.error('Error deleting configuration:', error);
      }
    }
  };

  const getComponentName = (id, components, field = 'name') => {
    const component = components.find(c => c.id === id);
    return component ? component[field] : 'Unknown';
  };

  // Enhanced component name resolution for hierarchical display
  // Format: Brand Family Model [Speed - N Cores][Serial if exists] 
  const getCPUDisplayName = (cpuId) => {
    const cpu = cpus.find(c => c.id === cpuId);
    if (!cpu) return 'Unknown';
    
    const brand = cpuBrands.find(b => b.id === cpu.cpu_brand_id);
    const family = cpuFamilies.find(f => f.id === cpu.cpu_family_id);
    
    let displayText = '';
    
    // Brand Family Model
    if (brand) displayText += `${brand.name} `;
    if (family) displayText += `${family.name} `;
    displayText += cpu.model;
    
    // [Speed - N Cores]
    const speedAndCores = [];
    if (cpu.speed) speedAndCores.push(cpu.speed);
    if (cpu.core_count) speedAndCores.push(`${cpu.core_count} Cores`);
    if (speedAndCores.length > 0) {
      displayText += ` [${speedAndCores.join(' - ')}]`;
    }
    
    // [Serial if exists]
    if (cpu.serial) {
      displayText += ` [${cpu.serial}]`;
    }
    
    return displayText.trim();
  };

  // Format: Manufacturer Brand Model [VRAM Size VRAM TYPE][Serial if exists]
  const getGPUDisplayName = (gpuId) => {
    const gpu = gpus.find(g => g.id === gpuId);
    if (!gpu) return 'Unknown';
    
    const manufacturer = gpuManufacturers.find(m => m.id === gpu.gpu_manufacturer_id);
    const brand = gpuBrands.find(b => b.id === gpu.gpu_brand_id);
    const model = gpuModels.find(m => m.id === gpu.gpu_model_id);
    const vramType = gpuVRAMTypes.find(v => v.id === gpu.gpu_vram_type_id);
    
    let displayText = '';
    
    // Manufacturer Brand Model
    if (manufacturer) displayText += `${manufacturer.name} `;
    if (brand) displayText += `${brand.name} `;
    if (model) displayText += `${model.name}`;
    
    // [VRAM Size VRAM TYPE]
    const vramInfo = [];
    if (gpu.vram_size) vramInfo.push(gpu.vram_size);
    if (vramType) vramInfo.push(vramType.name);
    if (vramInfo.length > 0) {
      displayText += ` [${vramInfo.join(' ')}]`;
    }
    
    // [Serial if exists]
    if (gpu.serial) {
      displayText += ` [${gpu.serial}]`;
    }
    
    return displayText.trim();
  };

  // Format: Manufacturer Model [Chipset][Serial if exists]
  const getMotherboardDisplayName = (motherboardId) => {
    const motherboard = motherboards.find(m => m.id === motherboardId);
    if (!motherboard) return 'Unknown';
    
    const manufacturer = motherboardManufacturers.find(m => m.id === motherboard.manufacturer_id);
    const chipset = motherboardChipsets.find(c => c.id === motherboard.chipset_id);
    
    let displayText = '';
    
    // Manufacturer Model
    if (manufacturer) displayText += `${manufacturer.name} `;
    if (motherboard.model) displayText += motherboard.model;
    
    // [Chipset] if exists
    if (chipset) {
      displayText += ` [${chipset.name}]`;
    }
    
    // [Serial if exists]
    if (motherboard.serial) {
      displayText += ` [${motherboard.serial}]`;
    }
    
    return displayText.trim();
  };

  const renderTable = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (configurations.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No test systems found</p>
          <p className="text-sm mt-2">Click the "Create Test System" button to create your first configuration</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                CPU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                GPU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Motherboard
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                RAM
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {configurations.map((config) => (
              <tr key={config.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {config.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {getCPUDisplayName(config.cpu_id)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {getGPUDisplayName(config.gpu_id)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {getMotherboardDisplayName(config.motherboard_id)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {getComponentName(config.ram_id, ramTypes, 'name')} - {config.ram_size}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setSelectedConfig(config);
                      setShowDetails(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                    title="Show Details"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingItem(config);
                      setShowForm(true);
                    }}
                    className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(config.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Test Systems
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create and manage hardware configurations for benchmark testing
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
        >
          Create Test System
        </button>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500 text-white">
              <Settings className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Test Systems
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : configurations.length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500 text-white">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                CPU Configurations
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : configurations.filter(c => c.cpu_id).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500 text-white">
              <Monitor className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                GPU Configurations
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : configurations.filter(c => c.gpu_id).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-500 text-white">
              <Settings className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Overclocked Systems
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : configurations.filter(c => 
                  c.cpu_overclock_enabled || 
                  c.gpu_core_overclock_enabled || 
                  c.gpu_vram_overclock_enabled || 
                  c.ram_overclock_enabled
                ).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="card">
        {renderTable()}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <ConfigurationForm
          configuration={editingItem}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingItem(null);
            fetchData();
          }}
          cpus={cpus}
          gpus={gpus}
          motherboards={motherboards}
          ramTypes={ramTypes}
          disks={disks}
          oses={oses}
          cpuBrands={cpuBrands}
          cpuFamilies={cpuFamilies}
          gpuBrands={gpuBrands}
          gpuModels={gpuModels}
          gpuVRAMTypes={gpuVRAMTypes}
          gpuManufacturers={gpuManufacturers}
          motherboardManufacturers={motherboardManufacturers}
          motherboardChipsets={motherboardChipsets}
        />
      )}

      {/* Details Modal */}
      {showDetails && selectedConfig && (
        <ConfigurationDetailsModal
          configuration={selectedConfig}
          onClose={() => {
            setShowDetails(false);
            setSelectedConfig(null);
          }}
          cpus={cpus}
          gpus={gpus}
          motherboards={motherboards}
          ramTypes={ramTypes}
          disks={disks}
          oses={oses}
          cpuBrands={cpuBrands}
          cpuFamilies={cpuFamilies}
          gpuBrands={gpuBrands}
          gpuModels={gpuModels}
          gpuVRAMTypes={gpuVRAMTypes}
          gpuManufacturers={gpuManufacturers}
          motherboardManufacturers={motherboardManufacturers}
          motherboardChipsets={motherboardChipsets}
          getCPUDisplayName={getCPUDisplayName}
          getGPUDisplayName={getGPUDisplayName}
          getMotherboardDisplayName={getMotherboardDisplayName}
          getComponentName={getComponentName}
        />
      )}
    </div>
  );
};

// Configuration Details Modal Component
const ConfigurationDetailsModal = ({ 
  configuration, 
  onClose,
  getCPUDisplayName,
  getGPUDisplayName,
  getMotherboardDisplayName,
  getComponentName,
  ramTypes,
  disks,
  oses
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Test System Details: {configuration.name}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Core Components */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              <Cpu className="w-5 h-5 inline mr-2" />
              Core Components
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">CPU</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  {getCPUDisplayName(configuration.cpu_id)}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">GPU</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  {getGPUDisplayName(configuration.gpu_id)}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Motherboard</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  {getMotherboardDisplayName(configuration.motherboard_id)}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">RAM</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  {getComponentName(configuration.ram_id, ramTypes, 'name')} - {configuration.ram_size}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Storage</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  {getComponentName(configuration.disk_id, disks)}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Operating System</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  {getComponentName(configuration.os_id, oses)}
                </p>
              </div>
            </div>
          </div>

          {/* Overclocking & Drivers */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              <Settings className="w-5 h-5 inline mr-2" />
              Overclocking & Drivers
            </h3>
            
            <div className="space-y-3">
              {/* CPU Overclocking */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">CPU Overclocking</label>
                <div className="mt-1 text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  {configuration.cpu_overclock ? (
                    <div className="space-y-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        Enabled
                      </span>
                      {configuration.cpu_baseclock && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">Base: {configuration.cpu_baseclock}MHz</p>
                      )}
                      {configuration.cpu_currentclock && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">Current: {configuration.cpu_currentclock}MHz</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">Disabled</span>
                  )}
                </div>
              </div>

              {/* GPU Core Overclocking */}
              <div>
                <label className="block text sm font-medium text-gray-700 dark:text-gray-300">GPU Core Overclocking</label>
                <div className="mt-1 text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  {configuration.gpu_core_overclock ? (
                    <div className="space-y-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                        Enabled
                      </span>
                      {configuration.gpu_core_baseclock && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">Base: {configuration.gpu_core_baseclock}MHz</p>
                      )}
                      {configuration.gpu_core_currentclock && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">Current: {configuration.gpu_core_currentclock}MHz</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">Disabled</span>
                  )}
                </div>
              </div>

              {/* GPU VRAM Overclocking */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">GPU VRAM Overclocking</label>
                <div className="mt-1 text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  {configuration.gpu_vram_overclock ? (
                    <div className="space-y-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                        Enabled
                      </span>
                      {configuration.gpu_vram_baseclock && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">Base: {configuration.gpu_vram_baseclock}MHz</p>
                      )}
                      {configuration.gpu_vram_currentclock && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">Current: {configuration.gpu_vram_currentclock}MHz</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">Disabled</span>
                  )}
                </div>
              </div>

              {/* RAM Overclocking */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">RAM Overclocking</label>
                <div className="mt-1 text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  {configuration.ram_overclock ? (
                    <div className="space-y-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
                        Enabled
                      </span>
                      {configuration.ram_baseclock && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">Base: {configuration.ram_baseclock}MHz</p>
                      )}
                      {configuration.ram_currentclock && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">Current: {configuration.ram_currentclock}MHz</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">Disabled</span>
                  )}
                </div>
              </div>

              {/* Driver Versions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Driver Versions</label>
                <div className="mt-1 text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded space-y-1">
                  {configuration.cpu_driver_version && (
                    <p className="text-xs text-gray-600 dark:text-gray-400"><span className="font-medium">CPU:</span> {configuration.cpu_driver_version}</p>
                  )}
                  {configuration.gpu_driver_version && (
                    <p className="text-xs text-gray-600 dark:text-gray-400"><span className="font-medium">GPU:</span> {configuration.gpu_driver_version}</p>
                  )}
                  {configuration.mb_chipset_driver_version && (
                    <p className="text-xs text-gray-600 dark:text-gray-400"><span className="font-medium">Motherboard:</span> {configuration.mb_chipset_driver_version}</p>
                  )}
                  {!configuration.cpu_driver_version && !configuration.gpu_driver_version && !configuration.mb_chipset_driver_version && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">No driver versions specified</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {configuration.notes && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">
              Notes
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{configuration.notes}</p>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Configuration Form Component
const ConfigurationForm = ({ 
  configuration, 
  onClose, 
  onSave, 
  cpus, 
  gpus, 
  motherboards, 
  ramTypes, 
  disks, 
  oses,
  cpuBrands,
  cpuFamilies,
  gpuBrands,
  gpuModels,
  gpuVRAMTypes,
  gpuManufacturers,
  motherboardManufacturers,
  motherboardChipsets
}) => {
  const [formData, setFormData] = useState({
    name: '',
    cpu_id: '',
    gpu_id: '',
    motherboard_id: '',
    ram_id: '',
    ram_size: '',
    disk_id: '',
    os_id: '',
    cpu_driver_version: '',
    gpu_driver_version: '',
    mb_chipset_driver_version: '',
    cpu_overclock: false,
    cpu_baseclock: null,
    cpu_currentclock: null,
    gpu_core_overclock: false,
    gpu_core_baseclock: null,
    gpu_core_currentclock: null,
    gpu_vram_overclock: false,
    gpu_vram_baseclock: null,
    gpu_vram_currentclock: null,
    ram_overclock: false,
    ram_baseclock: null,
    ram_currentclock: null,
    notes: ''
  });
  const { apiKey } = useAuth();

  useEffect(() => {
    if (configuration) {
      setFormData(configuration);
    }
  }, [configuration]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const headers = { 'X-API-Key': apiKey };
      if (configuration) {
        await axios.put(buildApiUrl(`/api/config/${configuration.id}`), formData, { headers });
      } else {
        await axios.post(buildApiUrl('/api/config/'), formData, { headers });
      }
      onSave();
    } catch (error) {
      console.error('Error saving configuration:', error);
    }
  };

  // Helper function to get CPU display name for dropdown
  // Format: Brand Family Model [Speed - N Cores][Serial if exists]
  const getCPUOptionText = (cpu) => {
    const brand = cpuBrands.find(b => b.id === cpu.cpu_brand_id);
    const family = cpuFamilies.find(f => f.id === cpu.cpu_family_id);
    
    let displayText = '';
    
    // Brand Family Model
    if (brand) displayText += `${brand.name} `;
    if (family) displayText += `${family.name} `;
    displayText += cpu.model;
    
    // [Speed - N Cores]
    const speedAndCores = [];
    if (cpu.speed) speedAndCores.push(cpu.speed);
    if (cpu.core_count) speedAndCores.push(`${cpu.core_count} Cores`);
    if (speedAndCores.length > 0) {
      displayText += ` [${speedAndCores.join(' - ')}]`;
    }
    
    // [Serial if exists]
    if (cpu.serial) {
      displayText += ` [${cpu.serial}]`;
    }
    
    return displayText.trim();
  };

  // Helper function to get GPU display name for dropdown
  // Format: Manufacturer Brand Model [VRAM Size VRAM TYPE][Serial if exists]
  const getGPUOptionText = (gpu) => {
    const manufacturer = gpuManufacturers.find(m => m.id === gpu.gpu_manufacturer_id);
    const brand = gpuBrands.find(b => b.id === gpu.gpu_brand_id);
    const model = gpuModels.find(m => m.id === gpu.gpu_model_id);
    const vramType = gpuVRAMTypes.find(v => v.id === gpu.gpu_vram_type_id);
    
    let displayText = '';
    
    // Manufacturer Brand Model
    if (manufacturer) displayText += `${manufacturer.name} `;
    if (brand) displayText += `${brand.name} `;
    if (model) displayText += `${model.name}`;
    
    // [VRAM Size VRAM TYPE]
    const vramInfo = [];
    if (gpu.vram_size) vramInfo.push(gpu.vram_size);
    if (vramType) vramInfo.push(vramType.name);
    if (vramInfo.length > 0) {
      displayText += ` [${vramInfo.join(' ')}]`;
    }
    
    // [Serial if exists]
    if (gpu.serial) {
      displayText += ` [${gpu.serial}]`;
    }
    
    return displayText.trim();
  };

  // Helper function to get Motherboard display name for dropdown
  // Format: Manufacturer Model [Chipset][Serial if exists]
  const getMotherboardOptionText = (motherboard) => {
    const manufacturer = motherboardManufacturers.find(m => m.id === motherboard.manufacturer_id);
    const chipset = motherboardChipsets.find(c => c.id === motherboard.chipset_id);
    
    let displayText = '';
    
    // Manufacturer Model
    if (manufacturer) displayText += `${manufacturer.name} `;
    if (motherboard.model) displayText += motherboard.model;
    
    // [Chipset] if exists
    if (chipset) {
      displayText += ` [${chipset.name}]`;
    }
    
    // [Serial if exists]
    if (motherboard.serial) {
      displayText += ` [${motherboard.serial}]`;
    }
    
    return displayText.trim() || `Motherboard ${motherboard.id}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {configuration ? 'Edit' : 'Create'} Test System Configuration
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              System Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="e.g., High-End Gaming Test, Budget Office Config"
              required
            />
          </div>
          
          {/* Core Components */}
          <div className="space-y-4">
            <div className="flex items-center mb-4">
              <Cpu className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Core Components</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Cpu className="w-4 h-4 inline mr-2" />
                  Processor (CPU)
                </label>
                <SearchableSelect
                  value={formData.cpu_id}
                  onChange={(value) => setFormData({ ...formData, cpu_id: value })}
                  options={cpus.map(cpu => ({
                    id: cpu.id,
                    name: getCPUOptionText(cpu)
                  }))}
                  placeholder="Select CPU"
                  searchPlaceholder="Search CPUs..."
                  required
                />
              </div>
            
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Monitor className="w-4 h-4 inline mr-2" />
                  Graphics Card (GPU)
                </label>
                <SearchableSelect
                  value={formData.gpu_id}
                  onChange={(value) => setFormData({ ...formData, gpu_id: value })}
                  options={gpus.map(gpu => ({
                    id: gpu.id,
                    name: getGPUOptionText(gpu)
                  }))}
                  placeholder="Select GPU"
                  searchPlaceholder="Search GPUs..."
                  required
                />
              </div>
            
            </div>
          </div>
          
          {/* System Components */}
          <div className="space-y-4">
            <div className="flex items-center mb-4">
              <Settings className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">System Components</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Settings className="w-4 h-4 inline mr-2" />
                  Motherboard
                </label>
                <SearchableSelect
                  value={formData.motherboard_id}
                  onChange={(value) => setFormData({ ...formData, motherboard_id: value })}
                  options={motherboards.map(mobo => ({
                    id: mobo.id,
                    name: getMotherboardOptionText(mobo)
                  }))}
                  placeholder="Select Motherboard"
                  searchPlaceholder="Search Motherboards..."
                  required
                />
              </div>
            
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Database className="w-4 h-4 inline mr-2" />
                  Memory (RAM)
                </label>
                <SearchableSelect
                  value={formData.ram_id}
                  onChange={(value) => setFormData({ ...formData, ram_id: value })}
                  options={ramTypes.map(ram => ({
                    id: ram.id,
                    name: ram.name
                  }))}
                  placeholder="Select RAM Type"
                  searchPlaceholder="Search RAM Types..."
                  required
                />
              </div>
            
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <HardDrive className="w-4 h-4 inline mr-2" />
                  Storage (Disk)
                </label>
                <SearchableSelect
                  value={formData.disk_id}
                  onChange={(value) => setFormData({ ...formData, disk_id: value })}
                  options={disks.map(disk => ({
                    id: disk.id,
                    name: disk.name
                  }))}
                  placeholder="Select Disk"
                  searchPlaceholder="Search Disks..."
                  required
                />
              </div>
            
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Tv className="w-4 h-4 inline mr-2" />
                  Operating System
                </label>
                <SearchableSelect
                  value={formData.os_id}
                  onChange={(value) => setFormData({ ...formData, os_id: value })}
                  options={oses.map(os => ({
                    id: os.id,
                    name: os.name
                  }))}
                  placeholder="Select OS"
                  searchPlaceholder="Search Operating Systems..."
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Additional Configuration */}
          <div className="space-y-4">
            <div className="flex items-center mb-4">
              <Settings className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Additional Settings</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CPU Driver Version
                </label>
                <input
                  type="text"
                  value={formData.cpu_driver_version}
                  onChange={(e) => setFormData({ ...formData, cpu_driver_version: e.target.value })}
                  className="input-field"
                  placeholder="e.g., 1.0.0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  GPU Driver Version
                </label>
                <input
                  type="text"
                  value={formData.gpu_driver_version}
                  onChange={(e) => setFormData({ ...formData, gpu_driver_version: e.target.value })}
                  className="input-field"
                  placeholder="e.g., 23.12.1"
                />
              </div>
            </div>
          
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Motherboard Chipset Driver Version
                </label>
                <input
                  type="text"
                  value={formData.mb_chipset_driver_version}
                  onChange={(e) => setFormData({ ...formData, mb_chipset_driver_version: e.target.value })}
                  className="input-field"
                  placeholder="e.g., 2.1.0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  RAM Size
                </label>
                <input
                  type="text"
                  value={formData.ram_size}
                  onChange={(e) => setFormData({ ...formData, ram_size: e.target.value })}
                  className="input-field"
                  placeholder="e.g., 512MB, 8GB"
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Overclocking Settings */}
          <div className="space-y-4">
            <div className="flex items-center mb-4">
              <Settings className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Overclocking</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="cpu_overclock"
                  checked={formData.cpu_overclock || false}
                  onChange={(e) => setFormData({ ...formData, cpu_overclock: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="cpu_overclock" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  CPU Overclocked
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="gpu_core_overclock"
                  checked={formData.gpu_core_overclock || false}
                  onChange={(e) => setFormData({ ...formData, gpu_core_overclock: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="gpu_core_overclock" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  GPU Core Overclocked
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="gpu_vram_overclock"
                  checked={formData.gpu_vram_overclock || false}
                  onChange={(e) => setFormData({ ...formData, gpu_vram_overclock: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="gpu_vram_overclock" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  GPU VRAM Overclocked
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ram_overclock"
                  checked={formData.ram_overclock || false}
                  onChange={(e) => setFormData({ ...formData, ram_overclock: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="ram_overclock" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  RAM Overclocked
                </label>
              </div>
            </div>
          
            {(formData.cpu_overclock || formData.gpu_core_overclock || formData.gpu_vram_overclock || formData.ram_overclock) && (
              <div className="space-y-6">
                {formData.cpu_overclock && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <Cpu className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                      CPU Overclocking Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Base Clock (MHz)
                        </label>
                        <input
                          type="number"
                          value={formData.cpu_baseclock || ''}
                          onChange={(e) => setFormData({ ...formData, cpu_baseclock: parseInt(e.target.value) || null })}
                          className="input-field"
                          placeholder="e.g., 3500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Current Clock (MHz)
                        </label>
                        <input
                          type="number"
                          value={formData.cpu_currentclock || ''}
                          onChange={(e) => setFormData({ ...formData, cpu_currentclock: parseInt(e.target.value) || null })}
                          className="input-field"
                          placeholder="e.g., 4200"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {formData.gpu_core_overclock && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <Monitor className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                      GPU Core Overclocking Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Base Clock (MHz)
                        </label>
                        <input
                          type="number"
                          value={formData.gpu_core_baseclock || ''}
                          onChange={(e) => setFormData({ ...formData, gpu_core_baseclock: parseInt(e.target.value) || null })}
                          className="input-field"
                          placeholder="e.g., 1800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Current Clock (MHz)
                        </label>
                        <input
                          type="number"
                          value={formData.gpu_core_currentclock || ''}
                          onChange={(e) => setFormData({ ...formData, gpu_core_currentclock: parseInt(e.target.value) || null })}
                          className="input-field"
                          placeholder="e.g., 2100"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {formData.gpu_vram_overclock && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <Monitor className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                      GPU VRAM Overclocking Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Base Clock (MHz)
                        </label>
                        <input
                          type="number"
                          value={formData.gpu_vram_baseclock || ''}
                          onChange={(e) => setFormData({ ...formData, gpu_vram_baseclock: parseInt(e.target.value) || null })}
                          className="input-field"
                          placeholder="e.g., 8000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Current Clock (MHz)
                        </label>
                        <input
                          type="number"
                          value={formData.gpu_vram_currentclock || ''}
                          onChange={(e) => setFormData({ ...formData, gpu_vram_currentclock: parseInt(e.target.value) || null })}
                          className="input-field"
                          placeholder="e.g., 9000"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {formData.ram_overclock && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <Database className="w-4 h-4 mr-2 text-orange-600 dark:text-orange-400" />
                      RAM Overclocking Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Base Clock (MHz)
                        </label>
                        <input
                          type="number"
                          value={formData.ram_baseclock || ''}
                          onChange={(e) => setFormData({ ...formData, ram_baseclock: parseInt(e.target.value) || null })}
                          className="input-field"
                          placeholder="e.g., 3200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Current Clock (MHz)
                        </label>
                        <input
                          type="number"
                          value={formData.ram_currentclock || ''}
                          onChange={(e) => setFormData({ ...formData, ram_currentclock: parseInt(e.target.value) || null })}
                          className="input-field"
                          placeholder="e.g., 3600"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field"
              rows="3"
              placeholder="Additional notes about this test system configuration"
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
            >
              {configuration ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Configurations;
