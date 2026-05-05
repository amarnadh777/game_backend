import React, { useState } from 'react';

const StatCard = ({ title, value, trend, icon: Icon, onTimeFilterChange }) => {
  // 1. Add local state to track the selected timeframe
  const [timeFilter, setTimeFilter] = useState('yesterday');

  // 2. Handle the change (and optionally pass it up to a parent component to fetch new data)
  const handleFilterChange = (e) => {
    const newValue = e.target.value;
    setTimeFilter(newValue);
    if (onTimeFilterChange) {
      onTimeFilterChange(newValue); // Tell the parent component to update the main 'value' and 'trend'
    }
  };

  return (
    <div className="bg-white p-5 xl:p-6 rounded-xl shadow-sm flex justify-between items-start transition-all hover:shadow-md h-[130px]">
      
      <div className="flex flex-col justify-between h-full w-full min-w-0 pr-2">
        
        <h3 className="text-[13px] font-semibold text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">
          {title}
        </h3>
        
        <p className="text-[28px] xl:text-[28px] font-extrabold text-[#0A3D81] leading-none my-auto truncate">
          {value}
        </p>
        
        {typeof trend === 'number' ? (
          // 3. Changed this from <p> to a flex container so the text and dropdown sit side-by-side
          <div className={`flex items-center text-[12px] font-medium truncate ${
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            <span className="mr-1">
              {trend > 0 ? '↑ ' : trend < 0 ? '↓ ' : ''}{Math.abs(trend)}% from
            </span>
            
            {/* 4. The native dropdown, styled to look like inline text with a tiny arrow */}
            <select
              value={timeFilter}
              onChange={handleFilterChange}
              className="bg-transparent border-none outline-none cursor-pointer font-bold hover:opacity-80 transition-opacity appearance-none pr-3"
              style={{ 
                // Adds a tiny custom chevron arrow to the right of the text
                backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right center',
                backgroundSize: '10px'
              }}
            >
              <option value="yesterday">Yesterday</option>
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
            </select>
          </div>
        ) : (
          <p className="text-[12px] font-medium text-transparent truncate select-none">
            _
          </p>
        )}
        
      </div>

      <div className="w-[54px] h-[42px] bg-gradient-to-r from-[#FDE57E] to-[#F1C82A] rounded-[10px] flex items-center justify-center shadow-sm text-slate-800 shrink-0">
        {Icon && <Icon size={22} strokeWidth={1.5} />}
      </div>
      
    </div>
  );
};

export default StatCard;