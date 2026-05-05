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

  const formatVehicleName = (name) => (
    typeof name === 'string'
      ? name.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase())
      : 'Unknown'
  );

  const chartData = Array.isArray(data)
    ? data
        .map(item => ({ name: formatVehicleName(item.name), value: Number(item.count ?? item.value ?? 0) }))
        .filter(item => item.value > 0)
    : [];

  const COLORS = ['#004B8D', '#FFD100', '#101820', '#28B67A', '#E05A47', '#7A8794', '#71B7D5']; 

  return (
    <div className="bg-white p-6 rounded-lg border border-[#D8E2EC] shadow-sm w-full h-full flex flex-col">
      <h2 className="text-[15px] font-bold text-[#101820] mb-6">
        Most Played Vehicles
      </h2>
      
      {/* Container must have a height */}
      <div className="flex-grow min-h-[250px] w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%" // Centers the pie horizontally
                cy="50%" // Centers the pie vertically
                outerRadius={90} // Size of the pie
                innerRadius={0} // Keep at 0 for a solid pie chart (increase it if you want a Donut chart)
                dataKey="value"
                isAnimationActive={false}
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
        ) : (
          <div className="h-full min-h-[250px] flex items-center justify-center text-sm font-medium text-[#596776]">
            No vehicle data yet
          </div>
        )}
      </div>
    </div>
  );
};

export default MostPlayedVehiclesChart;
