import React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function ParticipantsByCoutry({ data }) {
  const chartData = Array.isArray(data)
    ? data
        .map(item => ({ country: item.country, participants: Number(item.count ?? item.participants ?? 0) }))
        .filter(item => item.participants > 0)
    : [];

  return (
    <div className="w-full">
      {/* Removed max-w-2xl and blue border so it spans full width naturally */}
      <div className="bg-white p-6 border border-[#D8E2EC] rounded-lg w-full">
        <h2 className="text-lg font-bold text-[#101820] mb-8">
          Participants By Country
        </h2>

        {/* Gave it a nice 300px height for the wide layout */}
        <div className="h-[250px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false} // Set to false to match cleaner dashboard UI
                  stroke="#D8E2EC"
                />

                <XAxis
                  dataKey="country"
                  axisLine={{ stroke: '#A4B1BE' }}
                  tickLine={false}
                  tick={{ fill: '#596776', fontSize: 12, dy: 10 }}
                />

                {/* Removed domain and ticks so it automatically scales up to the live data */}
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
                  fill="#004B8D"
                  isAnimationActive={false}
                  barSize={40}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm font-medium text-[#596776]">
              No country data yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ParticipantsByCoutry;
