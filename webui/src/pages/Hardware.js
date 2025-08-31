import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import { 
  Cpu, 
  Monitor, 
  Settings, 
  Database,
  HardDrive,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import axios from 'axios';

const Hardware = () => {
  const { apiKey } = useAuth();
  const [activeTab, setActiveTab] = useState('cpu');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [showLookupForm, setShowLookupForm] = useState(false);
  const [lookupFormType, setLookupFormType] = useState(null);
  const [editingLookupItem, setEditingLookupItem] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState({});


  const tabs = [
    { id: 'cpu', name: 'CPUs', icon: Cpu },
    { id: 'gpu', name: 'GPUs', icon: Monitor },
    { id: 'motherboard', name: 'Motherboards', icon: Settings },
    { id: 'ram', name: 'RAM', icon: Database },
    { id: 'disk', name: 'Disks', icon: HardDrive },
    { id: 'os', name: 'OS', icon: Monitor },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { 'X-API-Key': apiKey };
      
      // Fetch main data and related lookup data based on active tab
      let mainData, lookupData;
      
      switch (activeTab) {
        case 'cpu':
          [mainData, lookupData] = await Promise.all([
            axios.get('/api/cpu/', { headers }),
            Promise.all([
              axios.get('/api/cpu/brand/', { headers }),
              axios.get('/api/cpu/family/', { headers })
            ])
          ]);
          lookupData = {
            brands: lookupData[0].data,
            families: lookupData[1].data
          };
          break;
          
        case 'gpu':
          [mainData, lookupData] = await Promise.all([
            axios.get('/api/gpu/', { headers }),
            Promise.all([
              axios.get('/api/gpu/manufacturer/', { headers }),
              axios.get('/api/gpu/brand/', { headers }),
              axios.get('/api/gpu/model/', { headers }),
              axios.get('/api/gpu/vram_type/', { headers })
            ])
          ]);
          lookupData = {
            manufacturers: lookupData[0].data,
            brands: lookupData[1].data,
            models: lookupData[2].data,
            vramTypes: lookupData[3].data
          };
          break;
          
        case 'motherboard':
          [mainData, lookupData] = await Promise.all([
            axios.get('/api/motherboard/', { headers }),
            Promise.all([
              axios.get('/api/motherboard/manufacturer/', { headers }),
              axios.get('/api/motherboard/chipset/', { headers })
            ])
          ]);
          lookupData = {
            manufacturers: lookupData[0].data,
            chipsets: lookupData[1].data
          };
          break;
          
        case 'ram':
          const ramResponses = await Promise.all([
            axios.get('http://192.168.1.24:12345/api/ram/', { headers })
          ]);
          mainData = ramResponses[0];
          lookupData = {};
          break;
          
        case 'disk':
          mainData = await axios.get('http://192.168.1.24:12345/api/disk/', { headers });
          lookupData = {};
          break;
          
        case 'os':
          mainData = await axios.get('http://192.168.1.24:12345/api/oses/', { headers });
          lookupData = {};
          break;
          
        default:
          mainData = await axios.get(`/api/${activeTab}/`, { headers });
          lookupData = {};
      }
      
      setData({ main: mainData.data, lookup: lookupData });
    } catch (error) {
      console.error(`Error fetching ${activeTab}:`, error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, apiKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initialize expanded sections for RAM and Disk
  useEffect(() => {
    if (activeTab === 'gpu') {
      setExpandedSections(prev => ({
        ...prev,
        gpu_manufacturers: false, // Collapsed
        gpu_brands: false,        // Collapsed
        gpu_models: false,        // Collapsed
        gpu_vram_types: false,    // Collapsed
        gpu_individual: true      // Expanded (show GPUs table)
      }));
    } else if (activeTab === 'motherboard') {
      setExpandedSections(prev => ({
        ...prev,
        motherboard_manufacturers: false, // Collapsed
        motherboard_chipsets: false,      // Collapsed
        motherboard_individual: true      // Expanded (show Motherboards table)
      }));
    } else if (activeTab === 'ram') {
      // RAM is simplified - no expandable sections needed
    } else if (activeTab === 'disk') {
      // No lookup sections for disk, just show main table
    }
  }, [activeTab]);

  const handleDelete = async (id) => {
    const itemType = activeTab === 'cpu' ? 'CPU' : 
                    activeTab === 'gpu' ? 'GPU' : 
                    activeTab === 'motherboard' ? 'Motherboard' : 
                    activeTab === 'ram' ? 'RAM Type' : 
                    activeTab === 'disk' ? 'Disk' : 
                    activeTab === 'os' ? 'OS' : 
                    activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
    
    setConfirmModalConfig({
      title: `Delete ${itemType}`,
      message: `Are you sure you want to delete this ${itemType}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          const headers = { 'X-API-Key': apiKey };
          
          // Determine the correct delete endpoint
          let deleteEndpoint;
          if (activeTab === 'os') {
            deleteEndpoint = `http://192.168.1.24:12345/api/oses/${id}`;
          } else if (activeTab === 'ram') {
            deleteEndpoint = `http://192.168.1.24:12345/api/ram/${id}`;
          } else if (activeTab === 'disk') {
            deleteEndpoint = `http://192.168.1.24:12345/api/disk/${id}`;
          } else {
            deleteEndpoint = `http://localhost:12345/api/${activeTab}/${id}`;
          }
          
          await axios.delete(deleteEndpoint, { headers });
          fetchData();
          
          // Show success toast
          if (window.showToast) {
            window.showToast(`${itemType} deleted successfully`, 'success');
          }
        } catch (error) {
          console.error('Error deleting item:', error);
          
          // Provide better error messages for common constraint violations
          if (error.response?.status === 409) {
            if (window.showToast) {
              window.showToast(`Cannot delete this ${itemType}. It is currently being used by one or more test systems.`, 'error', 8000);
            }
          } else if (error.response?.status === 404) {
            if (window.showToast) {
              window.showToast('Item not found. It may have already been deleted.', 'warning');
            }
          } else if (error.response?.data?.detail) {
            if (window.showToast) {
              window.showToast(`Error: ${error.response.data.detail}`, 'error');
            }
          } else {
            if (window.showToast) {
              window.showToast('An error occurred while deleting the item. Please try again.', 'error');
            }
          }
        }
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  const handleLookupDelete = async (type, id) => {
    const itemType = type === 'brand' ? 'Brand' : 
                    type === 'family' ? 'Family' : 
                    type === 'manufacturer' ? 'Manufacturer' : 
                    type === 'model' ? 'Model' : 
                    type === 'vram_type' ? 'VRAM Type' : 
                    type === 'chipset' ? 'Chipset' : 
                    type === 'ram_type' ? 'RAM Type' : 
                    type === 'disk_type' ? 'Disk Type' : 
                    type === 'disk_brand' ? 'Disk Brand' : 
                    type === 'disk_interface' ? 'Disk Interface' : 
                    type.charAt(0).toUpperCase() + type.slice(1);
    
    setConfirmModalConfig({
      title: `Delete ${itemType}`,
      message: `Are you sure you want to delete this ${itemType}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          const headers = { 'X-API-Key': apiKey };
          
          // Determine the correct API endpoint based on type
          let endpoint;
          if (type === 'brand' && activeTab === 'cpu') {
            endpoint = `http://localhost:12345/api/cpu/brand/${id}`;
          } else if (type === 'family') {
            endpoint = `http://localhost:12345/api/cpu/family/${id}`;
          } else if (type === 'manufacturer' && activeTab === 'gpu') {
            endpoint = `http://localhost:12345/api/gpu/manufacturer/${id}`;
          } else if (type === 'manufacturer' && activeTab === 'motherboard') {
            endpoint = `http://localhost:12345/api/motherboard/manufacturer/${id}`;
          } else if (type === 'model') {
            endpoint = `http://localhost:12345/api/gpu/model/${id}`;
          } else if (type === 'vram_type') {
            endpoint = `http://localhost:12345/api/gpu/vram_type/${id}`;
          } else if (type === 'chipset') {
            endpoint = `http://localhost:12345/api/motherboard/chipset/${id}`;
          } else if (type === 'ram_type') {
            endpoint = `http://localhost:12345/api/ram/type/${id}`;
          } else if (type === 'disk_type') {
            endpoint = `http://localhost:12345/api/disk/type/${id}`;
          } else if (type === 'disk_brand') {
            endpoint = `http://localhost:12345/api/disk/brand/${id}`;
          } else if (type === 'disk_interface') {
            endpoint = `http://localhost:12345/api/disk/interface/${id}`;
          } else {
            endpoint = `http://localhost:12345/api/${activeTab}/${type}/${id}`;
          }
          
          await axios.delete(endpoint, { headers });
          fetchData();
          
          // Show success toast
          if (window.showToast) {
            window.showToast(`${itemType} deleted successfully`, 'success');
          }
        } catch (error) {
          console.error('Error deleting lookup item:', error);
          
          // Provide better error messages for common constraint violations
          if (error.response?.status === 409) {
            if (window.showToast) {
              window.showToast(`Cannot delete this ${itemType}. It is currently being used by one or more components.`, 'error', 8000);
            }
          } else if (error.response?.status === 404) {
            if (window.showToast) {
              window.showToast('Item not found. It may have already been deleted.', 'warning');
            }
          } else if (error.response?.data?.detail) {
            if (window.showToast) {
              window.showToast(`Error: ${error.response.data.detail}`, 'error');
            }
          } else {
            if (window.showToast) {
              window.showToast('An error occurred while deleting the item. Please try again.', 'error');
            }
          }
        }
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const openLookupForm = (type, item = null) => {
    setLookupFormType(type);
    setEditingLookupItem(item);
    setShowLookupForm(true);
  };

  const renderCPUSection = () => {
    if (!data.lookup) return null;
    
    return (
      <div className="space-y-4">
        {/* CPU Brands Section */}
        <div className="card">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('cpu_brands')}
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">CPU Brands</h3>
            {expandedSections.cpu_brands ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
          
          {expandedSections.cpu_brands && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Manage CPU brands (AMD, Intel, etc.)</span>
                  <div className="text-xs text-gray-500 mt-1">
                    {data.lookup.brands?.length || 0} brand{(data.lookup.brands?.length || 0) !== 1 ? 's' : ''}
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openLookupForm('brand');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                >
                  Add Brand
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Brand Name
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {data.lookup.brands?.map(brand => (
                      <tr key={brand.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {brand.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openLookupForm('brand', brand);
                              }}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLookupDelete('brand', brand.id);
                              }}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* CPU Families Section */}
        <div className="card">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('cpu_families')}
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">CPU Families</h3>
            {expandedSections.cpu_families ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
          
          {expandedSections.cpu_families && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Manage CPU families (K6, Core i7, etc.)</span>
                  <div className="text-xs text-gray-500 mt-1">
                    {data.lookup.families?.length || 0} famil{(data.lookup.families?.length || 0) !== 1 ? 'ies' : 'y'}
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openLookupForm('family');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                >
                  Add Family
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Family Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Brand
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {data.lookup.families?.map(family => {
                      const brand = data.lookup.brands?.find(b => b.id === family.cpu_brand_id);
                      return (
                        <tr key={family.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {family.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {brand ? brand.name : 'Unknown Brand'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openLookupForm('family', family);
                                }}
                                className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLookupDelete('family', family.id);
                                }}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* CPUs Section */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">CPUs</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {data.main?.length || 0} CPU{data.main?.length !== 1 ? 's' : ''} configured
              </p>
            </div>
            <button 
              onClick={() => {
                if (!data.lookup?.brands?.length || !data.lookup?.families?.length) {
                  if (window.showToast) {
                    window.showToast('Please create at least one CPU brand and family before adding CPUs.', 'warning');
                  }
                  return;
                }
                setShowForm(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!data.lookup?.brands?.length || !data.lookup?.families?.length}
            >
              Add CPU
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Family</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Speed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cores</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Serial</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.main?.map((cpu) => {
                  const brand = data.lookup.brands?.find(b => b.id === cpu.cpu_brand_id);
                  const family = data.lookup.families?.find(f => f.id === cpu.cpu_family_id);
                  
                  return (
                    <tr key={cpu.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {brand?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {family?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {cpu.model}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {cpu.speed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {cpu.core_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {cpu.serial || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setEditingItem(cpu);
                            setShowForm(true);
                          }}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cpu.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderGPUSection = () => {
    if (!data.lookup) return null;
    
    return (
      <div className="space-y-4">
        {/* GPU Manufacturers Section */}
        <div className="card">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('gpu_manufacturers')}
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">GPU Manufacturers</h3>
            {expandedSections.gpu_manufacturers ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
          
          {expandedSections.gpu_manufacturers && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Manage GPU manufacturers (Leadtek, ASUS, etc.)</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openLookupForm('manufacturer');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                >
                  Add Manufacturer
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Manufacturer Name
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {data.lookup.manufacturers?.map(manufacturer => (
                      <tr key={manufacturer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {manufacturer.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); openLookupForm('manufacturer', manufacturer); }}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleLookupDelete('manufacturer', manufacturer.id); }}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* GPU Brands Section */}
        <div className="card">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('gpu_brands')}
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">GPU Brands</h3>
            {expandedSections.gpu_brands ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
          
          {expandedSections.gpu_brands && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Manage GPU brands (NVIDIA, ATI, etc.)</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openLookupForm('brand');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                >
                  Add Brand
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Brand Name
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {data.lookup.brands?.map(brand => (
                      <tr key={brand.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {brand.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); openLookupForm('brand', brand); }}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleLookupDelete('brand', brand.id); }}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* GPU Models Section */}
        <div className="card">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('gpu_models')}
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">GPU Models</h3>
            {expandedSections.gpu_models ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
          
          {expandedSections.gpu_models && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Manage GPU models (TNT2 M64, GTX 1080, etc.)</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openLookupForm('model');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                >
                  Add Model
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Model Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Brand
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {data.lookup.models?.map(model => {
                      const brand = data.lookup.brands?.find(b => b.id === model.gpu_brand_id);
                      return (
                        <tr key={model.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {model.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {brand ? brand.name : 'Unknown Brand'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); openLookupForm('model', model); }}
                                className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleLookupDelete('model', model.id); }}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* GPU VRAM Types Section */}
        <div className="card">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('gpu_vram_types')}
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">GPU VRAM Types</h3>
            {expandedSections.gpu_vram_types ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
          
          {expandedSections.gpu_vram_types && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Manage GPU VRAM types (GDDR5, GDDR6, HBM, etc.)</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openLookupForm('vram_type');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                >
                  Add VRAM Type
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        VRAM Type Name
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {data.lookup.vramTypes?.map(vramType => (
                      <tr key={vramType.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {vramType.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); openLookupForm('vram_type', vramType); }}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleLookupDelete('vram_type', vramType.id); }}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Individual GPUs Section */}
        <div className="card">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('gpu_individual')}
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">GPUs</h3>
            {expandedSections.gpu_individual ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
          
          {expandedSections.gpu_individual && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {data.main?.length || 0} GPU{data.main?.length !== 1 ? 's' : ''} configured
                  </p>
                </div>
                <button 
                  onClick={() => {
                    if (!data.lookup?.brands?.length || !data.lookup?.models?.length || !data.lookup?.vramTypes?.length) {
                      alert('Please create at least one GPU brand, model, and VRAM type before adding GPUs.');
                      return;
                    }
                    setShowForm(true);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!data.lookup?.brands?.length || !data.lookup?.models?.length || !data.lookup?.vramTypes?.length}
                >
                  Add GPU
                </button>
              </div>
          
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Manufacturer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Brand</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Model</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">VRAM Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">VRAM Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Serial</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {data.main?.map((gpu) => {
                      const manufacturer = data.lookup.manufacturers?.find(m => m.id === gpu.gpu_manufacturer_id);
                      const brand = data.lookup.brands?.find(b => b.id === gpu.gpu_brand_id);
                      const model = data.lookup.models?.find(m => m.id === gpu.gpu_model_id);
                      const vramType = data.lookup.vramTypes?.find(v => v.id === gpu.gpu_vram_type_id);
                      
                      return (
                        <tr key={gpu.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {manufacturer?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {brand?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {model?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {gpu.vram_size}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {vramType?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {gpu.serial || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => {
                                setEditingItem(gpu);
                                setShowForm(true);
                              }}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(gpu.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMotherboardSection = () => {
    if (!data.lookup) return null;
    
    return (
      <div className="space-y-4">
        {/* Motherboard Manufacturers Section */}
        <div className="card">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('motherboard_manufacturers')}
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Motherboard Manufacturers</h3>
            {expandedSections.motherboard_manufacturers ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
          
          {expandedSections.motherboard_manufacturers && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Manage motherboard manufacturers (ASUS, MSI, Gigabyte, etc.)</span>
                  <div className="text-xs text-gray-500 mt-1">
                    {data.lookup.manufacturers?.length || 0} manufacturer{(data.lookup.manufacturers?.length || 0) !== 1 ? 's' : ''}
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openLookupForm('manufacturer');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                >
                  Add Manufacturer
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Manufacturer Name
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {data.lookup.manufacturers?.map(manufacturer => (
                      <tr key={manufacturer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {manufacturer.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); openLookupForm('manufacturer', manufacturer); }}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleLookupDelete('manufacturer', manufacturer.id); }}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Motherboard Chipsets Section */}
        <div className="card">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('motherboard_chipsets')}
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Motherboard Chipsets</h3>
            {expandedSections.motherboard_chipsets ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
          
          {expandedSections.motherboard_chipsets && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Manage motherboard chipsets (Intel 440BX, AMD 760, etc.)</span>
                  <div className="text-xs text-gray-500 mt-1">
                    {data.lookup.chipsets?.length || 0} chipset{(data.lookup.chipsets?.length || 0) !== 1 ? 's' : ''}
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openLookupForm('chipset');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                >
                  Add Chipset
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Chipset Name
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {data.lookup.chipsets?.map(chipset => (
                      <tr key={chipset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {chipset.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); openLookupForm('chipset', chipset); }}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleLookupDelete('chipset', chipset.id); }}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Motherboards Section */}
        <div className="card">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('motherboard_individual')}
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Motherboards</h3>
            {expandedSections.motherboard_individual ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
          
          {expandedSections.motherboard_individual && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {data.main?.length || 0} Motherboard{(data.main?.length !== 1 ? 's' : '')} configured
                  </p>
                </div>
                <button 
                  onClick={() => {
                    if (!data.lookup?.manufacturers?.length || !data.lookup?.chipsets?.length) {
                      alert('Please create at least one motherboard manufacturer and chipset before adding motherboards.');
                      return;
                    }
                    setShowForm(true);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                  disabled={!data.lookup?.manufacturers?.length || !data.lookup?.chipsets?.length}
                >
                  Add Motherboard
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Manufacturer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Model</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Chipset</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Serial</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notes</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {data.main?.map((motherboard) => {
                      const manufacturer = data.lookup.manufacturers?.find(m => m.id === motherboard.manufacturer_id);
                      const chipset = data.lookup.chipsets?.find(c => c.id === motherboard.chipset_id);
                      
                      return (
                        <tr key={motherboard.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {manufacturer?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {motherboard.model}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {chipset?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {motherboard.serial || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {motherboard.notes || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => {
                                setEditingItem(motherboard);
                                setShowForm(true);
                              }}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(motherboard.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>


      </div>
    );
  };

  const renderRAMSection = () => {
    return (
      <div className="space-y-4">
        {/* RAM Types Section - Simplified */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">RAM Types</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage RAM types (EDO, SD, DDR, DDR2 400Mhz etc.)
              </p>
              <div className="text-xs text-gray-500 mt-1">
                {data.main?.length || 0} type{(data.main?.length !== 1 ? 's' : '')} configured
              </div>
            </div>
            <button 
              onClick={() => setShowForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
            >
              Add RAM Type
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type Name</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.main?.map((ram) => (
                  <tr key={ram.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {ram.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditingItem(ram);
                          setShowForm(true);
                        }}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ram.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderDiskSection = () => {
    if (!data.lookup) return null;
    
    return (
      <div className="space-y-4">
        {/* Disks Section */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Disks</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {data.main?.length || 0} disk{(data.main?.length !== 1 ? 's' : '')} configured
              </p>
            </div>
            <button 
              onClick={() => setShowForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
            >
              Add New Disk
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.main?.map((disk) => (
                  <tr key={disk.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {disk.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditingItem(disk);
                          setShowForm(true);
                        }}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(disk.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderOSSection = () => {
    if (!data.lookup) return null;
    
    return (
      <div className="space-y-4">
        {/* OS Section */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Operating Systems</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {data.main?.length || 0} OS{(data.main?.length !== 1 ? 'es' : '')} configured
              </p>
            </div>
            <button 
              onClick={() => setShowForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
            >
              Add New OS
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.main?.map((os) => (
                  <tr key={os.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {os.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditingItem(os);
                          setShowForm(true);
                        }}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(os.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'cpu':
        return renderCPUSection();
      case 'gpu':
        return renderGPUSection();
      case 'motherboard':
        return renderMotherboardSection();
      case 'ram':
        return renderRAMSection();
      case 'disk':
        return renderDiskSection();
      case 'os':
        return renderOSSection();
      default:
        return (
          <div className="card">
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {activeTab} management coming soon...
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Components</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your hardware components including CPUs, GPUs, motherboards, RAM, storage, and operating systems
          </p>
        </div>

      </div>
      
      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab !== 'disk' && activeTab !== 'os' && activeTab !== 'ram' && (
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-500 text-white">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {activeTab === 'cpu' ? 'CPU Brands' : activeTab === 'gpu' ? 'GPU Manufacturers' : activeTab === 'motherboard' ? 'Motherboard Manufacturers' : 'Brands'}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeTab === 'motherboard' ? (data.lookup?.manufacturers?.length || 0) : (data.lookup?.brands?.length || 0)}
                </p>
              </div>
            </div>
          </div>
        )}
        {activeTab !== 'disk' && activeTab !== 'os' && activeTab !== 'ram' && (
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-500 text-white">
                <Settings className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {activeTab === 'cpu' ? 'CPU Families' : activeTab === 'gpu' ? 'GPU Models' : activeTab === 'motherboard' ? 'Motherboard Chipsets' : 'Models'}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeTab === 'cpu' ? (data.lookup?.families?.length || 0) : activeTab === 'gpu' ? (data.lookup?.models?.length || 0) : activeTab === 'motherboard' ? (data.lookup?.chipsets?.length || 0) : 0}
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500 text-white">
              {activeTab === 'cpu' ? <Cpu className="w-6 h-6" /> : 
               activeTab === 'gpu' ? <Monitor className="w-6 h-6" /> : 
               activeTab === 'motherboard' ? <Settings className="w-6 h-6" /> : 
               activeTab === 'ram' ? <Database className="w-6 h-6" /> : 
               activeTab === 'disk' ? <HardDrive className="w-6 h-6" /> : 
               <Monitor className="w-6 h-6" />}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {activeTab === 'cpu' ? 'CPUs' : activeTab === 'gpu' ? 'GPUs' : activeTab === 'motherboard' ? 'Motherboards' : activeTab === 'ram' ? 'RAM Types' : activeTab === 'disk' ? 'Disks' : activeTab === 'os' ? 'Operating Systems' : 'Features'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.main?.length || 0}
              </p>
            </div>
          </div>
        </div>
        

        

        

        

      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm flex items-center
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {renderContent()}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <HardwareForm
          type={activeTab}
          item={editingItem}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingItem(null);
            fetchData();
          }}
          lookupData={data.lookup}
        />
      )}

      {/* Lookup Form Modal */}
      {showLookupForm && (
        <LookupForm
          type={lookupFormType}
          item={editingLookupItem}
          activeTab={activeTab}
          lookupData={data.lookup}
          onClose={() => {
            setShowLookupForm(false);
            setLookupFormType(null);
            setEditingLookupItem(null);
          }}
          onSave={() => {
            setShowLookupForm(false);
            setLookupFormType(null);
            setEditingLookupItem(null);
            fetchData();
          }}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        cancelText={confirmModalConfig.cancelText}
        type={confirmModalConfig.type}
      />
    </div>
  );
};

// Lookup Form Component for brands, families, manufacturers, etc.
const LookupForm = ({ type, item, onClose, onSave, activeTab, lookupData }) => {
  const [formData, setFormData] = useState({});
  const { apiKey } = useAuth();

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({});
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const headers = { 'X-API-Key': apiKey };
      
      // Determine the correct API endpoint based on active tab and type
      let endpoint;
      if (type === 'brand' && activeTab === 'cpu') {
        endpoint = `http://localhost:12345/api/cpu/brand/`;
      } else if (type === 'brand' && activeTab === 'gpu') {
        endpoint = `http://localhost:12345/api/gpu/brand/`;
      } else if (type === 'family') {
        endpoint = `http://localhost:12345/api/cpu/family/`;
      } else if (type === 'manufacturer' && activeTab === 'gpu') {
        endpoint = `http://localhost:12345/api/gpu/manufacturer/`;
      } else if (type === 'manufacturer' && activeTab === 'motherboard') {
        endpoint = `http://localhost:12345/api/motherboard/manufacturer/`;
      } else if (type === 'model') {
        endpoint = `http://localhost:12345/api/gpu/model/`;
      } else if (type === 'vram_type') {
        endpoint = `http://localhost:12345/api/gpu/vram_type/`;
      } else if (type === 'chipset') {
        endpoint = `http://localhost:12345/api/motherboard/chipset/`;
      } else if (type === 'ram_type') {
        endpoint = `http://localhost:12345/api/ram/type/`;

      } else if (type === 'disk_type') {
        endpoint = `http://localhost:12345/api/disk/type/`;
      } else if (type === 'disk_brand') {
        endpoint = `http://localhost:12345/api/disk/brand/`;
      } else if (type === 'disk_interface') {
        endpoint = `http://localhost:12345/api/disk/interface/`;
      } else {
        // Fallback for any unmatched combinations
        endpoint = `http://localhost:12345/api/${activeTab}/${type}/`;
      }
      
      // Debug logging
      console.log('LookupForm Debug:', { type, activeTab, endpoint, formData });
      
      if (!endpoint) {
        console.error('No endpoint determined for:', { type, activeTab });
        if (window.showToast) {
          window.showToast(`Error: Could not determine API endpoint for ${type} in ${activeTab} tab`, 'error');
        }
        return;
      }
      
      const itemType = getTypeLabel();
      
      if (item) {
        await axios.put(`${endpoint}${item.id}`, formData, { headers });
        // Show success toast
        if (window.showToast) {
          window.showToast(`${itemType} updated successfully`, 'success');
        }
      } else {
        await axios.post(endpoint, formData, { headers });
        // Show success toast
        if (window.showToast) {
          window.showToast(`${itemType} created successfully`, 'success');
        }
      }
      onSave();
    } catch (error) {
      console.error('Error saving lookup item:', error);
      // Show user-friendly error message
      if (error.response?.data?.detail) {
        if (window.showToast) {
          window.showToast(`Error: ${error.response.data.detail}`, 'error');
        }
      } else {
        if (window.showToast) {
          window.showToast('An error occurred while saving. Please try again.', 'error');
        }
      }
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'brand': return 'Brand';
      case 'family': return 'Family';
      case 'manufacturer': return 'Manufacturer';
      case 'model': return 'Model';
      case 'vram_type': return 'VRAM Type';
      case 'chipset': return 'Chipset';
      case 'ram_type': return 'RAM Type';

      case 'disk_type': return 'Disk Type';
      case 'disk_brand': return 'Disk Brand';
      case 'disk_interface': return 'Disk Interface';
      default: return 'Item';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {item ? 'Edit' : 'Add New'} {getTypeLabel()}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Name Field - Only show for non-family and non-model types */}
          {type !== 'family' && type !== 'model' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder={`Enter ${getTypeLabel().toLowerCase()} name`}
                required
              />
            </div>
          )}
          
          {/* CPU Family Form - Brand First, Then Name */}
          {type === 'family' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brand
                </label>
                <select
                  value={formData.cpu_brand_id || ''}
                  onChange={(e) => setFormData({ ...formData, cpu_brand_id: parseInt(e.target.value) })}
                  className="input-field"
                  required
                >
                  <option value="">Select CPU Brand</option>
                  {lookupData?.brands?.map(brand => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Pentium, Athlon, Core i7"
                  required
                />
              </div>
            </>
          )}

          {/* GPU Model Form - Brand First, Then Name */}
          {type === 'model' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brand
                </label>
                <select
                  value={formData.gpu_brand_id || ''}
                  onChange={(e) => setFormData({ ...formData, gpu_brand_id: parseInt(e.target.value) })}
                  className="input-field"
                  required
                >
                  <option value="">Select GPU Brand</option>
                  {lookupData?.brands?.map(brand => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g., TNT2 M64, GTX 1080, RX 580"
                  required
                />
              </div>
            </>
          )}
          
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
              {item ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Hardware Form Component (simplified for now)
const HardwareForm = ({ type, item, onClose, onSave, lookupData }) => {
  const [formData, setFormData] = useState({});
  const { apiKey } = useAuth();

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({});
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form submission - type:', type, 'formData:', formData);
    
    // Validate required fields based on type
    if (type === 'cpu') {
      if (!formData.model || !formData.speed || !formData.core_count || !formData.cpu_brand_id || !formData.cpu_family_id) {
        if (window.showToast) {
          window.showToast('Please fill in all required fields for CPU.', 'warning');
        }
        return;
      }
    } else if (type === 'gpu') {
      if (!formData.gpu_manufacturer_id || !formData.vram_size || !formData.gpu_brand_id || !formData.gpu_model_id || !formData.gpu_vram_type_id) {
        if (window.showToast) {
          window.showToast('Please fill in all required fields for GPU: Manufacturer, VRAM Size, Brand, Model, VRAM Type', 'warning');
        }
        return;
      }
    } else if (type === 'motherboard') {
      if (!formData.model || !formData.manufacturer_id || !formData.chipset_id) {
        if (window.showToast) {
          window.showToast('Please fill in all required fields for Motherboard: Model, Manufacturer, Chipset', 'warning');
        }
        return;
      }
    } else if (type === 'ram') {
      if (!formData.name) {
        if (window.showToast) {
          window.showToast('Please fill in the RAM type name.', 'warning');
        }
        return;
      }
    } else if (type === 'disk') {
      if (!formData.name) {
        if (window.showToast) {
          window.showToast('Please fill in the disk name.', 'warning');
        }
        return;
      }
    } else if (type === 'os') {
      if (!formData.name) {
        if (window.showToast) {
          window.showToast('Please fill in the OS name.', 'warning');
        }
        return;
      }
    }
    
    try {
      const headers = { 'X-API-Key': apiKey };
      // Determine the correct endpoint for each type
      let endpoint;
      if (type === 'ram') {
        endpoint = 'http://192.168.1.24:12345/api/ram/';
      } else if (type === 'disk') {
        endpoint = 'http://192.168.1.24:12345/api/disk/';
      } else if (type === 'os') {
        endpoint = 'http://192.168.1.24:12345/api/oses/';
      } else if (type === 'cpu') {
        endpoint = 'http://192.168.1.24:12345/api/cpu/';
      } else if (type === 'gpu') {
        endpoint = 'http://192.168.1.24:12345/api/gpu/';
      } else if (type === 'motherboard') {
        endpoint = 'http://192.168.1.24:12345/api/motherboard/';
      } else {
        endpoint = `http://192.168.1.24:12345/api/${type}`;
      }
      

      
      console.log('About to submit:', { endpoint, formData, isUpdate: !!item });
      
      const itemType = type === 'cpu' ? 'CPU' : 
                      type === 'gpu' ? 'GPU' : 
                      type === 'motherboard' ? 'Motherboard' : 
                      type === 'ram' ? 'RAM Type' : 
                      type === 'disk' ? 'Disk' : 
                      type === 'os' ? 'OS' : 
                      type.charAt(0).toUpperCase() + type.slice(1);
      
      if (item) {
        // Ensure id is included in the request body for updates
        const updateData = { ...formData, id: item.id };
        console.log('Update data being sent:', updateData);
        await axios.put(`${endpoint}${item.id}`, updateData, { headers });
        
        // Show success toast
        if (window.showToast) {
          window.showToast(`${itemType} updated successfully`, 'success');
        }
      } else {
        await axios.post(endpoint, formData, { headers });
        
        // Show success toast
        if (window.showToast) {
          window.showToast(`${itemType} created successfully`, 'success');
        }
      }
      onSave();
    } catch (error) {
      console.error('Error saving item:', error);
      // Show user-friendly error message
      if (error.response?.data?.detail) {
        if (window.showToast) {
          window.showToast(`Error: ${error.response.data.detail}`, 'error');
        }
      } else {
        if (window.showToast) {
          window.showToast('An error occurred while saving. Please try again.', 'error');
        }
      }
    }
  };

  const renderCPUForm = () => {
    return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Brand
        </label>
        <select
          value={formData.cpu_brand_id || ''}
          onChange={(e) => setFormData({ 
            ...formData, 
            cpu_brand_id: parseInt(e.target.value),
            cpu_family_id: '' // Reset family when brand changes
          })}
          className="input-field"
          required
        >
          <option value="">Select Brand</option>
          {lookupData?.brands?.map(brand => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Family
        </label>
        <select
          value={formData.cpu_family_id || ''}
          onChange={(e) => setFormData({ ...formData, cpu_family_id: parseInt(e.target.value) })}
          className="input-field"
          required
          disabled={!formData.cpu_brand_id}
        >
          <option value="">Select Family</option>
          {lookupData?.families
            ?.filter(family => !formData.cpu_brand_id || family.cpu_brand_id === formData.cpu_brand_id)
            ?.map(family => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
        </select>
        {!formData.cpu_brand_id && (
          <p className="text-xs text-gray-500 mt-1">Please select a brand first</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Model
        </label>
        <input
          type="text"
          value={formData.model || ''}
          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          className="input-field"
          placeholder="e.g., 200MMX, 450Mhz"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Speed
        </label>
        <input
          type="text"
          value={formData.speed || ''}
          onChange={(e) => setFormData({ ...formData, speed: e.target.value })}
          className="input-field"
          placeholder="e.g., 450Mhz"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Core Count
        </label>
        <input
          type="number"
          value={formData.core_count || ''}
          onChange={(e) => setFormData({ ...formData, core_count: parseInt(e.target.value) })}
          className="input-field"
          placeholder="1"
          min="1"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Serial
        </label>
        <input
          type="text"
          value={formData.serial || ''}
          onChange={(e) => setFormData({ ...formData, serial: e.target.value })}
          className="input-field"
          placeholder="e.g., CPU123456"
        />
      </div>
    </div>
  );
  };

    const renderGPUForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Manufacturer
        </label>
        <select
          value={formData.gpu_manufacturer_id || ''}
          onChange={(e) => setFormData({ ...formData, gpu_manufacturer_id: parseInt(e.target.value) || null })}
          className="input-field"
          required
        >
          <option value="">Select Manufacturer</option>
          {lookupData?.manufacturers?.map(manufacturer => (
            <option key={manufacturer.id} value={manufacturer.id}>
              {manufacturer.name}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Brand
        </label>
        <select
          value={formData.gpu_brand_id || ''}
          onChange={(e) => setFormData({ 
            ...formData, 
            gpu_brand_id: parseInt(e.target.value),
            gpu_model_id: '' // Reset model when brand changes
          })}
          className="input-field"
          required
        >
          <option value="">Select Brand</option>
          {lookupData?.brands?.map(brand => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Model
        </label>
        <select
          value={formData.gpu_model_id || ''}
          onChange={(e) => setFormData({ ...formData, gpu_model_id: parseInt(e.target.value) })}
          className="input-field"
          required
          disabled={!formData.gpu_brand_id}
        >
          <option value="">Select Model</option>
          {lookupData?.models
            ?.filter(model => !formData.gpu_brand_id || model.gpu_brand_id === formData.gpu_brand_id)
            ?.map(model => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
        </select>
        {!formData.gpu_brand_id && (
          <p className="text-xs text-gray-500 mt-1">Please select a brand first</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          VRAM Type
        </label>
        <select
          value={formData.gpu_vram_type_id || ''}
          onChange={(e) => setFormData({ ...formData, gpu_vram_type_id: parseInt(e.target.value) })}
          className="input-field"
          required
        >
          <option value="">Select VRAM Type</option>
          {lookupData?.vramTypes?.map(vramType => (
            <option key={vramType.id} value={vramType.id}>
              {vramType.name}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          VRAM Size
        </label>
        <input
          type="text"
          value={formData.vram_size || ''}
          onChange={(e) => setFormData({ ...formData, vram_size: e.target.value })}
          className="input-field"
          placeholder="e.g., 32MB, 8GB"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Serial
        </label>
        <input
          type="text"
          value={formData.serial || ''}
          onChange={(e) => setFormData({ ...formData, serial: e.target.value })}
          className="input-field"
          placeholder="e.g., GPU123456"
        />
      </div>
    </div>
  );

  const renderMotherboardForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Manufacturer
        </label>
        <select
          value={formData.manufacturer_id || ''}
          onChange={(e) => setFormData({ ...formData, manufacturer_id: parseInt(e.target.value) })}
          className="input-field"
          required
        >
          <option value="">Select Manufacturer</option>
          {lookupData?.manufacturers?.map(manufacturer => (
            <option key={manufacturer.id} value={manufacturer.id}>
              {manufacturer.name}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Model
        </label>
        <input
          type="text"
          value={formData.model || ''}
          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          className="input-field"
          placeholder="e.g., P5A-B"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Chipset
        </label>
        <select
          value={formData.chipset_id || ''}
          onChange={(e) => setFormData({ ...formData, chipset_id: parseInt(e.target.value) })}
          className="input-field"
          required
        >
          <option value="">Select Chipset</option>
          {lookupData?.chipsets?.map(chipset => (
            <option key={chipset.id} value={chipset.id}>
              {chipset.name}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Serial
        </label>
        <input
          type="text"
          value={formData.serial || ''}
          onChange={(e) => setFormData({ ...formData, serial: e.target.value })}
          className="input-field"
          placeholder="e.g., MB123456"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="input-field"
          placeholder="Optional notes about the motherboard"
          rows="3"
        />
      </div>
    </div>
  );

  const renderRAMForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          RAM Type Name
        </label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input-field"
          placeholder="e.g., DDR, DDR2 400, EDO"
          required
        />
      </div>
    </div>
  );

  const renderDiskForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Name
        </label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input-field"
          placeholder="e.g., Samsung 970 EVO Plus 1TB"
          required
        />
      </div>
    </div>
  );

  const renderOSForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Name
        </label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input-field"
          placeholder="e.g., Windows 10 Pro, Ubuntu 22.04 LTS"
          required
        />
      </div>
    </div>
  );

  const renderFormContent = () => {
    switch (type) {
      case 'cpu':
        return renderCPUForm();
      case 'gpu':
        return renderGPUForm();
      case 'motherboard':
        return renderMotherboardForm();
      case 'ram':
        return renderRAMForm();
      case 'disk':
        return renderDiskForm();
      case 'os':
        return renderOSForm();
      default:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              required
            />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {item ? 'Edit' : 'Add New'} {type === 'cpu' ? 'CPU' : type === 'gpu' ? 'GPU' : type === 'ram' ? 'RAM Type' : type === 'os' ? 'OS' : type.charAt(0).toUpperCase() + type.slice(1)}
        </h2>
        
        <form onSubmit={(e) => {
          console.log('Form submitted!');
          handleSubmit(e);
        }} className="space-y-4">
          {renderFormContent()}
          
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
              {item ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Hardware;
