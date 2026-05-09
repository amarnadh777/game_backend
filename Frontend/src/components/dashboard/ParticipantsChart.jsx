import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';

const ParticipantsChart = ({ data: propData }) => {
  const data = Array.isArray(propData) ? propData : [];
  const hasData = data.some(item => Number(item.participants) > 0);

  return (
    <div className="bg-white p-6 rounded-lg border border-[#D8E2EC] shadow-sm w-full h-full flex flex-col">
      <h2 className="text-[15px] font-bold text-[#101820] mb-6">
        Participants Count
      </h2>
      
      {/* Chart Container - Needs a fixed height */}
      <div className="flex-grow min-h-[250px] w-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 20, left: -20, bottom: 0 }}
            >
              {/* Dashed background grid */}
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={true} 
                horizontal={true} 
                stroke="#D8E2EC" 
              />
              
              {/* X-Axis (Days) */}
              <XAxis 
                dataKey="day" 
                axisLine={{ stroke: '#A4B1BE' }}
                tickLine={{ stroke: '#A4B1BE' }}
                tick={{ fill: '#596776', fontSize: 13, dy: 10 }}
              />
              
              {/* Y-Axis (Numbers) */}
              <YAxis 
                axisLine={{ stroke: '#A4B1BE' }}
                tickLine={{ stroke: '#A4B1BE' }}
                tick={{ fill: '#596776', fontSize: 13 }}
              />
              
              {/* The Line itself */}
              <Line 
                type="monotone" // This creates the smooth curved line
                dataKey="participants" 
                stroke="#004B8D" 
                strokeWidth={2}
                isAnimationActive={false} // Turn to true if you want drawing animation
                dot={{ 
                  r: 4, 
                  stroke: '#004B8D', 
                  strokeWidth: 2, 
                  fill: '#ffffff' 
                }} 
                activeDot={{ r: 6, fill: '#FFD100', stroke: 'none' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full min-h-[250px] flex items-center justify-center text-sm font-medium text-[#596776]">
            No participant data yet
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantsChart;
