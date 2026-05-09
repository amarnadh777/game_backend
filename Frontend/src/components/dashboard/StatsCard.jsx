import React from 'react';

const StatCard = ({ title, value, trend, trendLabel, icon: Icon }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-start transition-all hover:shadow-md h-[110px] border border-gray-50 overflow-hidden">
      
      <div className="flex flex-col justify-between h-full w-full min-w-0 pr-3">
        
        {/* Ultra-compact title */}
        <h3 className="text-[11px] font-semibold text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">
          {title}
        </h3>
        
        {/* Scaled down main value to prevent overflow when sidebar pushes it */}
        <p className="text-[20px] font-extrabold text-[#004B8D] leading-none my-auto truncate">
          {value}
        </p>
        
        {typeof trend === 'number' ? (
          /* Ultra-compact trend text */
          <div className="flex items-center text-[10px] font-medium truncate mt-1 w-full">
            {/* The Percentage & Arrow */}
            <span className={`mr-1 shrink-0 ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'}`}>
              {trend > 0 ? '↑ ' : trend < 0 ? '↓ ' : ''}{Math.abs(trend)}%
            </span>
            
            {/* The Dynamic Trend Label from Backend */}
            <span className="text-gray-400 truncate">
              {trendLabel}
            </span>
          </div>
        ) : (
          <p className="text-[10px] font-medium text-transparent truncate select-none mt-1">
            _
          </p>
        )}
        
      </div>

      {/* Scaled down Icon Container */}
      <div className="w-[44px] h-[40px] bg-[#FFD100] rounded-lg flex items-center justify-center shadow-sm text-[#004B8D] shrink-0">
        {Icon && <Icon size={18} strokeWidth={2.5} />}
      </div>
      
    </div>
  );
};

export default StatCard;
