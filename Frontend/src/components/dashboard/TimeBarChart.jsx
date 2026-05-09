import React, { useState } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Tooltip
} from 'recharts';

// Mock datasets for demonstration
const MOCK_DATA = {
  today: [
    { time: '8am', participants: 45 },
    { time: '10am', participants: 72 },
    { time: '12pm', participants: 85 },
    { time: '2pm', participants: 95 },
    { time: '4pm', participants: 78 },
    { time: '6pm', participants: 55 },
    { time: '8pm', participants: 35 },
  ],
  '7days': [
    { time: '8am', participants: 310 },
    { time: '10am', participants: 450 },
    { time: '12pm', participants: 580 },
    { time: '2pm', participants: 620 },
    { time: '4pm', participants: 490 },
    { time: '6pm', participants: 380 },
    { time: '8pm', participants: 210 },
  ],
  '30days': [
    { time: '8am', participants: 1200 },
    { time: '10am', participants: 1850 },
    { time: '12pm', participants: 2400 },
    { time: '2pm', participants: 2650 },
    { time: '4pm', participants: 2100 },
    { time: '6pm', participants: 1500 },
    { time: '8pm', participants: 900 },
  ]
};

const TimeBarChart = ({ data: propData, onFilterChange }) => {
  const [dateFilter, setDateFilter] = useState('today');

  // Handle filter changes
  const handleFilterChange = (e) => {
    const newValue = e.target.value;
    setDateFilter(newValue);
    
    // If you need to trigger a custom date picker modal, handle it here
    if (newValue === 'custom') {
      console.log('Open custom date picker modal');
    }

    // Call parent handler if provided (to fetch real API data)
    if (onFilterChange) {
      onFilterChange(newValue);
    }
  };

  // Determine which data to show: 
  // 1. propData (if passed from parent)
  // 2. Mock data based on filter (for this demo)
  // 3. Fallback to today's mock data
  const displayData = propData && propData.length > 0 
    ? propData 
    : MOCK_DATA[dateFilter] || MOCK_DATA.today;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm w-full h-full flex flex-col">
      {/* Header with Title and Filter */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[15px] font-bold text-gray-800">
          Participants Timing
        </h2>
        
        {/* Date Filter Dropdown */}
        <select
          value={dateFilter}
          onChange={handleFilterChange}
          className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#28B67A] focus:border-transparent cursor-pointer transition-all"
        >
          <option value="today">Today</option>
          <option value="7days">Last 7 days</option>
          <option value="30days">Last 30 days</option>
          <option value="custom">Custom range</option>
        </select>
      </div>
      
      {/* Chart Container - Needs a fixed height */}
      <div className="flex-grow min-h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={displayData}
            margin={{ top: 5, right: 20, left: -20, bottom: 0 }}
          >
            {/* Dashed background grid */}
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={true} 
              horizontal={true} 
              stroke="#e5e7eb" 
            />
            
            <XAxis 
              dataKey="time" 
              axisLine={{ stroke: '#9ca3af' }}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12, dy: 10 }}
            />

            <YAxis 
              axisLine={{ stroke: '#9ca3af' }}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            
            <Tooltip
              cursor={{ fill: '#f3f4f6' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />

            <Bar
              dataKey="participants" 
              fill="#28B67A" 
              radius={[2, 2, 0, 0]} 
              barSize={32} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TimeBarChart;
