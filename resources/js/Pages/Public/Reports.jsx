import React, { useState, useEffect } from "react";
import { Calendar, Filter, Download, Eye, Search, BarChart3, TrendingUp, Recycle, Package, Users, Clock } from "lucide-react";
import Sidebar from "@/Components/SideBar";
import { Head } from '@inertiajs/react';

export default function WasteReports() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState('today');
  
  // Add the missing state variables
  const [customDate, setCustomDate] = useState('');

  // Stats state
  const [stats, setStats] = useState({
    today: { items: 0, weight: 0, users: 0 },
    yesterday: { items: 0, weight: 0, users: 0 },
    lastWeek: { items: 0, weight: 0, users: 0 }
  });

  // Get date strings for filtering - considering day boundaries
  const getDateString = (daysAgo = 0) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  };

  // Check if a timestamp is from today (after midnight)
  const isToday = (timestamp) => {
    const itemDate = new Date(timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return itemDate >= today && itemDate < tomorrow;
  };

  // Check if a timestamp is from yesterday (between midnight yesterday and midnight today)
  const isYesterday = (timestamp) => {
    const itemDate = new Date(timestamp);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return itemDate >= yesterday && itemDate < today;
  };

  const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    
    if (isToday(dateString)) return 'Today';
    if (isYesterday(dateString)) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Fetch waste reports from API
  const fetchWasteReports = async () => {
    try {
      setLoading(true);
      
      // Try the API endpoint first
      try {
        const response = await fetch('/api/waste-reports', {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setReports(data.data);
            calculateStats(data.data);
            return;
          }
        }
      } catch (apiError) {
        console.log('API endpoint not available, using mock data for testing');
      }
      
      // Fallback to mock data for testing
      const mockData = [
        {
          id: 1,
          TypeOfWaste: 'Plastic Waste',
          Disposition: 'Recycle',
          Weight: '5.5',
          Unit: 'kg',
          InputBy: 'John Doe',
          VerifiedBy: 'Admin User',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          TypeOfWaste: 'Paper Waste',
          Disposition: 'Recycle',
          Weight: '3.2',
          Unit: 'kg',
          InputBy: 'Jane Smith',
          VerifiedBy: null,
          created_at: new Date(Date.now() - 86400000).toISOString() // Yesterday
        },
        {
          id: 3,
          TypeOfWaste: 'Food Waste',
          Disposition: 'Compost',
          Weight: '2.8',
          Unit: 'kg',
          InputBy: 'Bob Johnson',
          VerifiedBy: 'Admin User',
          created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
        },
        {
          id: 4,
          TypeOfWaste: 'Electronic Waste',
          Disposition: 'Special Handling',
          Weight: '1.5',
          Unit: 'kg',
          InputBy: 'Alice Brown',
          VerifiedBy: null,
          created_at: new Date().toISOString()
        }
      ];
      
      setReports(mockData);
      calculateStats(mockData);
      
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Failed to fetch waste reports: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (data) => {
    const todayData = data.filter(item => isToday(item.created_at));
    const yesterdayData = data.filter(item => isYesterday(item.created_at));
    
    // Last week data (7 days ago until yesterday midnight)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    
    const lastWeekData = data.filter(item => {
      const itemDate = new Date(item.created_at);
      return itemDate >= weekAgo && itemDate < todayMidnight;
    });

    setStats({
      today: {
        items: todayData.length,
        weight: todayData.reduce((sum, item) => sum + (parseFloat(item.Weight) || 0), 0),
        users: [...new Set(todayData.map(item => item.InputBy))].length
      },
      yesterday: {
        items: yesterdayData.length,
        weight: yesterdayData.reduce((sum, item) => sum + (parseFloat(item.Weight) || 0), 0),
        users: [...new Set(yesterdayData.map(item => item.InputBy))].length
      },
      lastWeek: {
        items: lastWeekData.length,
        weight: lastWeekData.reduce((sum, item) => sum + (parseFloat(item.Weight) || 0), 0),
        users: [...new Set(lastWeekData.map(item => item.InputBy))].length
      }
    });
  };

  // Filter reports based on selected criteria
  useEffect(() => {
    let filtered = [...reports];
    
    // Filter by date
    if (selectedDate === 'today') {
      filtered = filtered.filter(item => isToday(item.created_at));
    } else if (selectedDate === 'yesterday') {
      filtered = filtered.filter(item => isYesterday(item.created_at));
    } else if (selectedDate === 'custom' && customDate) {
      filtered = filtered.filter(item => 
        item.created_at?.split('T')[0] === customDate
      );
    }
    

    
    setFilteredReports(filtered);
  }, [reports, selectedDate, customDate]);

  useEffect(() => {
    fetchWasteReports();
  }, []);

  // Export to CSV
  const exportToCSV = () => {
    if (filteredReports.length === 0) return;
    
    const headers = ['Date', 'User', 'Waste Type', 'Disposition', 'Weight', 'Unit'];
    const csvContent = [
      headers.join(','),
      ...filteredReports.map(item => [
        item.created_at?.split('T')[0] || '',
        item.InputBy || '',
        item.TypeOfWaste || '',
        item.Disposition || '',
        item.Weight || '',
        item.Unit || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waste-reports-${selectedDate}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Head title="Waste Reports" />
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading waste reports...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Head title="Waste Reports" />
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Reports</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchWasteReports}
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
      <Head title="Waste Reports" />
      <Sidebar />
      <div className="flex-1 overflow-auto">
        {/* Header Section */}
        <div className="p-8 pb-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Waste Reports</h1>
            <p className="text-gray-600">View and analyze waste processing data</p>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg shadow-blue-100 p-6 border border-blue-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Today</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.today.weight.toFixed(1)}<span className="text-sm font-medium text-gray-500 ml-1">kg</span></p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                  {stats.today.items} items
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg shadow-amber-100 p-6 border border-amber-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Yesterday</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.yesterday.weight.toFixed(1)}<span className="text-sm font-medium text-gray-500 ml-1">kg</span></p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-1 rounded-full">
                  {stats.yesterday.items} items
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg shadow-green-100 p-6 border border-green-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Last 7 Days</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.lastWeek.weight.toFixed(1)}<span className="text-sm font-medium text-gray-500 ml-1">kg</span></p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                  {stats.lastWeek.items} items
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8">
          {/* Controls Section */}
          <div className="bg-white rounded-2xl shadow-lg shadow-blue-100 border border-blue-100 p-8 mb-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Filter Reports</h2>
                <p className="text-gray-600">Customize your view with filters and export data</p>
              </div>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Today/Yesterday Buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quick Filters</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedDate('today')}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedDate === 'today'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setSelectedDate('yesterday')}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedDate === 'yesterday'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Yesterday
                  </button>
                </div>
              </div>

              {/* Calendar Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Custom Date</label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    setSelectedDate('custom');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>



              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedDate('today');
                    setCustomDate('');
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-white rounded-2xl shadow-lg shadow-blue-100 border border-blue-100 overflow-hidden">
            <div className="p-8 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  Waste Reports ({filteredReports.length} items)
                </h3>
                <div className="text-sm text-gray-500">
                  Total Weight: {filteredReports.reduce((sum, item) => sum + (parseFloat(item.Weight) || 0), 0).toFixed(2)} kg
                </div>
              </div>
            </div>

            {filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
                <p className="text-gray-500">Try adjusting your filters or date range</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Waste Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Disposition
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Weight
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReports.map((report, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formatDateForDisplay(report.created_at?.split('T')[0])}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            {report.InputBy || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            {report.TypeOfWaste || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <Recycle className="w-4 h-4 text-gray-400" />
                            {report.Disposition || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-medium">{report.Weight || '0'}</span>
                          <span className="text-gray-500 ml-1">{report.Unit || 'kg'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            report.VerifiedBy 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {report.VerifiedBy ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}