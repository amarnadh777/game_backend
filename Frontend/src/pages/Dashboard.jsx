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
          console.log(response.data); 
          setDashboardData(response.data.data);
        }
      } catch (error) {
        console.error("API Connection Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  },[])

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#F4F8FC]">
        <div className="w-12 h-12 border-4 border-[#004B8D] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full p md:p-8 bg-[#EBF5FF] min-h-screen flex flex-col gap-6">
      
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-wide mb-2">
        Welcome To Kanoo Daily Rental
      </h1>

      {/* -----------------------------
          ROW 1: Stat Cards (4 Columns)
          ----------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Total number of participants"
          value={dashboardData !== null ? dashboardData.totalParticipants : "1400"}
          trend={dashboardData !== null ? dashboardData.participantGrowth : 0} // ✅ Replaced hardcoded -2
          icon={Users}
        />
        <StatCard 
          title="Total number of registration"
          value={dashboardData !== null ? dashboardData.totalUsers : "1860"}
          trend={dashboardData !== null ? dashboardData.registrationGrowth : 0} // ✅ Replaced string
          icon={UserPlus}
        />
        <StatCard 
          title="Game Replay"
          value={dashboardData !== null ? dashboardData.totalReplays : "370"}
          trend={dashboardData !== null ? dashboardData.replayGrowth : 0} // ✅ Replaced string
          icon={PlaySquare}
        />
        <StatCard 
          title="Most Played Vehicle"
          value={dashboardData !== null && dashboardData.mostUsedVehicle ? dashboardData.mostUsedVehicle.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "Jetour G700"}
          trend={null} // ✅ Set to null so the StatCard hides the trend text completely for the vehicle
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
