import axios from "axios";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, Recycle, Package, CheckCircle, AlertCircle, X } from "lucide-react";
import Sidebar from "@/Components/SideBar";
import { usePage } from '@inertiajs/react';

export default function ProcessWaste() {
  const [items, setItems] = useState([]);
  const { user } = usePage().props;
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  // Database data states
  const [wasteTypes, setWasteTypes] = useState([]);
  const [dispositions, setDispositions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState(null);

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

  const handleAddItem = async () => {
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
      alert('Failed to check submission status.');
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
        checkSubmissionStatus()
      ]);
      setLoadingData(false);
    };

    loadData();
  }, [user.name]);

  const handleInputChange = (id, field, value) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleRemoveItem = (id) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const handleSave = async () => {
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
    
    if (error.response && error.response.status === 409) {
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
      <div className="min-h-screen bg-gray-50 flex">
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
      <div className="min-h-screen bg-gray-50 flex">
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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1">
        {/* Simple Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Recycle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Waste Management</h1>
                  <p className="text-sm text-gray-500">Track production waste</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Online</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-6">
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

          {/* Add Item Button */}
          {!alreadySubmitted && (
            <div className="mb-6">
              <button
                onClick={handleAddItem}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Waste Item
              </button>
            </div>
          )}

          {/* Items List */}
          {items.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
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
            <div className="space-y-4">
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
                <div key={item.id} className="bg-white rounded-lg p-6 shadow-sm border">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-medium text-gray-900">Item #{index + 1}</h3>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Waste Type - Using Database Data */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Waste Type
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={item.type}
                        onChange={(e) => handleInputChange(item.id, "type", e.target.value)}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Disposition
                      </label>
                      <select
                        value={item.disposition}
                        onChange={(e) => handleInputChange(item.id, "disposition", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Weight
                      </label>
                      <input
                        value={item.weight}
                        onChange={(e) => handleInputChange(item.id, "weight", e.target.value)}
                        type="number"
                        placeholder="Enter weight"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Unit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit
                      </label>
                      <select
                        value={item.unit}
                        onChange={(e) => handleInputChange(item.id, "unit", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                        <option value="tons">tons</option>
                        <option value="grams">grams</option>
                      </select>
                    </div>
                  </div>

                  {/* Item Status Indicator */}
                  <div className="mt-4 flex items-center gap-2">
                    {item.type && item.disposition && item.weight ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Complete</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-amber-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">Incomplete</span>
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
                    className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save All Items
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Simple Stats */}
          {items.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{items.length}</div>
                <div className="text-sm text-gray-600">Total Items</div>
              </div>
              
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {items.filter(item => item.disposition === 'Recycle').length}
                </div>
                <div className="text-sm text-gray-600">Recyclable</div>
              </div>
              
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {items.filter(item => item.type && item.disposition && item.weight).length}
                </div>
                <div className="text-sm text-gray-600">Complete</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}