import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import axios from 'axios';

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
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { 'X-API-Key': apiKey };
      
      const [
        configsRes, cpusRes, gpusRes, mobosRes, ramRes, disksRes, osesRes,
        cpuBrandsRes, cpuFamiliesRes, gpuBrandsRes, gpuModelsRes, gpuVRAMTypesRes
      ] = await Promise.all([
        axios.get('/api/config/', { headers }),
        axios.get('/api/cpu/', { headers }),
        axios.get('/api/gpu/', { headers }),
        axios.get('/api/motherboard/', { headers }),
        axios.get('/api/ram/', { headers }),
        axios.get('/api/disk/', { headers }),
        axios.get('/api/oses/', { headers }),
        axios.get('/api/cpu/brand/', { headers }),
        axios.get('/api/cpu/family/', { headers }),
        axios.get('/api/gpu/brand/', { headers }),
        axios.get('/api/gpu/model/', { headers }),
        axios.get('/api/gpu/vram_type/', { headers })
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
        await axios.delete(`/api/config/${id}`, { headers });
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
  const getCPUDisplayName = (cpuId) => {
    const cpu = cpus.find(c => c.id === cpuId);
    if (!cpu) return 'Unknown';
    
    const brand = cpuBrands.find(b => b.id === cpu.cpu_brand_id);
    const family = cpuFamilies.find(f => f.id === cpu.cpu_family_id);
    
    if (brand && family) {
      return `${brand.name} ${family.name} ${cpu.model} ${cpu.speed}`;
    } else if (brand) {
      return `${brand.name} ${cpu.model} ${cpu.speed}`;
    } else {
      return `${cpu.model} ${cpu.speed}`;
    }
  };

  const getGPUDisplayName = (gpuId) => {
    const gpu = gpus.find(g => g.id === gpuId);
    if (!gpu) return 'Unknown';
    
    const brand = gpuBrands.find(b => b.id === gpu.gpu_brand_id);
    const model = gpuModels.find(m => m.id === gpu.gpu_model_id);
    const vramType = gpuVRAMTypes.find(v => v.id === gpu.gpu_vram_type_id);
    
    let displayName = '';
    if (brand) displayName += `${brand.name} `;
    if (model) displayName += `${model.name} `;
    displayName += `${gpu.vram_size}`;
    if (vramType) displayName += ` (${vramType.name})`;
    
    return displayName.trim();
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
        <div className="text-center py-8 text-secondary-500">
          No configurations found. Click the "Add New" button to create one.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-secondary-200">
          <thead className="bg-secondary-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                CPU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                GPU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Motherboard
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                RAM
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Disk
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                OS
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Overclocking
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Driver Versions
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-200">
            {configurations.map((config) => (
              <tr key={config.id} className="hover:bg-secondary-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                  {config.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                  {getCPUDisplayName(config.cpu_id)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                  {getGPUDisplayName(config.gpu_id)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                  {getComponentName(config.motherboard_id, motherboards)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                  {getComponentName(config.ram_type_id, ramTypes, 'type')} - {config.ram_size}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                  {getComponentName(config.disk_id, disks)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                  {getComponentName(config.os_id, oses)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                  <div className="flex flex-wrap gap-1">
                    {config.cpu_overclock && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        CPU OC
                        {config.cpu_currentclock && (
                          <span className="ml-1 text-xs">({config.cpu_currentclock}MHz)</span>
                        )}
                      </span>
                    )}
                    {config.gpu_core_overclock && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        GPU Core OC
                        {config.gpu_core_currentclock && (
                          <span className="ml-1 text-xs">({config.gpu_core_currentclock}MHz)</span>
                        )}
                      </span>
                    )}
                    {config.gpu_vram_overclock && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        GPU VRAM OC
                        {config.gpu_vram_currentclock && (
                          <span className="ml-1 text-xs">({config.gpu_vram_currentclock}MHz)</span>
                        )}
                      </span>
                    )}
                    {!config.cpu_overclock && !config.gpu_core_overclock && !config.gpu_vram_overclock && (
                      <span className="text-gray-500 text-xs">None</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                  <div className="flex flex-wrap gap-1">
                    {config.cpu_driver_version && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        CPU: {config.cpu_driver_version}
                      </span>
                    )}
                    {config.gpu_driver_version && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        GPU: {config.gpu_driver_version}
                      </span>
                    )}
                    {config.mb_chipset_driver_version && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        MB: {config.mb_chipset_driver_version}
                      </span>
                    )}
                    {!config.cpu_driver_version && !config.gpu_driver_version && !config.mb_chipset_driver_version && (
                      <span className="text-gray-500 text-xs">None</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setEditingItem(config)}
                    className="text-primary-600 hover:text-primary-900 mr-3"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(config.id)}
                    className="text-red-600 hover:text-red-900"
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Hardware Configurations</h1>
          <p className="text-secondary-600 mt-2">
            Manage complete hardware configurations combining CPUs, GPUs, motherboards, RAM, disks, and operating systems
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Configuration
        </button>
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
        />
      )}
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
  gpuVRAMTypes
}) => {
  const [formData, setFormData] = useState({
    name: '',
    cpu_id: '',
    gpu_id: '',
    motherboard_id: '',
    ram_type_id: '',
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
        await axios.put(`/api/config/${configuration.id}`, formData, { headers });
      } else {
        await axios.post('/api/config/', formData, { headers });
      }
      onSave();
    } catch (error) {
      console.error('Error saving configuration:', error);
    }
  };

  // Helper function to get CPU display name for dropdown
  const getCPUOptionText = (cpu) => {
    const brand = cpuBrands.find(b => b.id === cpu.cpu_brand_id);
    const family = cpuFamilies.find(f => f.id === cpu.cpu_family_id);
    
    if (brand && family) {
      return `${brand.name} ${family.name} ${cpu.model} ${cpu.speed} (${cpu.core_count} cores)`;
    } else if (brand) {
      return `${brand.name} ${cpu.model} ${cpu.speed} (${cpu.core_count} cores)`;
    } else {
      return `${cpu.model} ${cpu.speed} (${cpu.core_count} cores)`;
    }
  };

  // Helper function to get GPU display name for dropdown
  const getGPUOptionText = (gpu) => {
    const brand = gpuBrands.find(b => b.id === gpu.gpu_brand_id);
    const model = gpuModels.find(m => m.id === gpu.gpu_model_id);
    const vramType = gpuVRAMTypes.find(v => v.id === gpu.gpu_vram_type_id);
    
    let displayText = '';
    if (brand) displayText += `${brand.name} `;
    if (model) displayText += `${model.name} `;
    displayText += `${gpu.vram_size}`;
    if (vramType) displayText += ` (${vramType.name})`;
    
    return displayText.trim();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">
          {configuration ? 'Edit' : 'Add New'} Configuration
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Configuration Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="e.g., MyRetroPC1, Gaming Rig 2024"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                CPU
              </label>
              <select
                value={formData.cpu_id}
                onChange={(e) => setFormData({ ...formData, cpu_id: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select CPU</option>
                {cpus.map(cpu => (
                  <option key={cpu.id} value={cpu.id}>
                    {getCPUOptionText(cpu)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                GPU
              </label>
              <select
                value={formData.gpu_id}
                onChange={(e) => setFormData({ ...formData, gpu_id: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select GPU</option>
                {gpus.map(gpu => (
                  <option key={gpu.id} value={gpu.id}>
                    {getGPUOptionText(gpu)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Motherboard
              </label>
              <select
                value={formData.motherboard_id}
                onChange={(e) => setFormData({ ...formData, motherboard_id: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select Motherboard</option>
                {motherboards.map(mobo => (
                  <option key={mobo.id} value={mobo.id}>
                    {mobo.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                RAM Type
              </label>
              <select
                value={formData.ram_type_id}
                onChange={(e) => setFormData({ ...formData, ram_type_id: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select RAM Type</option>
                {ramTypes.map(ram => (
                  <option key={ram.id} value={ram.id}>
                    {ram.type} - {ram.size}MB
                  </option>
                ))}
              </select>
            </div>
            

            
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Disk
              </label>
              <select
                value={formData.disk_id}
                onChange={(e) => setFormData({ ...formData, disk_id: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select Disk</option>
                {disks.map(disk => (
                  <option key={disk.id} value={disk.id}>
                    {disk.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Operating System
              </label>
              <select
                value={formData.os_id}
                onChange={(e) => setFormData({ ...formData, os_id: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select OS</option>
                {oses.map(os => (
                  <option key={os.id} value={os.id}>
                    {os.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
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
              <label className="block text-sm font-medium text-secondary-700 mb-2">
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
              <label className="block text-sm font-medium text-secondary-700 mb-2">
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
              <label className="block text-sm font-medium text-secondary-700 mb-2">
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="cpu_overclock"
                checked={formData.cpu_overclock || false}
                onChange={(e) => setFormData({ ...formData, cpu_overclock: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="cpu_overclock" className="ml-2 block text-sm text-secondary-700">
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
              <label htmlFor="gpu_core_overclock" className="ml-2 block text-sm text-secondary-700">
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
              <label htmlFor="gpu_vram_overclock" className="ml-2 block text-sm text-secondary-700">
                GPU VRAM Overclocked
              </label>
            </div>
          </div>
          
          {(formData.cpu_overclock || formData.gpu_core_overclock || formData.gpu_vram_overclock) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.cpu_overclock && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      CPU Base Clock (MHz)
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
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      CPU Current Clock (MHz)
                    </label>
                    <input
                      type="number"
                      value={formData.cpu_currentclock || ''}
                      onChange={(e) => setFormData({ ...formData, cpu_currentclock: parseInt(e.target.value) || null })}
                      className="input-field"
                      placeholder="e.g., 4200"
                    />
                  </div>
                </>
              )}
              
              {formData.gpu_core_overclock && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      GPU Core Base Clock (MHz)
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
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      GPU Core Current Clock (MHz)
                    </label>
                    <input
                      type="number"
                      value={formData.gpu_core_currentclock || ''}
                      onChange={(e) => setFormData({ ...formData, gpu_core_currentclock: parseInt(e.target.value) || null })}
                      className="input-field"
                      placeholder="e.g., 2100"
                    />
                  </div>
                </>
              )}
              
              {formData.gpu_vram_overclock && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      GPU VRAM Base Clock (MHz)
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
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      GPU VRAM Current Clock (MHz)
                    </label>
                    <input
                      type="number"
                      value={formData.gpu_vram_currentclock || ''}
                      onChange={(e) => setFormData({ ...formData, gpu_vram_currentclock: parseInt(e.target.value) || null })}
                      className="input-field"
                      placeholder="e.g., 9000"
                    />
                  </div>
                </>
              )}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field"
              rows="3"
              placeholder="Additional notes about this configuration"
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
