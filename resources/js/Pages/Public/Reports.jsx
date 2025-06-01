import React, { useState, useEffect } from "react";
import { Calendar, Filter, Download, Eye, Search, BarChart3, TrendingUp, Recycle, Package, Users, Clock } from "lucide-react";
import Sidebar from "@/Components/SideBar";

export default function WasteReports() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState('today');
  
  // Add the missing state variables
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWasteType, setSelectedWasteType] = useState('all');
  const [selectedDisposition, setSelectedDisposition] = useState('all');

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
    if (selectedDate !== 'all') {
      if (selectedDate === 'today') {
        filtered = filtered.filter(item => isToday(item.created_at));
      } else if (selectedDate === 'yesterday') {
        filtered = filtered.filter(item => isYesterday(item.created_at));
      } else if (selectedDate === 'last7days') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.created_at);
          return itemDate >= weekAgo;
        });
      } else {
        // Handle specific date selection
        const targetDate = selectedDate;
        filtered = filtered.filter(item => 
          item.created_at?.split('T')[0] === targetDate
        );
      }
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.InputBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.TypeOfWaste?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Disposition?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by waste type
    if (selectedWasteType !== 'all') {
      filtered = filtered.filter(item => item.TypeOfWaste === selectedWasteType);
    }
    
    // Filter by disposition
    if (selectedDisposition !== 'all') {
      filtered = filtered.filter(item => item.Disposition === selectedDisposition);
    }
    
    setFilteredReports(filtered);
  }, [reports, selectedDate, searchTerm, selectedWasteType, selectedDisposition]);

  useEffect(() => {
    fetchWasteReports();
  }, []);

  // Get unique values for filter dropdowns
  const uniqueWasteTypes = [...new Set(reports.map(item => item.TypeOfWaste))].filter(Boolean);
  const uniqueDispositions = [...new Set(reports.map(item => item.Disposition))].filter(Boolean);

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
      <div className="min-h-screen bg-gray-50 flex">
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
      <div className="min-h-screen bg-gray-50 flex">
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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Waste Reports</h1>
                  <p className="text-sm text-gray-500">View and analyze waste processing data</p>
                </div>
              </div>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Today</h3>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Items:</span>
                  <span className="font-medium">{stats.today.items}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Weight:</span>
                  <span className="font-medium">{stats.today.weight.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Users:</span>
                  <span className="font-medium">{stats.today.users}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Yesterday</h3>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Items:</span>
                  <span className="font-medium">{stats.yesterday.items}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Weight:</span>
                  <span className="font-medium">{stats.yesterday.weight.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Users:</span>
                  <span className="font-medium">{stats.yesterday.users}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Last 7 Days</h3>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Items:</span>
                  <span className="font-medium">{stats.lastWeek.items}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Weight:</span>
                  <span className="font-medium">{stats.lastWeek.weight.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Users:</span>
                  <span className="font-medium">{stats.lastWeek.users}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">Filters</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last7days">Last 7 Days</option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search user, waste type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Waste Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Waste Type</label>
                <select
                  value={selectedWasteType}
                  onChange={(e) => setSelectedWasteType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  {uniqueWasteTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Disposition Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disposition</label>
                <select
                  value={selectedDisposition}
                  onChange={(e) => setSelectedDisposition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Dispositions</option>
                  {uniqueDispositions.map(disposition => (
                    <option key={disposition} value={disposition}>{disposition}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedDate('today');
                    setSearchTerm('');
                    setSelectedWasteType('all');
                    setSelectedDisposition('all');
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
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