import React, { useEffect, useState } from 'react';
import { Users, UserPlus, PlaySquare, CarFront } from 'lucide-react';
import StatCard from '../components/dashboard/StatsCard'; 
import ParticipantsChart from '../components/dashboard/ParticipantsChart';
import TimeBarChart from '../components/dashboard/TimeBarChart';
import PieChartComponent from '../components/dashboard/PieChartComponent';
import ParticipantsByCoutry from '../components/dashboard/ParticipantsByCoutry';
import axios from 'axios';

function Dashboard() {

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(()=>{
  

const fetchData = async() => {

  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/analytics`);
    if(response.status === 200){
      setDashboardData(response.data?.data ?? null);
    }
  } catch (error) {
    console.error("API Connection Error:", error);
  } finally {
    setLoading(false);
  }
}

fetchData();

},[])

  const formatCount = (value) => {
    const numericValue = Number(value ?? 0);
    return Number.isFinite(numericValue) ? numericValue.toLocaleString() : "0";
  };

  const mostPlayedVehicle = dashboardData?.mostUsedVehicle
    ? dashboardData.mostUsedVehicle.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : "No data";

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#F4F8FC]">
        <div className="w-12 h-12 border-4 border-[#004B8D] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 md:p-8 bg-[#F4F8FC] min-h-screen flex flex-col gap-6">
      
      {/* Page Title added from your screenshot */}
      <h1 className="text-xl md:text-2xl font-bold text-[#101820] tracking-wide mb-2">
        Welcome To Kanoo Daily Rental
      </h1>

      {/* -----------------------------
          ROW 1: Stat Cards (4 Columns)
          ----------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Total number of participants"
          value={formatCount(dashboardData?.totalParticipants)}
          icon={Users}
        />
        <StatCard 
          title="Total number of registration"
          value={formatCount(dashboardData?.totalUsers)}
          icon={UserPlus}
        />
        <StatCard 
          title="Game Replay"
          value={formatCount(dashboardData?.totalReplays)}
          icon={PlaySquare}
        />
        <StatCard 
          title="Most Played Vehicle"
          value={mostPlayedVehicle}
          icon={CarFront}
        />
      </div>

      {/* -----------------------------
          ROW 2: Middle Charts (3 Columns)
          ----------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-fr">
        <ParticipantsChart data={dashboardData?.weeklyGraphData} />
        <TimeBarChart data={dashboardData?.timingGraphData} />
        <PieChartComponent data={dashboardData?.mostPlayedVehicles} />
      </div>

      {/* -----------------------------
          ROW 3: Bottom Chart (Full Width)
          ----------------------------- */}
      <div className="w-full">
        <ParticipantsByCoutry data={dashboardData?.participantsByCountry} />
      </div>

    </div>
  );
}

export default Dashboard;
