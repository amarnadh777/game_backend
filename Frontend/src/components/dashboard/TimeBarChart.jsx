import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip
} from 'recharts';
import axiosInstance from '../../api/axios'; // Adjust path if needed

const quickFilters = [
  { label: 'All time', value: 'all' }, 
  { label: 'Today', value: 'today' },
  { label: 'This week', value: 'this_week' },
  { label: 'Last week', value: 'last_week' },
  { label: 'This month', value: 'this_month' },
  { label: 'Last month', value: 'last_month' },
];

const TimeBarChart = ({ activeFilter: globalFilter, customRange: globalCustomRange }) => {
  const [showFilter, setShowFilter] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [activeFilter, setActiveFilter] = useState(quickFilters[0]);

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const fetchGraphData = async (filterValue, start = '', end = '') => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/admin/timing-chart`, {
        params: {
          filter: filterValue,
          ...(filterValue === 'custom' && { startDate: start, endDate: end })
        }
      });

      if (response.data.success) {
        setChartData(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch timing data:", error);
    } finally {
      setLoading(false);
    }
  };

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
      const matchedFilter = quickFilters.find(f => f.value === globalFilter) || quickFilters[0];
      setActiveFilter(matchedFilter);
      setFromDate('');
      setToDate('');
      fetchGraphData(matchedFilter.value);
    }
  }, [globalFilter, globalCustomRange]);

  const handleQuickSelect = (filterObj) => {
    setActiveFilter(filterObj);
    setShowFilter(false);
    fetchGraphData(filterObj.value);
  };

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

  const handleClearFilter = (e) => {
    e.stopPropagation();
    setFromDate('');
    setToDate('');
    const defaultFilter = quickFilters[0];
    setActiveFilter(defaultFilter);
    fetchGraphData(defaultFilter.value);
  };

  const isFiltered = activeFilter.value !== 'all';

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[15px] font-bold text-gray-800">Participants Timing</h2>

        <div className="relative">
          <button
            onClick={() => setShowFilter(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs transition-colors ${
              isFiltered
                ? 'bg-[#28B67A] text-white border-[#28B67A]'
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
                        ? 'bg-[#edfaf4] text-[#28B67A] font-medium'
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
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 outline-none focus:border-[#28B67A] w-full"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 px-1">To</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 outline-none focus:border-[#28B67A] w-full"
                  />
                </div>
                <button
                  onClick={handleApplyCustom}
                  disabled={!fromDate || !toDate}
                  className="mt-1 w-full bg-[#28B67A] text-white text-xs py-1.5 rounded-lg disabled:opacity-40 hover:bg-[#219a66]"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-grow min-h-[250px] w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-400">
            Loading chart data...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-400 text-center px-4">
            {activeFilter.value === 'custom' && (!fromDate || !toDate) 
              ? 'Select a date range and press Apply' 
              : 'No activity found for this period.'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12, dy: 10 }}
              />
              
              <YAxis
                allowDecimals={false} // Prevents decimals like 0.5, 1.5
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              
              <Tooltip
                cursor={{ fill: '#f3f4f6' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(val) => [`${val} Participants`, 'Count']}
              />
              
              {/* Premium Styled Bar with Rounded Corners */}
              <Bar 
                dataKey="participants" 
                fill="#28B67A" 
                radius={[4, 4, 0, 0]} 
                barSize={32} 
              />
              
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default TimeBarChart;
