import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Package, Recycle, Settings, CheckCircle, X, Save, AlertCircle } from "lucide-react";
import Sidebar from "@/Components/SideBar";
import { Head } from '@inertiajs/react';

export default function WasteConfigManager() {
  const [wasteTypes, setWasteTypes] = useState([]);
  const [dispositions, setDispositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showWasteTypeModal, setShowWasteTypeModal] = useState(false);
  const [showDispositionModal, setShowDispositionModal] = useState(false);
  const [editingWasteType, setEditingWasteType] = useState(null);
  const [editingDisposition, setEditingDisposition] = useState(null);
  
  // Form states - FIXED: Changed Disposition to Dispostion to match table
  const [wasteTypeForm, setWasteTypeForm] = useState({ WasteType: '', Svg: '' });
  const [dispositionForm, setDispositionForm] = useState({ Dispostion: '', Svg: '' });

  // Get CSRF token for Laravel
  const getCSRFToken = () => {
    const token = document.querySelector('meta[name="csrf-token"]');
    return token ? token.getAttribute('content') : '';
  };

  // Fetch data from API
  const fetchWasteTypes = async () => {
    try {
      const response = await fetch('/api/waste-types', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setWasteTypes(data.data);
      } else {
        setError('Failed to fetch waste types');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch waste types');
    }
  };

  const fetchDispositions = async () => {
    try {
      const response = await fetch('/api/dispositions', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setDispositions(data.data);
      } else {
        setError('Failed to fetch dispositions');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch dispositions');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchWasteTypes(), fetchDispositions()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Waste Type handlers
  const handleWasteTypeSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Basic validation
    if (!wasteTypeForm.WasteType.trim() || !wasteTypeForm.Svg.trim()) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      const url = editingWasteType ? `/api/waste-types/${editingWasteType.id}` : '/api/waste-types';
      const method = editingWasteType ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCSRFToken(),
        },
        body: JSON.stringify(wasteTypeForm),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchWasteTypes();
        setShowWasteTypeModal(false);
        setEditingWasteType(null);
        setWasteTypeForm({ WasteType: '', Svg: '' });
        setError(null);
      } else {
        setError(data.message || 'Failed to save waste type');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to save waste type');
    }
  };

  const handleDeleteWasteType = async (id) => {
    if (!window.confirm('Are you sure you want to delete this waste type?')) return;
    
    try {
      const response = await fetch(`/api/waste-types/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCSRFToken(),
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchWasteTypes();
        setError(null);
      } else {
        setError(data.message || 'Failed to delete waste type');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete waste type');
    }
  };

  // Disposition handlers - FIXED: Changed all Disposition references to Dispostion
  const handleDispositionSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Basic validation
    if (!dispositionForm.Dispostion.trim() || !dispositionForm.Svg.trim()) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      const url = editingDisposition ? `/api/dispositions/${editingDisposition.id}` : '/api/dispositions';
      const method = editingDisposition ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCSRFToken(),
        },
        body: JSON.stringify(dispositionForm),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchDispositions();
        setShowDispositionModal(false);
        setEditingDisposition(null);
        setDispositionForm({ Dispostion: '', Svg: '' });
        setError(null);
      } else {
        setError(data.message || 'Failed to save disposition');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to save disposition');
    }
  };

  const handleDeleteDisposition = async (id) => {
    if (!window.confirm('Are you sure you want to delete this disposition?')) return;
    
    try {
      const response = await fetch(`/api/dispositions/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCSRFToken(),
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchDispositions();
        setError(null);
      } else {
        setError(data.message || 'Failed to delete disposition');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete disposition');
    }
  };

  // Modal handlers
  const openWasteTypeModal = (wasteType = null) => {
    if (wasteType) {
      setEditingWasteType(wasteType);
      setWasteTypeForm({ WasteType: wasteType.WasteType, Svg: wasteType.Svg });
    } else {
      setEditingWasteType(null);
      setWasteTypeForm({ WasteType: '', Svg: '' });
    }
    setError(null);
    setShowWasteTypeModal(true);
  };

  const openDispositionModal = (disposition = null) => {
    if (disposition) {
      setEditingDisposition(disposition);
      // FIXED: Changed to Dispostion to match table column name
      setDispositionForm({ Dispostion: disposition.Dispostion, Svg: disposition.Svg });
    } else {
      setEditingDisposition(null);
      setDispositionForm({ Dispostion: '', Svg: '' });
    }
    setError(null);
    setShowDispositionModal(true);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Head title="Configuration Manager" />
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Head title="Configuration Manager" />
      <Sidebar />
      <div className="flex-1 overflow-auto">
        {/* Header Section */}
        <div className="p-8 pb-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Waste Configuration Manager</h1>
            <p className="text-gray-600">Manage waste types and disposal methods for your system</p>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg shadow-blue-100 p-6 border border-blue-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Waste Types</p>
                  <p className="text-2xl font-bold text-gray-900">{wasteTypes.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
                  Configured
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg shadow-green-100 p-6 border border-green-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Dispositions</p>
                  <p className="text-2xl font-bold text-gray-900">{dispositions.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <Recycle className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                  Active
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg shadow-purple-100 p-6 border border-purple-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">{wasteTypes.length + dispositions.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded-full">
                  System Ready
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
                <button 
                  onClick={() => setError(null)} 
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Waste Types Section */}
            <div className="bg-white rounded-2xl shadow-lg shadow-blue-100 border border-blue-100 overflow-hidden">
              <div className="p-8 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                      <Package className="w-6 h-6 text-blue-500" />
                      Waste Types ({wasteTypes.length})
                    </h2>
                    <p className="text-gray-600 mt-1">Configure different types of waste materials</p>
                  </div>
                  <button 
                    onClick={() => openWasteTypeModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Type
                  </button>
                </div>
              </div>
              
              <div className="p-8">
                {wasteTypes.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No waste types configured</h3>
                    <p className="text-gray-500 mb-4">Add your first waste type to get started</p>
                    <button 
                      onClick={() => openWasteTypeModal()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add First Waste Type
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {wasteTypes.map((type) => (
                      <div key={type.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl hover:from-blue-50 hover:to-blue-100 transition-all duration-200">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-xl">{type.Svg}</span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{type.WasteType}</div>
                            <div className="text-sm text-gray-500">ID: {type.id}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => openWasteTypeModal(type)}
                            className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Edit waste type"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteWasteType(type.id)}
                            className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete waste type"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Dispositions Section */}
            <div className="bg-white rounded-2xl shadow-lg shadow-green-100 border border-green-100 overflow-hidden">
              <div className="p-8 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                      <Recycle className="w-6 h-6 text-green-500" />
                      Dispositions ({dispositions.length})
                    </h2>
                    <p className="text-gray-600 mt-1">Configure disposal and processing methods</p>
                  </div>
                  <button 
                    onClick={() => openDispositionModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Method
                  </button>
                </div>
              </div>
              
              <div className="p-8">
                {dispositions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Recycle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No dispositions configured</h3>
                    <p className="text-gray-500 mb-4">Add your first disposal method to get started</p>
                    <button 
                      onClick={() => openDispositionModal()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add First Disposition
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dispositions.map((disp) => (
                      <div key={disp.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl hover:from-green-50 hover:to-green-100 transition-all duration-200">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <span className="text-xl">{disp.Svg}</span>
                          </div>
                          <div>
                            {/* FIXED: Changed to Dispostion to match table column name */}
                            <div className="font-medium text-gray-900">{disp.Dispostion}</div>
                            <div className="text-sm text-gray-500">ID: {disp.id}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => openDispositionModal(disp)}
                            className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Edit disposition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteDisposition(disp.id)}
                            className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete disposition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Waste Type Modal */}
      {showWasteTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingWasteType ? 'Edit Waste Type' : 'Add New Waste Type'}
              </h3>
              <button 
                onClick={() => setShowWasteTypeModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Waste Type Name
                </label>
                <input
                  type="text"
                  value={wasteTypeForm.WasteType}
                  onChange={(e) => setWasteTypeForm(prev => ({...prev, WasteType: e.target.value}))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Plastic Waste"
                  onKeyPress={(e) => e.key === 'Enter' && handleWasteTypeSubmit()}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon (Emoji or Symbol)
                </label>
                <input
                  type="text"
                  value={wasteTypeForm.Svg}
                  onChange={(e) => setWasteTypeForm(prev => ({...prev, Svg: e.target.value}))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="🗑️"
                  onKeyPress={(e) => e.key === 'Enter' && handleWasteTypeSubmit()}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => setShowWasteTypeModal(false)}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleWasteTypeSubmit}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingWasteType ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disposition Modal */}
      {showDispositionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingDisposition ? 'Edit Disposition' : 'Add New Disposition'}
              </h3>
              <button 
                onClick={() => setShowDispositionModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disposition Name
                </label>
                {/* FIXED: Changed all Disposition references to Dispostion */}
                <input
                  type="text"
                  value={dispositionForm.Dispostion}
                  onChange={(e) => setDispositionForm(prev => ({...prev, Dispostion: e.target.value}))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., Recycle"
                  onKeyPress={(e) => e.key === 'Enter' && handleDispositionSubmit()}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon (Emoji or Symbol)
                </label>
                <input
                  type="text"
                  value={dispositionForm.Svg}
                  onChange={(e) => setDispositionForm(prev => ({...prev, Svg: e.target.value}))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="♻️"
                  onKeyPress={(e) => e.key === 'Enter' && handleDispositionSubmit()}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => setShowDispositionModal(false)}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDispositionSubmit}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingDisposition ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}