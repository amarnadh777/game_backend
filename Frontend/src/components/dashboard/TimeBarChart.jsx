import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Tooltip
} from 'recharts';

const TimeBarChart = ({ data: propData }) => {
  const data = propData && propData.length > 0 ? propData : [
    { time: '8am', participants: 45 },
    { time: '10am', participants: 72 },
    { time: '12pm', participants: 85 },
    { time: '2pm', participants: 95 },
    { time: '4pm', participants: 78 },
    { time: '6pm', participants: 55 },
    { time: '8pm', participants: 35 },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm w-full h-full flex flex-col">
      <h2 className="text-[15px] font-bold text-gray-800 mb-6">
        Participants Timing
      </h2>
      
      {/* Chart Container - Needs a fixed height */}
      <div className="flex-grow min-h-[250px] w-full">
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
              fill="#28B67A" // Solid gray to match the design
              radius={[2, 2, 0, 0]} // Slightly rounds the top corners of the bars
              barSize={32} // Controls the width of the bars
            />
          
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TimeBarChart;