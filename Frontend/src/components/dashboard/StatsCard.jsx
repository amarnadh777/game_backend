import React from 'react';

const StatCard = ({ title, value, trend, icon: Icon }) => {
  return (
    <div className="bg-white p-5 xl:p-6 rounded-lg border border-[#D8E2EC] shadow-sm flex justify-between items-start transition-all hover:shadow-md h-[130px]">
      
      {/* FIXED: Added min-w-0 here! 
        This stops long text from breaking the Flexbox layout.
      */}
      <div className="flex flex-col justify-between h-full w-full min-w-0 pr-2">
        
        <h3 className="text-[13px] font-semibold text-[#101820] leading-tight min-h-[34px]">
          {title}
        </h3>
        
        {/* Added 'truncate' here just in case the value gets too long too! */}
        <p className="text-[24px] xl:text-[26px] font-extrabold text-[#004B8D] leading-tight my-auto break-words">
          {value}
        </p>
        
        <p className="text-[12px] font-medium text-[#004B8D] truncate">
          {trend}
        </p>
        
      </div>

      {/* Kept shrink-0 so the icon box never gets squished */}
      <div className="w-[54px] h-[42px] bg-[#FFD100] rounded-lg flex items-center justify-center shadow-sm text-[#101820] shrink-0">
        {Icon && <Icon size={22} strokeWidth={1.5} />}
      </div>
      
    </div>
  );
};

export default StatCard;
