import React, { useEffect, useState, useRef } from 'react';
import { Users, UserPlus, PlaySquare, CarFront, Filter } from 'lucide-react';
import StatCard from '../components/dashboard/StatsCard';
import ParticipantsChart from '../components/dashboard/ParticipantsChart';
import TimeBarChart from '../components/dashboard/TimeBarChart';
import PieChartComponent from '../components/dashboard/PieChartComponent';
import ParticipantsByCoutry from '../components/dashboard/ParticipantsByCoutry';
import axios from 'axios';

const QUICK_FILTERS = [
  { label: 'All time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'This week', value: 'this_week' },
  { label: 'Last week', value: 'last_week' },
  { label: 'This month', value: 'this_month' },
  { label: 'Last month', value: 'last_month' },
];

function Dashboard() {
  const [statsData, setStatsData] = useState(null); // For top 4 cards only
  const [loading, setLoading] = useState(true);

  // Date filter state
  const [activeFilter, setActiveFilter] = useState(QUICK_FILTERS[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [customRange, setCustomRange] = useState({ from: '', to: '' });
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDashboardData = async (filterValue = 'all', from = null, to = null) => {
    setLoading(true);
    try {
      const params = {};
      if (filterValue === 'custom' && from && to) {
        params.from = from;
        params.to = to;
      }

      // ONLY fetch data for the top 4 stats cards (Charts handle themselves now)
      const statsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/admin/stats-cards`, { 
        params: { timeframe: filterValue, ...params } 
      });

      if (statsResponse.status === 200) {
        setStatsData(statsResponse.data.data);
      }

    } catch (error) {
      console.error('API Connection Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData('all');
  }, []);

  const handleQuickSelect = (filter) => {
    setActiveFilter(filter);
    setCustomRange({ from: '', to: '' });
    setDropdownOpen(false);
    fetchDashboardData(filter.value);
  };

  const handleApplyCustom = () => {
    if (!customRange.from || !customRange.to) return;
    const label = `${customRange.from} → ${customRange.to}`;
    setActiveFilter({ label, value: 'custom' });
    setDropdownOpen(false);
    fetchDashboardData('custom', customRange.from, customRange.to);
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#EBF5FF]">
        <div className="w-12 h-12 border-4 border-[#2840B6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full p md:p-8 bg-[#EBF5FF] min-h-screen flex flex-col gap-6">

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-wide">
          Welcome To Kanoo Daily Rental
        </h1>

        {/* Date Filter Dropdown */}
        <div className="relative" ref={dropdownRef}>

          {/* Trigger Button */}
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:border-[#2840B6] text-gray-600 text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-all duration-200"
          >
            <Filter size={14} className="text-gray-400" />
            <span>{activeFilter.label}</span>
          </button>

          {/* Dropdown Panel */}
          {dropdownOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-50 bg-white border border-gray-100 rounded-2xl shadow-2xl w-64 overflow-hidden">

              {/* Quick Select Section */}
              <div className="px-4 pt-4 pb-2">
                <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-2">
                  Quick Select
                </p>
                <ul className="flex flex-col gap-0.5">
                  {QUICK_FILTERS.map((filter) => (
                    <li key={filter.value}>
                      <button
                        onClick={() => handleQuickSelect(filter)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150
                          ${activeFilter.value === filter.value
                            ? 'bg-[#EBF5FF] text-[#2840B6]'
                            : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        {filter.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 mx-4 my-2" />

              {/* Custom Range Section */}
              <div className="px-4 pb-4">
                <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-3">
                  Custom Range
                </p>

                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">From</label>
                    <input
                      type="date"
                      value={customRange.from}
                      max={customRange.to || undefined}
                      onChange={(e) =>
                        setCustomRange((prev) => ({ ...prev, from: e.target.value }))
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#2840B6] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">To</label>
                    <input
                      type="date"
                      value={customRange.to}
                      min={customRange.from || undefined}
                      onChange={(e) =>
                        setCustomRange((prev) => ({ ...prev, to: e.target.value }))
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#2840B6] focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={handleApplyCustom}
                    disabled={!customRange.from || !customRange.to}
                    className="w-full bg-[#2840B6] disabled:bg-[#a0aee8] text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-[#1e32a0] transition-colors duration-200"
                  >
                    Apply
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* ROW 1: Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Total number of participants"
          value={statsData?.totalParticipants ?? '0'}
          trend={statsData?.participantGrowth}
          trendLabel={statsData?.trendLabel}
          icon={Users}
        />
        <StatCard
          title="Total number of registration"
          value={statsData?.totalUsers ?? '0'}
          trend={statsData?.registrationGrowth}
          trendLabel={statsData?.trendLabel}
          icon={UserPlus}
        />
        <StatCard
          title="Game Replay"
          value={statsData?.totalReplays ?? '0'}
          trend={statsData?.replayGrowth}
          trendLabel={statsData?.trendLabel}
          icon={PlaySquare}
        />
        <StatCard
          title="Most Played Vehicle"
          value={
            statsData?.mostUsedVehicle
              ? statsData.mostUsedVehicle
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (l) => l.toUpperCase())
              : 'N/A'
          }
          trend={null} /* Null trend hides the arrow automatically */
          icon={CarFront}
        />
      </div>

      {/* ROW 2: Middle Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-fr">
        {/* If the charts are handling their own API calls, you might want to pass the activeFilter down to them so they know what date range to fetch! */}
        <ParticipantsChart activeFilter={activeFilter.value} customRange={customRange} />
        <TimeBarChart activeFilter={activeFilter.value} customRange={customRange} />
        <PieChartComponent activeFilter={activeFilter.value} customRange={customRange} />
      </div>

      {/* ROW 3: Bottom Chart */}
      <div className="w-full">
        <ParticipantsByCoutry activeFilter={activeFilter.value} customRange={customRange} />
      </div>

    </div>
  );
}

export default Dashboard;