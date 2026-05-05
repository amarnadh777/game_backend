import React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function ParticipantsByCoutry({ data }) {
  const defaultData = [
    { country: 'UAE', participants: 450 },
    { country: 'Ireland', participants: 150 },
    { country: 'India', participants: 380 },
    { country: 'Switzerland', participants: 60 },
    { country: 'USA', participants: 300 },
    { country: 'Germany', participants: 220 },
    { country: 'Japan', participants: 340 },
    { country: 'South Korea', participants: 480 },
    { country: 'France', participants: 250 },
    { country: 'Brazil', participants: 240 },
  ];

  const chartData = data && data.length > 0 
    ? data.map(item => ({ country: item.country, participants: item.count }))
    : defaultData;

  return (
    <div className="w-full">
      {/* Removed max-w-2xl and blue border so it spans full width naturally */}
      <div className="bg-white p-6 border border-[#D8E2EC] rounded-lg w-full">
        <h2 className="text-lg font-bold text-[#101820] mb-8">
          Participants By Country
        </h2>

        {/* Gave it a nice 300px height for the wide layout */}
        <div className="h-[250px] w-full">
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

              {/* Removed domain and ticks so it automatically scales up to 480! */}
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
        </div>
      </div>
    </div>
  );
}

export default ParticipantsByCoutry;
