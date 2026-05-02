import React from 'react';

const StatCard = ({ title, value, trend, icon: Icon }) => {
  return (
    <div className="bg-white p-5 xl:p-6 rounded-xl shadow-sm flex justify-between items-start transition-all hover:shadow-md h-[130px]">
      
      {/* FIXED: Added min-w-0 here! 
        This stops long text from breaking the Flexbox layout.
      */}
      <div className="flex flex-col justify-between h-full w-full min-w-0 pr-2">
        
        <h3 className="text-[13px] font-semibold text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">
          {title}
        </h3>
        
        {/* Added 'truncate' here just in case the value gets too long too! */}
        <p className="text-[28px] xl:text-[28px] font-extrabold text-[#0A3D81] leading-none my-auto truncate">
          {value}
        </p>
        
        {/* ONLY TEXT COLOR CHANGES BASED ON TREND */}
        {typeof trend === 'number' ? (
          <p className={`text-[12px] font-medium truncate ${
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            {trend > 0 ? '↑ ' : trend < 0 ? '↓ ' : ''}{Math.abs(trend)}% from yesterday
          </p>
        ) : (
          <p className="text-[12px] font-medium text-transparent truncate select-none">
            _ {/* Invisible spacer to keep layout from jumping on cards without a trend */}
          </p>
        )}
        
      </div>

      {/* Kept shrink-0 so the icon box never gets squished */}
      <div className="w-[54px] h-[42px] bg-gradient-to-r from-[#FDE57E] to-[#F1C82A] rounded-[10px] flex items-center justify-center shadow-sm text-slate-800 shrink-0">
        {Icon && <Icon size={22} strokeWidth={1.5} />}
      </div>
      
    </div>
  );
};

export default StatCard;