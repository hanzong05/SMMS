import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Package, Recycle, Settings, CheckCircle, X, Save } from "lucide-react";

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Waste Configuration Manager</h1>
                  <p className="text-sm text-gray-500">Manage waste types and dispositions</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-6xl mx-auto px-6 py-2">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md relative">
              {error}
              <button 
                onClick={() => setError(null)} 
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Waste Types Table */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Waste Types ({wasteTypes.length})
                  </h2>
                  <button 
                    onClick={() => openWasteTypeModal()}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>
              <div className="p-4">
                {wasteTypes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No waste types configured</p>
                    <button 
                      onClick={() => openWasteTypeModal()}
                      className="mt-2 text-blue-500 hover:text-blue-600"
                    >
                      Add your first waste type
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {wasteTypes.map((type) => (
                      <div key={type.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{type.Svg}</span>
                          <div>
                            <div className="font-medium text-gray-900">{type.WasteType}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => openWasteTypeModal(type)}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteWasteType(type.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
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

            {/* Dispositions Table */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Recycle className="w-5 h-5" />
                    Dispositions ({dispositions.length})
                  </h2>
                  <button 
                    onClick={() => openDispositionModal()}
                    className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>
              <div className="p-4">
                {dispositions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Recycle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No dispositions configured</p>
                    <button 
                      onClick={() => openDispositionModal()}
                      className="mt-2 text-green-500 hover:text-green-600"
                    >
                      Add your first disposition
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dispositions.map((disp) => (
                      <div key={disp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{disp.Svg}</span>
                          <div>
                            {/* FIXED: Changed to Dispostion to match table column name */}
                            <div className="font-medium text-gray-900">{disp.Dispostion}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => openDispositionModal(disp)}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteDisposition(disp.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingWasteType ? 'Edit Waste Type' : 'Add New Waste Type'}
              </h3>
              <button 
                onClick={() => setShowWasteTypeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Waste Type Name
                </label>
                <input
                  type="text"
                  value={wasteTypeForm.WasteType}
                  onChange={(e) => setWasteTypeForm(prev => ({...prev, WasteType: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Plastic Waste"
                  onKeyPress={(e) => e.key === 'Enter' && handleWasteTypeSubmit()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon (Emoji or Symbol)
                </label>
                <input
                  type="text"
                  value={wasteTypeForm.Svg}
                  onChange={(e) => setWasteTypeForm(prev => ({...prev, Svg: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="🗑️"
                  onKeyPress={(e) => e.key === 'Enter' && handleWasteTypeSubmit()}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowWasteTypeModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleWasteTypeSubmit}
                className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingDisposition ? 'Edit Disposition' : 'Add New Disposition'}
              </h3>
              <button 
                onClick={() => setShowDispositionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Disposition Name
                </label>
                {/* FIXED: Changed all Disposition references to Dispostion */}
                <input
                  type="text"
                  value={dispositionForm.Dispostion}
                  onChange={(e) => setDispositionForm(prev => ({...prev, Dispostion: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Recycle"
                  onKeyPress={(e) => e.key === 'Enter' && handleDispositionSubmit()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon (Emoji or Symbol)
                </label>
                <input
                  type="text"
                  value={dispositionForm.Svg}
                  onChange={(e) => setDispositionForm(prev => ({...prev, Svg: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="♻️"
                  onKeyPress={(e) => e.key === 'Enter' && handleDispositionSubmit()}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowDispositionModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDispositionSubmit}
                className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
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