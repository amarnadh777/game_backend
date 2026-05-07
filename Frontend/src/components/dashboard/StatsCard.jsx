import React from 'react';

const StatCard = ({ title, value, trend, trendLabel, icon: Icon }) => {
  return (
    <div className="bg-white p-5 xl:p-6 rounded-xl shadow-sm flex justify-between items-start transition-all hover:shadow-md h-[130px] border border-gray-50">
      
      <div className="flex flex-col justify-between h-full w-full min-w-0 pr-2">
        
        <h3 className="text-[13px] font-semibold text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">
          {title}
        </h3>
        
        <p className="text-[28px] xl:text-[28px] font-extrabold text-[#0A3D81] leading-none my-auto truncate">
          {value}
        </p>
        
        {typeof trend === 'number' ? (
          <div className="flex items-center text-[12px] font-medium truncate mt-1">
            {/* The Percentage & Arrow */}
            <span className={`mr-1.5 ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'}`}>
              {trend > 0 ? '↑ ' : trend < 0 ? '↓ ' : ''}{Math.abs(trend)}%
            </span>
            
            {/* The Dynamic Trend Label from Backend */}
            <span className="text-gray-400">
              {trendLabel}
            </span>
          </div>
        ) : (
          <p className="text-[12px] font-medium text-transparent truncate select-none mt-1">
            _
          </p>
        )}
        
      </div>

      {/* Icon Container */}
      <div className="w-[54px] h-[42px] bg-gradient-to-r from-[#FDE57E] to-[#F1C82A] rounded-[10px] flex items-center justify-center shadow-sm text-slate-800 shrink-0">
        {Icon && <Icon size={22} strokeWidth={1.5} />}
      </div>
      
    </div>
  );
};

export default StatCard;