import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Settings, 
  Plus,
  Edit,
  Trash2,
  Cpu,
  Monitor,
  Motherboard,
  Memory,
  HardDrive
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
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { 'X-API-Key': apiKey };
      
      const [configsRes, cpusRes, gpusRes, mobosRes, ramRes, disksRes, osesRes] = await Promise.all([
        axios.get('/api/config/', { headers }),
        axios.get('/api/cpu/', { headers }),
        axios.get('/api/gpu/', { headers }),
        axios.get('/api/motherboard/', { headers }),
        axios.get('/api/ram/', { headers }),
        axios.get('/api/disk/', { headers }),
        axios.get('/api/oses/', { headers })
      ]);

      setConfigurations(configsRes.data);
      setCpus(cpusRes.data);
      setGpus(gpusRes.data);
      setMotherboards(mobosRes.data);
      setRamTypes(ramRes.data);
      setDisks(disksRes.data);
      setOses(osesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

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
                  {getComponentName(config.cpu_id, cpus)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                  {getComponentName(config.gpu_id, gpus)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                  {getComponentName(config.motherboard_id, motherboards)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                  {getComponentName(config.ram_id, ramTypes, 'type')} - {getComponentName(config.ram_id, ramTypes, 'size')}MB
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                  {getComponentName(config.disk_id, disks)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                  {getComponentName(config.os_id, oses)}
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
        />
      )}
    </div>
  );
};

// Configuration Form Component
const ConfigurationForm = ({ configuration, onClose, onSave, cpus, gpus, motherboards, ramTypes, disks, oses }) => {
  const [formData, setFormData] = useState({
    name: '',
    cpu_id: '',
    gpu_id: '',
    motherboard_id: '',
    ram_id: '',
    disk_id: '',
    os_id: '',
    description: ''
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
                    {cpu.name}
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
                    {gpu.name}
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
                RAM
              </label>
              <select
                value={formData.ram_id}
                onChange={(e) => setFormData({ ...formData, ram_id: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select RAM</option>
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
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
