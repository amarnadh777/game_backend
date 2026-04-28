import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';

const MostPlayedVehiclesChart = ({ data }) => {

  const chartData = data && data.length > 0 ? data.map(item => ({ name: item.name, value: item.count })) : [
    { name: 'Jetour G700', value: 60 },
    { name: 'Lexus 600', value: 25 },
    { name: 'Land Cruiser 300', value: 15 },
  ];

  // The extended grayscale colors from your mockup, added extra colors to support more items
  const COLORS = ['#28B67A', '#F3C300', '#0A3D81', '#E74C3C', '#9B59B6', '#1ABC9C', '#34495E']; 

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm w-full h-full flex flex-col">
      <h2 className="text-[15px] font-bold text-gray-800 mb-6">
        Most Played Vehicles
      </h2>
      
      {/* Container must have a height */}
      <div className="flex-grow min-h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%" // Centers the pie horizontally
              cy="50%" // Centers the pie vertically
              outerRadius={90} // Size of the pie
              innerRadius={0} // Keep at 0 for a solid pie chart (increase it if you want a Donut chart)
              dataKey="value"
              stroke="#ffffff" // Adds a nice thin white line between slices
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            
            {/* Optional Tooltip for hovering */}
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />

            {/* The Legend at the bottom matching your design */}
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle" // Makes the legend markers tiny circles
              wrapperStyle={{ fontSize: '12px', color: '#4b5563' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MostPlayedVehiclesChart;