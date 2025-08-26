import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Cpu, 
  Monitor, 
  Settings, 
  Database,
  HardDrive,
  Plus,
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

  const tabs = [
    { id: 'cpu', name: 'CPUs', icon: Cpu },
    { id: 'gpu', name: 'GPUs', icon: Monitor },
    { id: 'motherboard', name: 'Motherboards', icon: Settings },
    { id: 'ram', name: 'RAM', icon: Database },
    { id: 'disk', name: 'Disks', icon: HardDrive },
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

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const headers = { 'X-API-Key': apiKey };
        await axios.delete(`/api/${activeTab}/${id}`, { headers });
        fetchData();
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const handleLookupDelete = async (type, id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const headers = { 'X-API-Key': apiKey };
        await axios.delete(`/api/${activeTab}/${type}/${id}`, { headers });
        fetchData();
      } catch (error) {
        console.error('Error deleting lookup item:', error);
      }
    }
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
                <span className="text-sm text-gray-600 dark:text-gray-400">Manage CPU brands (AMD, Intel, etc.)</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openLookupForm('brand');
                  }}
                  className="btn-primary text-sm px-3 py-1"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Brand
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {data.lookup.brands?.map(brand => (
                  <div key={brand.id} className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-white">{brand.name}</span>
                      <div className="flex space-x-2">
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
                    </div>
                  </div>
                ))}
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
                <span className="text-sm text-gray-600 dark:text-gray-400">Manage CPU families (K6, Core i7, etc.)</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openLookupForm('family');
                  }}
                  className="btn-primary text-sm px-3 py-1"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Family
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {data.lookup.families?.map(family => (
                  <div key={family.id} className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-white">{family.name}</span>
                      <div className="flex space-x-2">
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Individual CPUs Section */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Individual CPUs</h3>
            <button 
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add CPU
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Speed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cores</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Family</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.main?.map((cpu) => {
                  const brand = data.lookup.brands?.find(b => b.id === cpu.cpu_brand_id);
                  const family = data.lookup.families?.find(f => f.id === cpu.cpu_family_id);
                  
                  return (
                    <tr key={cpu.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
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
                        {brand?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {family?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setEditingItem(cpu)}
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
                  className="btn-primary text-sm px-3 py-1"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Manufacturer
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {data.lookup.manufacturers?.map(manufacturer => (
                  <div key={manufacturer.id} className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-white">{manufacturer.name}</span>
                      <div className="flex space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openLookupForm('manufacturer', manufacturer);
                          }}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLookupDelete('manufacturer', manufacturer.id);
                          }}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
                  className="btn-primary text-sm px-3 py-1"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Brand
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {data.lookup.brands?.map(brand => (
                  <div key={brand.id} className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-white">{brand.name}</span>
                      <div className="flex space-x-2">
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
                    </div>
                  </div>
                ))}
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
                  className="btn-primary text-sm px-3 py-1"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Model
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {data.lookup.models?.map(model => (
                  <div key={model.id} className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-white">{model.name}</span>
                      <div className="flex space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openLookupForm('model', model);
                          }}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLookupDelete('model', model.id);
                          }}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Individual GPUs Section */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Individual GPUs</h3>
            <button 
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add GPU
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">VRAM Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Manufacturer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">VRAM Type</th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {gpu.vram_size}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {manufacturer?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {brand?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {model?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {vramType?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setEditingItem(gpu)}
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hardware Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your hardware components with proper hierarchical structure
          </p>
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
    </div>
  );
};

// Lookup Form Component for brands, families, manufacturers, etc.
const LookupForm = ({ type, item, onClose, onSave }) => {
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
      if (type === 'brand') {
        endpoint = `/api/cpu/brand/`;
      } else if (type === 'family') {
        endpoint = `/api/cpu/family/`;
      } else if (type === 'manufacturer') {
        endpoint = `/api/gpu/manufacturer/`;
      } else if (type === 'model') {
        endpoint = `/api/gpu/model/`;
      } else if (type === 'vram_type') {
        endpoint = `/api/gpu/vram_type/`;
      }
      
      if (item) {
        await axios.put(`${endpoint}${item.id}`, formData, { headers });
      } else {
        await axios.post(endpoint, formData, { headers });
      }
      onSave();
    } catch (error) {
      console.error('Error saving lookup item:', error);
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'brand': return 'Brand';
      case 'family': return 'Family';
      case 'manufacturer': return 'Manufacturer';
      case 'model': return 'Model';
      case 'vram_type': return 'VRAM Type';
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
    try {
      const headers = { 'X-API-Key': apiKey };
      if (item) {
        await axios.put(`/api/${type}/${item.id}`, formData, { headers });
      } else {
        await axios.post(`/api/${type}/`, formData, { headers });
      }
      onSave();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const renderCPUForm = () => (
    <div className="space-y-4">
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
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Brand
        </label>
        <select
          value={formData.cpu_brand_id || ''}
          onChange={(e) => setFormData({ ...formData, cpu_brand_id: parseInt(e.target.value) })}
          className="input-field"
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
        >
          <option value="">Select Family</option>
          {lookupData?.families?.map(family => (
            <option key={family.id} value={family.id}>
              {family.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderGPUForm = () => (
    <div className="space-y-4">
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
          Manufacturer
        </label>
        <select
          value={formData.gpu_manufacturer_id || ''}
          onChange={(e) => setFormData({ ...formData, gpu_manufacturer_id: parseInt(e.target.value) })}
          className="input-field"
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
          onChange={(e) => setFormData({ ...formData, gpu_brand_id: parseInt(e.target.value) })}
          className="input-field"
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
        >
          <option value="">Select Model</option>
          {lookupData?.models?.map(model => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          VRAM Type
        </label>
        <select
          value={formData.gpu_vram_type_id || ''}
          onChange={(e) => setFormData({ ...formData, gpu_vram_type_id: parseInt(e.target.value) })}
          className="input-field"
        >
          <option value="">Select VRAM Type</option>
          {lookupData?.vramTypes?.map(vramType => (
            <option key={vramType.id} value={vramType.id}>
              {vramType.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderFormContent = () => {
    switch (type) {
      case 'cpu':
        return renderCPUForm();
      case 'gpu':
        return renderGPUForm();
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
          {item ? 'Edit' : 'Add New'} {type.charAt(0).toUpperCase() + type.slice(1)}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
