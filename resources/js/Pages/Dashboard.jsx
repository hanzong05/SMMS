import Sidebar from "@/Components/SideBar";
import ApexCharts from 'apexcharts'
import React, {useState, useEffect} from "react";

export default function Dashboard() {
  const [wasteData, setWasteData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    lineChart: null,
    pieChart: null,
    donutChart: null
  });

  // Fetch waste reports from API
  const fetchWasteReports = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/waste-reports', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setWasteData(data.data);
          processDataForCharts(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch waste data:', error);
      // Use mock data with better distribution across days
      const mockData = [
        // Today's data
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
          created_at: new Date().toISOString()
        },
        // Yesterday
        {
          id: 3,
          TypeOfWaste: 'Food Waste',
          Disposition: 'Compost',
          Weight: '2.8',
          Unit: 'kg',
          InputBy: 'Bob Johnson',
          VerifiedBy: 'Admin User',
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 4,
          TypeOfWaste: 'Glass Waste',
          Disposition: 'Recycle',
          Weight: '4.1',
          Unit: 'kg',
          InputBy: 'Alice Brown',
          VerifiedBy: 'Admin User',
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 5,
          TypeOfWaste: 'Metal Waste',
          Disposition: 'Recycle',
          Weight: '1.9',
          Unit: 'kg',
          InputBy: 'Charlie Wilson',
          VerifiedBy: null,
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        // 2 days ago
        {
          id: 6,
          TypeOfWaste: 'Plastic Waste',
          Disposition: 'Recycle',
          Weight: '6.2',
          Unit: 'kg',
          InputBy: 'David Lee',
          VerifiedBy: 'Admin User',
          created_at: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: 7,
          TypeOfWaste: 'Food Waste',
          Disposition: 'Compost',
          Weight: '3.7',
          Unit: 'kg',
          InputBy: 'Eva Garcia',
          VerifiedBy: 'Admin User',
          created_at: new Date(Date.now() - 172800000).toISOString()
        },
        // 3 days ago
        {
          id: 8,
          TypeOfWaste: 'Paper Waste',
          Disposition: 'Recycle',
          Weight: '2.5',
          Unit: 'kg',
          InputBy: 'Frank Miller',
          VerifiedBy: null,
          created_at: new Date(Date.now() - 259200000).toISOString()
        },
        {
          id: 9,
          TypeOfWaste: 'Electronic Waste',
          Disposition: 'Special Processing',
          Weight: '1.3',
          Unit: 'kg',
          InputBy: 'Grace Taylor',
          VerifiedBy: 'Admin User',
          created_at: new Date(Date.now() - 259200000).toISOString()
        },
        // 4 days ago
        {
          id: 10,
          TypeOfWaste: 'Plastic Waste',
          Disposition: 'Recycle',
          Weight: '4.8',
          Unit: 'kg',
          InputBy: 'Henry Davis',
          VerifiedBy: 'Admin User',
          created_at: new Date(Date.now() - 345600000).toISOString()
        },
        {
          id: 11,
          TypeOfWaste: 'Glass Waste',
          Disposition: 'Recycle',
          Weight: '3.1',
          Unit: 'kg',
          InputBy: 'Iris Johnson',
          VerifiedBy: null,
          created_at: new Date(Date.now() - 345600000).toISOString()
        },
        {
          id: 12,
          TypeOfWaste: 'Food Waste',
          Disposition: 'Compost',
          Weight: '2.2',
          Unit: 'kg',
          InputBy: 'Jack Brown',
          VerifiedBy: 'Admin User',
          created_at: new Date(Date.now() - 345600000).toISOString()
        },
        // 5 days ago
        {
          id: 13,
          TypeOfWaste: 'Paper Waste',
          Disposition: 'Recycle',
          Weight: '5.9',
          Unit: 'kg',
          InputBy: 'Kate Wilson',
          VerifiedBy: 'Admin User',
          created_at: new Date(Date.now() - 432000000).toISOString()
        },
        {
          id: 14,
          TypeOfWaste: 'Metal Waste',
          Disposition: 'Recycle',
          Weight: '2.7',
          Unit: 'kg',
          InputBy: 'Leo Martinez',
          VerifiedBy: null,
          created_at: new Date(Date.now() - 432000000).toISOString()
        }
      ];
      setWasteData(mockData);
      processDataForCharts(mockData);
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts
  const processDataForCharts = (data) => {
    // Get last 7 days data for line chart
    const last7Days = [];
    const dailyWeights = [];
    const dailyCounts = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = data.filter(item => 
        item.created_at && item.created_at.split('T')[0] === dateStr
      );
      
      const totalWeight = dayData.reduce((sum, item) => sum + (parseFloat(item.Weight) || 0), 0);
      const totalCount = dayData.length;
      
      last7Days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      dailyWeights.push(totalWeight);
      dailyCounts.push(totalCount);
    }

    // Process waste type distribution for pie chart
    const wasteTypeStats = {};
    data.forEach(item => {
      const type = item.TypeOfWaste || 'Unknown';
      wasteTypeStats[type] = (wasteTypeStats[type] || 0) + (parseFloat(item.Weight) || 0);
    });

    const pieLabels = Object.keys(wasteTypeStats);
    const pieValues = Object.values(wasteTypeStats);

    // Process disposition distribution for donut chart
    const dispositionStats = {};
    data.forEach(item => {
      const disposition = item.Disposition || 'Unknown';
      dispositionStats[disposition] = (dispositionStats[disposition] || 0) + (parseFloat(item.Weight) || 0);
    });

    const donutLabels = Object.keys(dispositionStats);
    const donutValues = Object.values(dispositionStats);

    // Create chart configurations with enhanced styling and dual y-axes
    const lineChartConfig = {
      grid: {
        show: true,
        strokeDashArray: 2,
        borderColor: '#f1f5f9',
        padding: {
          left: 2,
          right: 2,
          top: -26
        },
      },
      series: [
        {
          name: "Daily Weight (kg)",
          type: "area",
          data: dailyWeights,
          color: "#3b82f6",
        },
        {
          name: "Daily Count",
          type: "line",
          data: dailyCounts,
          color: "#8b5cf6",
        },
      ],
      chart: {
        height: 400,
        maxWidth: "100%",
        type: "line",
        fontFamily: "Inter, sans-serif",
        dropShadow: {
          enabled: true,
          color: '#000',
          top: 18,
          left: 7,
          blur: 10,
          opacity: 0.1,
        },
        toolbar: {
          show: false,
        },
      },
      tooltip: {
        enabled: true,
        shared: true,
        intersect: false,
        theme: 'light',
        style: {
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
        },
        y: {
          formatter: function (value, { seriesIndex }) {
            if (seriesIndex === 0) {
              return value.toFixed(1) + ' kg';
            } else {
              return value + ' items';
            }
          },
        },
      },
      legend: {
        show: true,
        position: 'top',
        fontSize: '14px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
      },
      fill: {
        type: ["gradient", "solid"],
        gradient: {
          opacityFrom: 0.6,
          opacityTo: 0.1,
          stops: [0, 100],
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: [0, 4],
        curve: 'smooth',
      },
      xaxis: {
        categories: last7Days,
        labels: {
          show: true,
          style: {
            colors: '#64748b',
            fontSize: '12px',
          }
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: [
        {
          title: {
            text: "Weight (kg)",
            style: {
              color: '#3b82f6',
              fontSize: '12px',
              fontWeight: 500,
            }
          },
          labels: {
            style: {
              colors: '#3b82f6',
              fontSize: '12px',
            },
            formatter: function (value) {
              return value.toFixed(1) + 'kg';
            }
          },
          min: 0,
          max: function(max) {
            return Math.max(max * 1.1, 1); // Ensure minimum scale of 1kg
          }
        },
        {
          opposite: true,
          title: {
            text: "Item Count",
            style: {
              color: '#8b5cf6',
              fontSize: '12px',
              fontWeight: 500,
            }
          },
          labels: {
            style: {
              colors: '#8b5cf6',
              fontSize: '12px',
            },
            formatter: function (value) {
              return Math.round(value);
            }
          },
          min: 0,
          max: function(max) {
            return Math.max(max * 1.1, 5); // Ensure minimum scale of 5 items
          }
        },
      ],
    };

    const pieChartConfig = {
      series: pieValues,
      colors: ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"],
      chart: {
        height: 380,
        width: "100%",
        type: "pie",
        fontFamily: "Inter, sans-serif",
      },
      stroke: {
        colors: ["white"],
        width: 2,
      },
      plotOptions: {
        pie: {
          labels: {
            show: true,
          },
          size: "100%",
          dataLabels: {
            offset: -25
          }
        },
      },
      labels: pieLabels,
      dataLabels: {
        enabled: true,
        style: {
          fontFamily: "Inter, sans-serif",
          fontSize: '12px',
          fontWeight: 600,
        },
        formatter: function (val) {
          return val.toFixed(1) + "%"
        },
      },
      legend: {
        position: "bottom",
        fontFamily: "Inter, sans-serif",
        fontSize: '13px',
        offsetY: 10,
      },
      tooltip: {
        style: {
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
        },
        y: {
          formatter: function (value, { seriesIndex }) {
            return pieValues[seriesIndex].toFixed(2) + " kg"
          },
        },
      },
    };

    const donutChartConfig = {
      series: donutValues,
      colors: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"],
      chart: {
        height: 320,
        width: "100%",
        type: "donut",
        fontFamily: "Inter, sans-serif",
      },
      stroke: {
        colors: ["white"],
        width: 2,
      },
      plotOptions: {
        pie: {
          donut: {
            labels: {
              show: true,
              name: {
                show: true,
                fontFamily: "Inter, sans-serif",
                fontSize: '16px',
                fontWeight: 500,
                offsetY: 20,
              },
              total: {
                showAlways: true,
                show: true,
                label: "Total Weight",
                fontFamily: "Inter, sans-serif",
                fontSize: '14px',
                color: '#64748b',
                formatter: function (w) {
                  const sum = w.globals.seriesTotals.reduce((a, b) => {
                    return a + b
                  }, 0)
                  return sum.toFixed(1) + ' kg'
                },
              },
              value: {
                show: true,
                fontFamily: "Inter, sans-serif",
                fontSize: '24px',
                fontWeight: 700,
                color: '#1e293b',
                offsetY: -20,
                formatter: function (value) {
                  return parseFloat(value).toFixed(1) + " kg"
                },
              },
            },
            size: "75%",
          },
        },
      },
      grid: {
        padding: {
          top: -2,
        },
      },
      labels: donutLabels,
      dataLabels: {
        enabled: false,
      },
      legend: {
        position: "bottom",
        fontFamily: "Inter, sans-serif",
        fontSize: '13px',
        offsetY: 10,
      },
      tooltip: {
        style: {
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
        },
        y: {
          formatter: function (value) {
            return value.toFixed(2) + " kg"
          },
        },
      },
    };

    setChartData({
      lineChart: lineChartConfig,
      pieChart: pieChartConfig,
      donutChart: donutChartConfig
    });
  };

  useEffect(() => {
    fetchWasteReports();
  }, []);

  useEffect(() => {
    if (!loading && chartData.lineChart) {
      // Wait for the divs to exist before rendering charts
      const el1 = document.querySelector("#column-chart");
      const el2 = document.querySelector("#pie-chart");
      const el3 = document.querySelector("#donut-chart");

      let chart1, chart2, chart3;

      if (el1 && chartData.lineChart) {
        chart1 = new ApexCharts(el1, chartData.lineChart);
        chart1.render();
      }
      if (el2 && chartData.pieChart) {
        chart2 = new ApexCharts(el2, chartData.pieChart);
        chart2.render();
      }
      if (el3 && chartData.donutChart) {
        chart3 = new ApexCharts(el3, chartData.donutChart);
        chart3.render();
      }

      // Cleanup function to destroy charts if component unmounts
      return () => {
        if (chart1) chart1.destroy();
        if (chart2) chart2.destroy();
        if (chart3) chart3.destroy();
      };
    }
  }, [loading, chartData]);

  // Calculate top waste types
  const getTopWasteTypes = () => {
    const wasteTypeStats = {};
    
    wasteData.forEach(item => {
      const type = item.TypeOfWaste || 'Unknown';
      if (!wasteTypeStats[type]) {
        wasteTypeStats[type] = {
          type: type,
          weight: 0,
          count: 0
        };
      }
      wasteTypeStats[type].weight += parseFloat(item.Weight) || 0;
      wasteTypeStats[type].count += 1;
    });

    // Convert to array and sort by weight (descending)
    return Object.values(wasteTypeStats)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5); // Top 5 waste types
  };

  // Calculate stats
  const totalWeight = wasteData.reduce((sum, item) => sum + (parseFloat(item.Weight) || 0), 0);
  const totalItems = wasteData.length;
  const totalUsers = [...new Set(wasteData.map(item => item.InputBy))].length;

  // Today's data
  const today = new Date().toISOString().split('T')[0];
  const todayData = wasteData.filter(item => 
    item.created_at && item.created_at.split('T')[0] === today
  );
  const todayWeight = todayData.reduce((sum, item) => sum + (parseFloat(item.Weight) || 0), 0);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sidebar - Fixed position */}
      <Sidebar/> 
       
      {/* Main content area */}
      <div className="flex-1 overflow-auto">
        {/* Header Section */}
        <div className="p-8 pb-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Waste Management Dashboard</h1>
            <p className="text-gray-600">Monitor and analyze waste processing data in real-time</p>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg shadow-blue-100 p-6 border border-blue-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Today's Waste</p>
                  <p className="text-2xl font-bold text-gray-900">{todayWeight.toFixed(1)}<span className="text-sm font-medium text-gray-500 ml-1">kg</span></p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                  {todayData.length} items
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg shadow-green-100 p-6 border border-green-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Weight</p>
                  <p className="text-2xl font-bold text-gray-900">{totalWeight.toFixed(1)}<span className="text-sm font-medium text-gray-500 ml-1">kg</span></p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg shadow-purple-100 p-6 border border-purple-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg shadow-orange-100 p-6 border border-orange-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <div className="text-gray-600 font-medium">Loading dashboard data...</div>
            </div>
          </div>
        ) : (
          <div className="px-8 pb-8">
            {/* Main Chart Section */}
            <div className="bg-white rounded-2xl shadow-lg shadow-blue-100 border border-blue-100 p-8 mb-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Waste Processing Trends</h2>
                  <p className="text-gray-600">Daily weight and item count over the last 7 days</p>
                </div>
                <div className="flex space-x-3">
                  <button className="px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors">
                    Last 7 days
                  </button>
                  <a
                    href="/Reports"
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center">
                    View Reports
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </a>
                </div>
              </div>

              <div id="column-chart" className="h-96"></div>
            </div>

            {/* Bottom Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Top Waste Types */}
              <div className="bg-white rounded-2xl shadow-lg shadow-gray-100 border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Top Waste Types</h3>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <div className="space-y-4">
                  {getTopWasteTypes().length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                        </svg>
                      </div>
                      <p className="text-gray-500">No waste data available</p>
                    </div>
                  ) : (
                    getTopWasteTypes().map((waste, index) => (
                      <div key={waste.type} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-blue-100 transition-all duration-200">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 text-sm font-bold rounded-full">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 truncate">{waste.type}</p>
                            <p className="text-sm text-gray-500">{waste.count} items</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{waste.weight.toFixed(1)} kg</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Waste Types Pie Chart */}
              <div className="bg-white rounded-2xl shadow-lg shadow-gray-100 border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Waste Types</h3>
                    <p className="text-sm text-gray-600">Distribution by weight</p>
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  </div>
                </div>

                <div id="pie-chart"></div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">All Time Data</span>
                    <a
                      href="/Reports"
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center">
                      View Details
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Dispositions Donut Chart */}
              <div className="bg-white rounded-2xl shadow-lg shadow-gray-100 border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Dispositions</h3>
                    <p className="text-sm text-gray-600">Processing methods</p>
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  </div>
                </div>

                <div id="donut-chart"></div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">All Time Data</span>
                    <a
                      href="/Reports"
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center">
                      Analysis
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}