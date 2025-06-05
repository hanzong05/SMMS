import axios from "axios";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, Recycle, Package, CheckCircle, AlertCircle, X, Eye, EyeOff, Lock } from "lucide-react";
import Sidebar from "@/Components/SideBar";
import { usePage } from '@inertiajs/react';
import { Head } from '@inertiajs/react';

export default function ProcessWaste() {
  const [items, setItems] = useState([]);
  const { user, permissions = {} } = usePage().props;
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  // Extract permissions with defaults
  const {
    canCreate = true,
    canEdit = true,
    canDelete = true,
    isViewOnly = false
  } = permissions;

  // Check if user has view-only permission
  const checkViewOnly = () => {
    return user?.permission_level === 'view only' || 
           user?.permission_level === 'view_only' || 
           isViewOnly;
  };

  const userIsViewOnly = checkViewOnly();

  // Database data states
  const [wasteTypes, setWasteTypes] = useState([]);
  const [dispositions, setDispositions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [existingWastes, setExistingWastes] = useState([]);

  // Fetch waste types from database
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
        setDataError('Failed to fetch waste types');
      }
    } catch (err) {
      console.error('Fetch waste types error:', err);
      setDataError('Failed to fetch waste types');
    }
  };

  // Fetch dispositions from database
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
        setDataError('Failed to fetch dispositions');
      }
    } catch (err) {
      console.error('Fetch dispositions error:', err);
      setDataError('Failed to fetch dispositions');
    }
  };

  // Fetch existing waste records (for view-only users)
  const fetchExistingWastes = async () => {
    try {
      const response = await fetch('/api/waste-reports');
      const data = await response.json();
      if (data.success) {
        setExistingWastes(data.data);
        // Update permissions from API response if available
        if (data.permissions) {
          // Could update local state here if needed
        }
      }
    } catch (err) {
      console.error('Fetch existing wastes error:', err);
    }
  };

  const handleAddItem = async () => {
    if (userIsViewOnly) {
      setMessage('Access denied. You have view-only permissions.');
      setStatus('error');
      return;
    }

    try {
      const response = await axios.get('/check-submission', {
        params: { user_name: user.name },
      });

      if (response.data.submitted) {
        alert('You have already submitted today.');
      } else {
        setItems(prevItems => [
          ...prevItems,
          {
            id: prevItems.length + 1,
            type: "",
            disposition: "",
            weight: "",
            unit: "kg"
          }
        ]);
      }
    } catch (error) {
      console.error('Error checking submission:', error);
      if (error.response?.status === 403) {
        setMessage('Access denied. You have view-only permissions.');
        setStatus('error');
      } else {
        alert('Failed to check submission status.');
      }
    }
  };

  useEffect(() => {
    const checkSubmissionStatus = async () => {
      try {
        const response = await axios.get('/check-submission', {
          params: { user_name: user.name },
        });

        if (response.data.submitted) {
          setAlreadySubmitted(true);
        }
      } catch (error) {
        console.error('Error checking submission on mount:', error);
      }
    };

    // Load database data and check submission status
    const loadData = async () => {
      await Promise.all([
        fetchWasteTypes(),
        fetchDispositions(),
        userIsViewOnly ? fetchExistingWastes() : checkSubmissionStatus()
      ]);
      setLoadingData(false);
    };

    loadData();
  }, [user.name, userIsViewOnly]);

  const handleInputChange = (id, field, value) => {
    if (userIsViewOnly) {
      setMessage('Access denied. You have view-only permissions.');
      setStatus('error');
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleRemoveItem = (id) => {
    if (userIsViewOnly) {
      setMessage('Access denied. You have view-only permissions.');
      setStatus('error');
      return;
    }

    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    if (userIsViewOnly) {
      setMessage('Access denied. You have view-only permissions.');
      setStatus('error');
      return;
    }

    // Validate all items are complete
    const incompleteItems = items.filter(item => !item.type || !item.disposition || !item.weight);
    if (incompleteItems.length > 0) {
      alert('Please complete all items before saving.');
      return;
    }

    try {
      // Transform data to match your backend expectations (keep original PascalCase)
      const transformedItems = items.map(item => ({
        TypeOfWaste: item.type,
        Disposition: item.disposition,
        Weight: parseFloat(item.weight),
        Unit: item.unit,
        InputBy: user.name,
        VerifiedBy: null  // Add this field that seems to be required
      }));

      console.log('Sending data:', { items: transformedItems, user_name: user.name });
      
      const response = await axios.post("/wastes", { 
        items: transformedItems, 
        user_name: user.name 
      });
      
      alert("Items saved successfully!");
      setItems([]);
      setMessage('Items saved successfully!');
      setStatus('success');
      console.log(response.data);
    } catch (error) {
      console.error("Save failed:", error);
      console.error("Error response:", error.response?.data);
      
      if (error.response?.status === 403) {
        setMessage('Access denied. You have view-only permissions.');
        setStatus('error');
      } else if (error.response && error.response.status === 409) {
        setMessage(error.response.data.message);
        setStatus('error');
      } else if (error.response && error.response.status === 422) {
        const validationErrors = error.response.data.errors || error.response.data.message;
        console.error("Validation errors:", validationErrors);
        
        // More detailed error message
        if (error.response.data.errors) {
          const errorFields = Object.keys(error.response.data.errors);
          const errorDetails = Object.entries(error.response.data.errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('; ');
          console.log('Detailed validation errors:', errorDetails);
          setMessage(`Validation failed: ${errorDetails}`);
        } else {
          setMessage(`Validation failed: ${error.response.data.message}`);
        }
        setStatus('error');
      } else {
        setMessage("Failed to save. Please try again.");
        setStatus('error');
      }
    }
  };

  // Show loading state while fetching data
  if (loadingData) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Head title={userIsViewOnly ? "View Waste Records" : "Process Waste"} />
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading waste data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if data loading failed
  if (dataError) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Head title={userIsViewOnly ? "View Waste Records" : "Process Waste"} />
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
            <p className="text-red-600 mb-4">{dataError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Head title={userIsViewOnly ? "View Waste Records" : "Process Waste"} />
      <Sidebar />
      <div className="flex-1 overflow-auto">
        {/* Header Section */}
        <div className="p-8 pb-0">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {userIsViewOnly ? 'Waste Records (View Only)' : 'Waste Management'}
              </h1>
              {userIsViewOnly && (
                <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 border border-yellow-300 rounded-full">
                  <Eye className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700">View Only</span>
                </div>
              )}
            </div>
            <p className="text-gray-600">
              {userIsViewOnly 
                ? 'View waste records and data (read-only access)' 
                : 'Track and process production waste efficiently'
              }
            </p>
          </div>

          {/* Permission Alert for View-Only Users */}
          {userIsViewOnly && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Lock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800">View-Only Access</h3>
                  <p className="text-sm text-blue-700">You can view existing waste records but cannot create, edit, or delete entries.</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg shadow-blue-100 p-6 border border-blue-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {userIsViewOnly ? 'Total Records' : 'Total Items'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userIsViewOnly ? existingWastes.length : items.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg shadow-green-100 p-6 border border-green-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Recyclable</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userIsViewOnly 
                      ? existingWastes.filter(item => item.Disposition === 'Recycle').length
                      : items.filter(item => item.disposition === 'Recycle').length
                    }
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <Recycle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg shadow-purple-100 p-6 border border-purple-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {userIsViewOnly ? 'Your Records' : 'Complete'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userIsViewOnly 
                      ? existingWastes.filter(item => item.InputBy === user.name).length
                      : items.filter(item => item.type && item.disposition && item.weight).length
                    }
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8">
          {/* Status Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${status === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
              <div className="flex items-center gap-2">
                {status === 'error' ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>{message}</span>
                <button 
                  onClick={() => setMessage('')} 
                  className="ml-auto text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* View-Only: Show Existing Records */}
          {userIsViewOnly ? (
            <div className="bg-white rounded-2xl shadow-lg shadow-blue-100 border border-blue-100 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Waste Records</h2>
              
              {existingWastes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No waste records found</h3>
                  <p className="text-gray-500">No waste records are available to view.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disposition</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Input By</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {existingWastes.map((waste) => (
                        <tr key={waste.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{waste.TypeOfWaste}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{waste.Disposition}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{waste.Weight} {waste.Unit}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{waste.InputBy}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(waste.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* Normal Processing Mode for Users with Write Access */
            <>
              {/* Add Item Button */}
              {!alreadySubmitted && (
                <div className="bg-white rounded-2xl shadow-lg shadow-blue-100 border border-blue-100 p-8 mb-8">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-2">Add Waste Items</h2>
                      <p className="text-gray-600">Start by adding waste items to process</p>
                    </div>
                    <button
                      onClick={handleAddItem}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      disabled={userIsViewOnly}
                    >
                      <Plus className="w-5 h-5" />
                      Add Waste Item
                    </button>
                  </div>
                </div>
              )}

              {/* Items List */}
              {items.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg shadow-blue-100 border border-blue-100 p-12 text-center">
                  {!alreadySubmitted ? (
                    <>
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No waste items yet</h3>
                      <p className="text-gray-500 mb-4">Start by adding your first waste item</p>
                      <button
                        onClick={handleAddItem}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        disabled={userIsViewOnly}
                      >
                        <Plus className="w-4 h-4" />
                        Add First Item
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-amber-500" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Already Submitted</h3>
                      <p className="text-gray-500 mb-4">You've submitted your report for today. Come back tomorrow!</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Already Submitted Alert inside items area */}
                  {alreadySubmitted && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-amber-800">Already Submitted</h3>
                          <p className="text-sm text-amber-700">You've submitted your report for today. Come back tomorrow!</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {items.map((item, index) => (
                    <div key={item.id} className="bg-white rounded-2xl shadow-lg shadow-blue-100 border border-blue-100 p-8">
                      <div className="flex items-start justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900">Item #{index + 1}</h3>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove item"
                          disabled={userIsViewOnly}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Waste Type - Using Database Data */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Waste Type
                          </label>
                          <select
                            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${userIsViewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                            value={item.type}
                            onChange={(e) => handleInputChange(item.id, "type", e.target.value)}
                            disabled={userIsViewOnly}
                          >
                            <option value="">Select type...</option>
                            {wasteTypes.map((type) => (
                              <option key={type.id} value={type.WasteType}>
                                {type.Svg} {type.WasteType}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Disposition - Using Database Data */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Disposition
                          </label>
                          <select
                            value={item.disposition}
                            onChange={(e) => handleInputChange(item.id, "disposition", e.target.value)}
                            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${userIsViewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                            disabled={userIsViewOnly}
                          >
                            <option value="">Select disposition...</option>
                            {dispositions.map((disp) => (
                              <option key={disp.id} value={disp.Dispostion}>
                                {disp.Svg} {disp.Dispostion}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Weight */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Weight
                          </label>
                          <input
                            value={item.weight}
                            onChange={(e) => handleInputChange(item.id, "weight", e.target.value)}
                            type="number"
                            placeholder="Enter weight"
                            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${userIsViewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                            disabled={userIsViewOnly}
                          />
                        </div>

                        {/* Unit */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Unit
                          </label>
                          <select
                            value={item.unit}
                            onChange={(e) => handleInputChange(item.id, "unit", e.target.value)}
                            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${userIsViewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                            disabled={userIsViewOnly}
                          >
                            <option value="kg">kg</option>
                            <option value="lbs">lbs</option>
                            <option value="tons">tons</option>
                            <option value="grams">grams</option>
                          </select>
                        </div>
                      </div>

                      {/* Item Status Indicator */}
                      <div className="mt-6 flex items-center gap-2">
                        {item.type && item.disposition && item.weight ? (
                          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Complete</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Incomplete</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Save Button */}
                  {items.length > 0 && (
                    <div className="flex justify-end pt-4">
                      <button
                        onClick={handleSave}
                        className={`flex items-center gap-2 px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-lg font-semibold ${userIsViewOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={userIsViewOnly}
                      >
                        <Save className="w-5 h-5" />
                        Save All Items
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}