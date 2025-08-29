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
          
        case 'ram':
          [mainData, lookupData] = await Promise.all([
            axios.get('http://localhost:12345/api/ram/module/', { headers }),
            Promise.all([
              axios.get('http://localhost:12345/api/ram/type/', { headers }),
              axios.get('http://localhost:12345/api/ram/brand/', { headers })
            ])
          ]);
          lookupData = {
            ram_types: lookupData[0].data,
            ram_brands: lookupData[1].data
          };
          break;
          
        case 'disk':
          [mainData, lookupData] = await Promise.all([
            axios.get('/api/disk/', { headers }),
            Promise.all([
              axios.get('/api/disk/type/', { headers }),
              axios.get('/api/disk/brand/', { headers }),
              axios.get('/api/disk/interface/', { headers })
            ])
          ]);
          lookupData = {
            disk_types: lookupData[0].data,
            disk_brands: lookupData[1].data,
            disk_interfaces: lookupData[2].data
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
      setExpandedSections(prev => ({
        ...prev,
        ram_types: false,        // Collapsed
        ram_brands: false        // Collapsed
      }));
    } else if (activeTab === 'disk') {
      setExpandedSections(prev => ({
        ...prev,
        disk_types: true,
        disk_brands: true,
        disk_interfaces: true
      }));
    }
  }, [activeTab]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const headers = { 'X-API-Key': apiKey };
        await axios.delete(`http://localhost:12345/api/${activeTab}/${id}`, { headers });
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
        } else if (type === 'ram_brand') {
          endpoint = `http://localhost:12345/api/ram/brand/${id}`;
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
                  alert('Please create at least one CPU brand and family before adding CPUs.');
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Model</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Manufacturer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Chipset</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Serial</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {data.main?.map((motherboard) => {
                      const manufacturer = data.lookup.manufacturers?.find(m => m.id === motherboard.manufacturer_id);
                      const chipset = data.lookup.chipsets?.find(c => c.id === motherboard.chipset_id);
                      
                      return (
                        <tr key={motherboard.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {motherboard.model}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {manufacturer?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {chipset?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {motherboard.serial || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => setEditingItem(motherboard)}
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
    if (!data.lookup) return null;
    
    return (
      <div className="space-y-4">
        {/* RAM Types Section */}
        <div className="card">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('ram_types')}
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">RAM Types</h3>
            {expandedSections.ram_types ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
          
          {expandedSections.ram_types && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Manage RAM types (DDR, DDR2, DDR3, DDR4, DDR5, etc.)</span>
                  <div className="text-xs text-gray-500 mt-1">
                    {data.lookup.ram_types?.length || 0} RAM type{(data.lookup.ram_types?.length || 0) !== 1 ? 's' : ''}
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openLookupForm('ram_type');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                >
                  Add RAM Type
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Type Name
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {data.lookup.ram_types?.map(ramType => (
                      <tr key={ramType.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {ramType.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openLookupForm('ram_type', ramType);
                              }}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLookupDelete('ram_type', ramType.id);
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

        {/* RAM Brands Section */}
        <div className="card">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('ram_brands')}
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">RAM Brands</h3>
            {expandedSections.ram_brands ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
          
          {expandedSections.ram_brands && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Manage RAM brands (Corsair, G.Skill, Kingston, etc.)</span>
                  <div className="text-xs text-gray-500 mt-1">
                    {data.lookup.ram_brands?.length || 0} brand{(data.lookup.ram_brands?.length || 0) !== 1 ? 's' : ''}
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openLookupForm('ram_brand');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                >
                  Add RAM Brand
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
                    {data.lookup.ram_brands?.map(brand => (
                      <tr key={brand.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {brand.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openLookupForm('ram_brand', brand);
                              }}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLookupDelete('ram_brand', brand.id);
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

        {/* RAM Modules Section */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">RAM Modules</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {data.main?.length || 0} RAM module{(data.main?.length !== 1 ? 's' : '')} configured
              </p>
            </div>
            <button 
              onClick={() => {
                if (!data.lookup?.ram_types?.length || !data.lookup?.ram_brands?.length) {
                  alert('Please create at least one RAM type and brand before adding RAM modules.');
                  return;
                }
                setShowForm(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!data.lookup?.ram_types?.length || !data.lookup?.ram_brands?.length}
            >
              Add New RAM
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Speed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Serial</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.main?.map((ram) => {
                  const brand = data.lookup.ram_brands?.find(b => b.id === ram.ram_brand_id);
                  const ramType = data.lookup.ram_types?.find(t => t.id === ram.ram_type_id);
                  
                  return (
                    <tr key={ram.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {brand?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {ramType?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {ram.speed ? `${ram.speed} MHz` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {ram.size ? `${ram.size} MB` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {ram.serial || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setEditingItem(ram)}
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
                  );
                })}
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
        {/* Disk Types Section */}
        <div className="card">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('disk_types')}
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Disk Types</h3>
            {expandedSections.disk_types ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
          
          {expandedSections.disk_types && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Manage disk types (HDD, SSD, NVMe, etc.)</span>
                  <div className="text-xs text-gray-500 mt-1">
                    {data.lookup.disk_types?.length || 0} disk type{(data.lookup.disk_types?.length || 0) !== 1 ? 's' : ''}
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openLookupForm('disk_type');
                  }}
                  className="btn-primary text-sm px-3 py-1"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Disk Type
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {data.lookup.disk_types?.map(diskType => (
                  <div key={diskType.id} className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-white">{diskType.name}</span>
                      <div className="flex space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openLookupForm('disk_type', diskType);
                          }}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLookupDelete('disk_type', diskType.id);
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

        {/* Disk Brands Section */}
        <div className="card">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('disk_brands')}
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Disk Brands</h3>
            {expandedSections.disk_brands ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
          
          {expandedSections.disk_brands && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Manage disk brands (Samsung, Western Digital, Seagate, etc.)</span>
                  <div className="text-xs text-gray-500 mt-1">
                    {data.lookup.disk_brands?.length || 0} brand{(data.lookup.disk_brands?.length || 0) !== 1 ? 's' : ''}
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openLookupForm('disk_brand');
                  }}
                  className="btn-primary text-sm px-3 py-1"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Disk Brand
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {data.lookup.disk_brands?.map(brand => (
                  <div key={brand.id} className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-white">{brand.name}</span>
                      <div className="flex space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openLookupForm('disk_brand', brand);
                          }}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLookupDelete('disk_brand', brand.id);
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

        {/* Disk Interfaces Section */}
        <div className="card">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('disk_interfaces')}
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Disk Interfaces</h3>
            {expandedSections.disk_interfaces ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
          
          {expandedSections.disk_interfaces && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Manage disk interfaces (SATA, PCIe, USB, etc.)</span>
                  <div className="text-xs text-gray-500 mt-1">
                    {data.lookup.disk_interfaces?.length || 0} interface{(data.lookup.disk_interfaces?.length || 0) !== 1 ? 's' : ''}
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openLookupForm('disk_interface');
                  }}
                  className="btn-primary text-sm px-3 py-1"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Disk Interface
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {data.lookup.disk_interfaces?.map(diskInterface => (
                  <div key={diskInterface.id} className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-white">{diskInterface.name}</span>
                      <div className="flex space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openLookupForm('disk_interface', diskInterface);
                          }}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLookupDelete('disk_interface', diskInterface.id);
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

        {/* Individual Disks Section */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Individual Disks</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {data.main?.length || 0} disk{(data.main?.length || 0) !== 1 ? 's' : ''} configured
              </p>
            </div>
            <button 
              onClick={() => {
                if (!data.lookup?.disk_types?.length || !data.lookup?.disk_brands?.length || !data.lookup?.disk_interfaces?.length) {
                  alert('Please create at least one disk type, brand, and interface before adding disks.');
                  return;
                }
                setShowForm(true);
              }}
              className="btn-primary"
              disabled={!data.lookup?.disk_types?.length || !data.lookup?.disk_brands?.length || !data.lookup?.disk_interfaces?.length}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Disk
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Interface</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Speed</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.main?.map((disk) => {
                  const brand = data.lookup.disk_brands?.find(b => b.id === disk.disk_brand_id);
                  const diskType = data.lookup.disk_types?.find(t => t.id === disk.disk_type_id);
                  const diskInterface = data.lookup.disk_interfaces?.find(i => i.id === disk.disk_interface_id);
                  
                  return (
                    <tr key={disk.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {disk.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {brand?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {diskType?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {diskInterface?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {disk.capacity ? `${disk.capacity} GB` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {disk.speed ? `${disk.speed} MB/s` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setEditingItem(disk)}
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
      case 'motherboard':
        return renderMotherboardSection();
      case 'ram':
        return renderRAMSection();
      case 'disk':
        return renderDiskSection();
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
            Please add your hardware using the menus below. Later you can select these hardware in the Build section to build your benchmark PC.
          </p>
        </div>

      </div>
      
      {/* Hardware Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-blue-600 dark:text-blue-400 font-medium">
            {activeTab === 'cpu' ? 'CPU Brands' : activeTab === 'gpu' ? 'GPU Brands' : activeTab === 'motherboard' ? 'MB Manufacturers' : activeTab === 'ram' ? 'RAM Brands' : activeTab === 'disk' ? 'Disk Brands' : 'Brands'}
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {activeTab === 'motherboard' ? (data.lookup?.manufacturers?.length || 0) : activeTab === 'ram' ? (data.lookup?.ram_brands?.length || 0) : activeTab === 'disk' ? (data.lookup?.disk_brands?.length || 0) : (data.lookup?.brands?.length || 0)}
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-green-600 dark:text-green-400 font-medium">
            {activeTab === 'cpu' ? 'CPU Families' : activeTab === 'gpu' ? 'GPU Models' : activeTab === 'motherboard' ? 'MB Chipsets' : activeTab === 'ram' ? 'RAM Types' : activeTab === 'disk' ? 'Disk Types' : 'Models'}
          </div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {activeTab === 'cpu' ? (data.lookup?.families?.length || 0) : activeTab === 'gpu' ? (data.lookup?.models?.length || 0) : activeTab === 'motherboard' ? (data.lookup?.chipsets?.length || 0) : activeTab === 'ram' ? (data.lookup?.ram_types?.length || 0) : (data.lookup?.disk_types?.length || 0)}
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="text-yellow-600 dark:text-yellow-400 font-medium">
            {activeTab === 'cpu' ? 'CPUs' : activeTab === 'gpu' ? 'VRAM Types' : activeTab === 'motherboard' ? 'MB Models' : activeTab === 'ram' ? 'RAM Sizes' : activeTab === 'disk' ? 'Disk Interfaces' : 'Features'}
          </div>
          <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
            {activeTab === 'cpu' ? (data.main?.reduce((sum, cpu) => sum + (cpu.core_count || 0), 0) || 0) : activeTab === 'gpu' ? (data.lookup?.vramTypes?.length || 0) : activeTab === 'motherboard' ? (data.main?.length || 0) : activeTab === 'ram' ? (data.main?.reduce((sum, ram) => sum + (ram.size || 0), 0) || 0) : (data.lookup?.disk_interfaces?.length || 0)}
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
      } else if (type === 'ram_brand') {
        endpoint = `http://localhost:12345/api/ram/brand/`;
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
        alert(`Error: Could not determine API endpoint for ${type} in ${activeTab} tab`);
        return;
      }
      
      if (item) {
        await axios.put(`${endpoint}${item.id}`, formData, { headers });
      } else {
        await axios.post(endpoint, formData, { headers });
      }
      onSave();
    } catch (error) {
      console.error('Error saving lookup item:', error);
      // Show user-friendly error message
      if (error.response?.data?.detail) {
        alert(`Error: ${error.response.data.detail}`);
      } else {
        alert('An error occurred while saving. Please try again.');
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
      case 'ram_brand': return 'RAM Brand';
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
    
    // Validate required fields based on type
    if (type === 'cpu') {
      if (!formData.model || !formData.speed || !formData.core_count || !formData.cpu_brand_id || !formData.cpu_family_id) {
        alert('Please fill in all required fields for CPU.');
        return;
      }
    } else if (type === 'gpu') {
      if (!formData.vram_size || !formData.gpu_brand_id || !formData.gpu_model_id || !formData.gpu_vram_type_id) {
        alert('Please fill in all required fields for GPU.');
        return;
      }
    } else if (type === 'motherboard') {
      console.log('Motherboard validation - formData:', formData);
      if (!formData.model || !formData.manufacturer_id || !formData.chipset_id) {
        console.log('Missing fields:', {
          model: formData.model,
          manufacturer_id: formData.manufacturer_id,
          chipset_id: formData.chipset_id
        });
        alert('Please fill in all required fields for Motherboard:\n- Model\n- Manufacturer\n- Chipset');
        return;
      }
    } else if (type === 'ram') {
      if (!formData.name || !formData.ram_brand_id || !formData.ram_type_id || !formData.speed || !formData.size) {
        alert('Please fill in all required fields for RAM.');
        return;
      }
    } else if (type === 'disk') {
      if (!formData.name || !formData.disk_brand_id || !formData.disk_type_id || !formData.disk_interface_id || !formData.capacity || !formData.speed) {
        alert('Please fill in all required fields for Disk.');
        return;
      }
    }
    
    try {
      const headers = { 'X-API-Key': apiKey };
      // Determine the correct endpoint for each type
      let endpoint;
      if (type === 'ram') {
        endpoint = 'http://localhost:12345/api/ram/module/';
      } else {
        endpoint = `http://localhost:12345/api/${type}/`;
      }
      
      console.log(`Submitting ${type} data:`, formData);
      console.log(`API endpoint: ${endpoint}`);
      console.log(`Request headers:`, headers);
      
      if (item) {
        await axios.put(`${endpoint}${item.id}`, formData, { headers });
      } else {
        await axios.post(endpoint, formData, { headers });
      }
      onSave();
    } catch (error) {
      console.error('Error saving item:', error);
      // Show user-friendly error message
      if (error.response?.data?.detail) {
        alert(`Error: ${error.response.data.detail}`);
      } else {
        alert('An error occurred while saving. Please try again.');
      }
    }
  };

  const renderCPUForm = () => (
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
          >
            <option value="">Select Manufacturer (Optional)</option>
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
          Model
        </label>
        <input
          type="text"
          value={formData.model || ''}
          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          className="input-field"
          placeholder="e.g., ASUS P5A-B"
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
          placeholder="e.g., MB123456"
        />
      </div>
    </div>
  );

  const renderRAMForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Brand
        </label>
        <select
          value={formData.ram_brand_id || ''}
          onChange={(e) => setFormData({ ...formData, ram_brand_id: parseInt(e.target.value) })}
          className="input-field"
          required
        >
          <option value="">Select Brand</option>
          {lookupData?.ram_brands?.map(brand => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          RAM Type
        </label>
        <select
          value={formData.ram_type_id || ''}
          onChange={(e) => setFormData({ ...formData, ram_type_id: parseInt(e.target.value) })}
          className="input-field"
          required
        >
          <option value="">Select RAM Type</option>
          {lookupData?.ram_types?.map(ramType => (
            <option key={ramType.id} value={ramType.id}>
              {ramType.name}
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
          placeholder="e.g., Corsair Vengeance LPX 16GB"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Size
        </label>
        <input
          type="number"
          min="1"
          value={formData.size || ''}
          onChange={(e) => setFormData({ ...formData, size: parseInt(e.target.value) })}
          className="input-field"
          placeholder="e.g., 16384"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Speed
        </label>
        <input
          type="number"
          min="1"
          value={formData.speed || ''}
          onChange={(e) => setFormData({ ...formData, speed: parseInt(e.target.value) })}
          className="input-field"
          placeholder="e.g., 3200"
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
          placeholder="e.g., RAM123456"
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
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Brand
        </label>
        <select
          value={formData.disk_brand_id || ''}
          onChange={(e) => setFormData({ ...formData, disk_brand_id: parseInt(e.target.value) })}
          className="input-field"
          required
        >
          <option value="">Select Brand</option>
          {lookupData?.disk_brands?.map(brand => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Disk Type
        </label>
        <select
          value={formData.disk_type_id || ''}
          onChange={(e) => setFormData({ ...formData, disk_type_id: parseInt(e.target.value) })}
          className="input-field"
          required
        >
          <option value="">Select Disk Type</option>
          {lookupData?.disk_types?.map(diskType => (
            <option key={diskType.id} value={diskType.id}>
              {diskType.name}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Interface
        </label>
        <select
          value={formData.disk_interface_id || ''}
          onChange={(e) => setFormData({ ...formData, disk_interface_id: parseInt(e.target.value) })}
          className="input-field"
          required
        >
          <option value="">Select Interface</option>
          {lookupData?.disk_interfaces?.map(diskInterface => (
            <option key={diskInterface.id} value={diskInterface.id}>
              {diskInterface.name}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Capacity (GB)
        </label>
        <input
          type="number"
          min="1"
          value={formData.capacity || ''}
          onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
          className="input-field"
          placeholder="e.g., 1000"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Speed (MB/s)
        </label>
        <input
          type="number"
          min="1"
          value={formData.speed || ''}
          onChange={(e) => setFormData({ ...formData, speed: parseInt(e.target.value) })}
          className="input-field"
          placeholder="e.g., 3500"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Serial Number (Optional)
        </label>
        <input
          type="text"
          value={formData.serial || ''}
          onChange={(e) => setFormData({ ...formData, serial: e.target.value })}
          className="input-field"
          placeholder="e.g., DISK123456"
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
          {item ? 'Edit' : 'Add New'} {type === 'cpu' ? 'CPU' : type === 'gpu' ? 'GPU' : type === 'ram' ? 'RAM' : type.charAt(0).toUpperCase() + type.slice(1)}
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
