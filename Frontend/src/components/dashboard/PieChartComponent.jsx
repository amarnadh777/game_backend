import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip
} from 'recharts';
import axiosInstance from '../../api/axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const COLORS = ['#28B67A', '#F3C300', '#0A3D81', '#E74C3C', '#9B59B6', '#1ABC9C', '#34495E'];

const CAR_NAME_MAP = {
  "icaur_v27_royal": "Icaur V27 Royal",
  "lexus_lx_600_urban": "Lexus LX 600 Urban",
  "jetour_g700": "Jetour G700",
  "deepal_g318": "Deepal G318",
  "toyota_land_cruiser_gx_r_3_5l": "Toyota Land Cruiser GX-R 3.5L"
};

// Standardized values to match Dashboard ('all' instead of 'all_time')
const quickFilters = [
  { label: 'All time', value: 'all_time' },
  { label: 'Today', value: 'today' },
  { label: 'This week', value: 'this_week' },
  { label: 'Last week', value: 'last_week' },
  { label: 'This month', value: 'this_month' },
  { label: 'Last month', value: 'last_month' },
];

const MostPlayedVehiclesChart = ({ activeFilter: globalFilter, customRange: globalCustomRange }) => {
  const [activeFilter, setActiveFilter] = useState(quickFilters[0]); 
  const [showFilter, setShowFilter]         = useState(false);
  const [fromDate, setFromDate]             = useState('');
  const [toDate, setToDate]                 = useState('');
  const [chartData, setChartData]           = useState([]);
  const [loading, setLoading]               = useState(false);

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // ==========================================
  // API FETCH LOGIC
  // ==========================================
  const fetchGraphData = async (filterValue, start = '', end = '') => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/admin/vehicles-chart`, {
        params: {
          filter: filterValue,
          ...(filterValue === 'custom' && { startDate: start, endDate: end })
        }
      });

      if (response.data.success) {
        const formattedData = response.data.data
          .filter(item => item.count > 0)
          .map(item => ({ 
            // Map the raw string to the readable name, fallback to original if not in map
            name: CAR_NAME_MAP[item.name] || item.name, 
            value: item.count 
          }));
          
        setChartData(formattedData);
      }
    } catch (error) {
      console.error("Failed to fetch vehicle data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SYNC WITH GLOBAL DASHBOARD FILTER
  // ==========================================
  useEffect(() => {
    if (!globalFilter) return;

    if (globalFilter === 'custom') {
      const gFrom = globalCustomRange?.from || '';
      const gTo = globalCustomRange?.to || '';
      
      setFromDate(gFrom);
      setToDate(gTo);

      if (gFrom && gTo) {
        const displayRange = `${formatDateForDisplay(gFrom)} - ${formatDateForDisplay(gTo)}`;
        setActiveFilter({ label: displayRange, value: 'custom' });
        fetchGraphData('custom', gFrom, gTo);
      }
    } else {
      // Find the filter object to keep the UI label in sync
      const matchedFilter = quickFilters.find(f => f.value === globalFilter) || quickFilters[0];
      setActiveFilter(matchedFilter);
      setFromDate('');
      setToDate('');
      fetchGraphData(matchedFilter.value);
    }
  }, [globalFilter, globalCustomRange]);

  // ==========================================
  // LOCAL CLICK HANDLERS (Overrides Global)
  // ==========================================
  const handleApplyCustom = () => {
    if (!fromDate || !toDate) return;
    if (new Date(fromDate) > new Date(toDate)) {
      alert("Start date cannot be after end date");
      return;
    }
    
    const displayRange = `${formatDateForDisplay(fromDate)} - ${formatDateForDisplay(toDate)}`;
    setActiveFilter({ label: displayRange, value: 'custom' });
    setShowFilter(false);
    fetchGraphData('custom', fromDate, toDate); 
  };

  const handleQuickSelect = (filterObj) => {
    setActiveFilter(filterObj);
    setShowFilter(false);
    fetchGraphData(filterObj.value);
  };

  const handleClearFilter = (e) => {
    e.stopPropagation();
    setFromDate('');
    setToDate('');
    const defaultFilter = quickFilters[0];
    setActiveFilter(defaultFilter);
    setShowFilter(false);
    fetchGraphData(defaultFilter.value);
  };

  const isFiltered = activeFilter.value !== 'all';

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm w-full h-full flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
     <h2 className="text-[15px] font-bold text-gray-800">Vehicle Usage Distribution</h2>

        <div className="relative">
          <button
            onClick={() => setShowFilter(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs transition-colors ${
              isFiltered
                ? 'bg-[#10b3f0] text-white border-[#10b3f0]'
                : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            {activeFilter.label}
            {isFiltered && (
              <span
                onClick={handleClearFilter}
                className="ml-1 text-white opacity-80 hover:opacity-100 font-bold"
              >
                ×
              </span>
            )}
          </button>

          {showFilter && (
            <div className="absolute right-0 top-9 bg-white border border-gray-100 rounded-xl shadow-lg z-20 p-3 min-w-[200px]">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2 px-1">Quick select</p>
              <div className="flex flex-col gap-1 mb-3">
                {quickFilters.map(f => (
                  <button
                    key={f.value}
                    onClick={() => handleQuickSelect(f)}
                    className={`text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      activeFilter.value === f.value
                        ? 'bg-[#e8f7fd] text-[#10b3f0] font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="border-t border-gray-100 mb-3" />

              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2 px-1">Custom range</p>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 px-1">From</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 outline-none focus:border-[#10b3f0] w-full"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 px-1">To</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 outline-none focus:border-[#10b3f0] w-full"
                  />
                </div>
                <button
                  onClick={handleApplyCustom}
                  disabled={!fromDate || !toDate}
                  className="mt-1 w-full bg-[#10b3f0] text-white text-xs py-1.5 rounded-lg disabled:opacity-40"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-grow min-h-[250px] w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-400">
             Loading vehicle data...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-400 text-center px-4">
             {activeFilter.value === 'custom' && (!fromDate || !toDate) 
              ? 'Select a date range and press Apply' 
              : 'No vehicles played during this period.'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={0}
                dataKey="value"
                stroke="#ffffff"
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value, name) => [`${value} `, name]} 
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', color: '#4b5563' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
};

export default MostPlayedVehiclesChart;