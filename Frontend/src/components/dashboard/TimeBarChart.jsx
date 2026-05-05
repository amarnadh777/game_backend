import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Tooltip
} from 'recharts';

const TimeBarChart = ({ data: propData }) => {
  const data = Array.isArray(propData) ? propData : [];
  const hasData = data.some(item => Number(item.participants) > 0);

  return (
    <div className="bg-white p-6 rounded-lg border border-[#D8E2EC] shadow-sm w-full h-full flex flex-col">
      <h2 className="text-[15px] font-bold text-[#101820] mb-6">
        Participants Timing
      </h2>
      
      {/* Chart Container - Needs a fixed height */}
      <div className="flex-grow min-h-[250px] w-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
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
              
            <XAxis 
                dataKey="time" 
                axisLine={{ stroke: '#A4B1BE' }}
                tickLine={false}
                tick={{ fill: '#596776', fontSize: 12, dy: 10 }}
              />

             <YAxis 
                axisLine={{ stroke: '#A4B1BE' }}
                tickLine={false}
                tick={{ fill: '#596776', fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: '#F4F8FC' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />

              <Bar
                dataKey="participants" 
                fill="#FFD100"
                isAnimationActive={false}
                radius={[2, 2, 0, 0]} // Slightly rounds the top corners of the bars
                barSize={32} // Controls the width of the bars
              />
            
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full min-h-[250px] flex items-center justify-center text-sm font-medium text-[#596776]">
            No timing data yet
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeBarChart;
