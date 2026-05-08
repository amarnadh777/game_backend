import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import axiosInstance from '../../api/axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Note: Changed 'all_time' to 'all' to match your Dashboard's global values perfectly.
const quickFilters = [
  { label: 'All time', value: 'all_time' },
  { label: 'Today', value: 'today' },
  { label: 'This week', value: 'this_week' },
  { label: 'Last week', value: 'last_week' },
  { label: 'This month', value: 'this_month' },
  { label: 'Last month', value: 'last_month' },
];

// 1. Accept the global props from the Dashboard
function ParticipantsByCountry({ activeFilter: globalFilter, customRange: globalCustomRange }) {
  const [activeFilter, setActiveFilter] = useState(quickFilters[0]); 
  const [showFilter, setShowFilter]         = useState(false);
  const [fromDate, setFromDate]             = useState('');
  const [toDate, setToDate]                 = useState('');
  const [chartData, setChartData]           = useState([]);
  const [loading, setLoading]               = useState(false);

  // HELPER: Convert YYYY-MM-DD to DD/MM/YYYY for the button label
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
      const response = await axiosInstance.get(`/admin/countries-chart`, {
        params: {
          filter: filterValue,
          ...(filterValue === 'custom' && { startDate: start, endDate: end })
        }
      });

      if (response.data.success) {
        const formatted = response.data.data.map(item => ({
          country: item.country,
          participants: item.count
        }));
        setChartData(formatted);
      }
    } catch (error) {
      console.error("Failed to fetch country data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SYNC GLOBAL FILTER -> LOCAL FILTER
  // ==========================================
  // This useEffect listens to the Dashboard. If the Dashboard filter changes,
  // it updates this chart's local state and fetches the new data.
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
      // Find the matching quick filter object
      const matchedFilter = quickFilters.find(f => f.value === globalFilter) || quickFilters[0];
      setActiveFilter(matchedFilter);
      setFromDate('');
      setToDate('');
      fetchGraphData(matchedFilter.value);
    }
  }, [globalFilter, globalCustomRange]); // Run every time global props change


  // ==========================================
  // LOCAL HANDLERS (Overrides Global)
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
    fetchGraphData(filterObj.value); // Fetch locally
  };

  const handleClearFilter = (e) => {
    e.stopPropagation();
    setFromDate('');
    setToDate('');
    const defaultFilter = quickFilters[0];
    setActiveFilter(defaultFilter);
    fetchGraphData(defaultFilter.value); // Reset locally to 'all'
  };

  const isFiltered = activeFilter.value !== 'all';

  return (
    <div className="w-full">
      <div className="bg-white p-6 border border-gray-200 rounded-sm w-full">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-bold text-gray-900">Participants By Country</h2>

          <div className="relative">
            {/* Filter button */}
            <button
              onClick={() => setShowFilter(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs transition-colors ${
                isFiltered
                  ? 'bg-[#2840B6] text-white border-[#2840B6]'
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
                  className="ml-1 opacity-80 hover:opacity-100 font-bold cursor-pointer"
                >
                  ×
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {showFilter && (
              <div className="absolute right-0 top-9 bg-white border border-gray-100 rounded-xl shadow-lg z-10 p-3 min-w-[200px]">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2 px-1">Quick select</p>
                <div className="flex flex-col gap-1 mb-3">
                  {quickFilters.map(f => (
                    <button
                      key={f.value}
                      onClick={() => handleQuickSelect(f)}
                      className={`text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        activeFilter.value === f.value
                          ? 'bg-[#eef0fb] text-[#2840B6] font-medium'
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
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 outline-none focus:border-[#2840B6] w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 px-1">To</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={e => setToDate(e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 outline-none focus:border-[#2840B6] w-full"
                    />
                  </div>
                  <button
                    onClick={handleApplyCustom}
                    disabled={!fromDate || !toDate}
                    className="mt-1 w-full bg-[#2840B6] text-white text-xs py-1.5 rounded-lg disabled:opacity-40 hover:bg-[#1e3294]"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart Area */}
        <div className="h-[250px] w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-400">
              Loading country statistics...
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-400">
               {activeFilter.value === 'custom' && (!fromDate || !toDate) 
                ? 'Select a date range and press Apply' 
                : 'No data found for this period.'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="country"
                  axisLine={{ stroke: '#9ca3af' }}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12, dy: 10 }}
                />
                <YAxis
                  axisLine={{ stroke: '#9ca3af' }}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value} Participants`, 'Count']}
                />
                <Bar
                  dataKey="participants"
                  fill="#2840B6"
                  barSize={40}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  );
}

export default ParticipantsByCountry;