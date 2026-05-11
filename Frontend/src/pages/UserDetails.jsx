import axios from "axios";
import React, { useEffect, useState } from "react";
import ExportModal from "../components/ExportModal";
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { getCountryCallingCode } from 'libphonenumber-js'
import axiosInstance from "../api/axios";

const UserDetails = () => {
  const [users, setUsers] = useState([]);
  const [filterBy, setFilterBy] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState();
  const [isCalanderModleOpen, setIsCalanderModelOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const itemsPerPage = 10;

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        setUsers([]);

        let url = `${import.meta.env.VITE_API_URL}/game-sessions/admin/leaderboard?page=${currentPage}&limit=${itemsPerPage}`;

        // Prepare the search query to send to the backend
        let apiSearchQuery = searchQuery;

        // If searching by phone number, remove '+', spaces, and '-' before sending
        if (filterBy === 'phoneNumber' && apiSearchQuery) {
          apiSearchQuery = apiSearchQuery.replace(/[\s+-]/g, '');
        }

        if (filterBy && apiSearchQuery) {
          url += `&filterBy=${filterBy}&searchQuery=${encodeURIComponent(apiSearchQuery)}`;
        }

        if (appliedStartDate && appliedEndDate) {
          url += `&startDate=${appliedStartDate}&endDate=${appliedEndDate}`;
        }

        if (sortConfig.key) {
          url += `&sortBy=${sortConfig.key}&sortOrder=${sortConfig.direction}`;
        }

        const response = await axiosInstance.get(url);
        const data = response.data.leaderboard;
        const paginationInfo = response.data.pagination;

        const transformData = data.map((user) => ({
          id: user.id,
          rank: user.rank === "-" ? "-" : String(user.rank).padStart(2, '0'),
          player: user.firstName + " " + user.lastName,
          email: user.email,
          country: user.country,
          speed: `${user.highestSpeed} KM/H`,
          finished: user.timeTaken,
          status: user.status,
          phoneNumber: user.phoneNumber,
          finishedAt: user.completedAt,
          registerDate: user.registerDate,
          phoneCode: user?.phoneCode,
          vehicle: user?.vehicle,
        }));

        setUsers(transformData);
        setTotalPages(paginationInfo.totalPages);
        setTotalItems(paginationInfo.total);

      } catch (error) {
        console.error("Pagination Fetch Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      loadUserData();
    }, 500);

    return () => clearTimeout(delayDebounceFn);

  }, [currentPage, filterBy, searchQuery, appliedStartDate, appliedEndDate, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); 
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-[14px] h-[14px] ml-1 text-gray-400" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ArrowUp className="w-[14px] h-[14px] ml-1 text-[#0A3D81]" />;
    } else {
      return <ArrowDown className="w-[14px] h-[14px] ml-1 text-[#0A3D81]" />;
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTimeTaken = (rawSeconds) => {
    if (rawSeconds === null || rawSeconds === undefined) return 'N/A';
    const totalSeconds = parseInt(rawSeconds, 10);
    if (isNaN(totalSeconds)) return 'N/A';

    if (totalSeconds < 60) {
      return `${totalSeconds} Sec`;
    }

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const paddedSeconds = seconds.toString().padStart(2, '0');

    return `${minutes}:${paddedSeconds} Min`;
  };

  const toggleStatus = async (id, currentStatus) => {
    setUsers(users.map((user) =>
      user.id === id ? { ...user, status: !user.status } : user
    ));

    try {
      await axiosInstance.patch(`/user/toggle-status/${id}`);
    } catch (error) {
      console.error("Failed to update status in DB:", error);
      setUsers(users.map((user) =>
        user.id === id ? { ...user, status: currentStatus } : user
      ));
      alert("Failed to update user status. Please try again.");
    }
  };

  const closeModal = () => {
    setIsModelOpen(false);
  };

  const normalizedCountry = selectedUser?.country
    ?.toLowerCase()
    .replace(/\s/g, "");

  const countryDialCodeMap = {
    afghanistan: "93", albania: "355", algeria: "213", argentina: "54", armenia: "374", australia: "61", austria: "43",
    azerbaijan: "994", bahrain: "973", bangladesh: "880", belarus: "375", belgium: "32", bolivia: "591", brazil: "55",
    bulgaria: "359", cambodia: "855", cameroon: "237", canada: "1", chile: "56", china: "86", colombia: "57",
    croatia: "385", cuba: "53", cyprus: "357", czechrepublic: "420", denmark: "45", dominicanrepublic: "1",
    ecuador: "593", egypt: "20", estonia: "372", ethiopia: "251", finland: "358", france: "33", georgia: "995",
    germany: "49", ghana: "233", greece: "30", hungary: "36", iceland: "354", india: "91", indonesia: "62",
    iran: "98", iraq: "964", ireland: "353", israel: "972", italy: "39", jamaica: "1", japan: "81",
    jordan: "962", kazakhstan: "7", kenya: "254", kuwait: "965", kyrgyzstan: "996", laos: "856", latvia: "371",
    lebanon: "961", lithuania: "370", luxembourg: "352", malaysia: "60", maldives: "960", mexico: "52",
    moldova: "373", mongolia: "976", morocco: "212", myanmar: "95", nepal: "977", netherlands: "31",
    newzealand: "64", nigeria: "234", northkorea: "850", norway: "47", oman: "968", pakistan: "92",
    palestine: "970", panama: "507", peru: "51", philippines: "63", poland: "48", portugal: "351",
    qatar: "974", romania: "40", russia: "7", saudiarabia: "966", serbia: "381", singapore: "65",
    slovakia: "421", slovenia: "386", southafrica: "27", southkorea: "82", spain: "34", srilanka: "94",
    sudan: "249", sweden: "46", switzerland: "41", syria: "963", taiwan: "886", tajikistan: "992",
    tanzania: "255", thailand: "66", tunisia: "216", turkey: "90", uganda: "256", uk: "44",
    unitedkingdom: "44", usa: "1", unitedstates: "1", ukraine: "380", unitedarabemirates: "971",
    uae: "971", uruguay: "598", uzbekistan: "998", venezuela: "58", vietnam: "84", yemen: "967",
    zambia: "260", zimbabwe: "263", in: "91"
  };

  const cleanedCode = selectedUser?.phoneCode
    ?.replace(/\D/g, "")
    ?.trim();

  const phoneCode =
    cleanedCode && cleanedCode.length > 0
      ? cleanedCode
      : countryDialCodeMap[normalizedCountry] || "";
      
  const CAR_NAME_MAP = {
    "icaur_v27_royal": "Icaur V27 Royal",
    "lexus_lx_600_urban": "Lexus LX 600 Urban",
    "jetour_g700": "Jetour G700",
    "deepal_g318": "Deepal G318",
    "toyota_land_cruiser_gx_r_3_5l": "Toyota Land Cruiser GX-R 3.5L"
  };

  return (
    <div className="w-full min-h-screen p-6 md:p-8 bg-[#EBF5FF] flex flex-col gap-4">
      <ExportModal isOpen={isCalanderModleOpen} onClose={() => { setIsCalanderModelOpen(false); }} />

      <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-wide mb-2">
        Welcome To Kanoo Daily Rental
      </h1>

      <div className="bg-white rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden border border-white">

        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-[18px] font-bold text-gray-900">Leaderboard</h2>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
                className="bg-[#F3F4F6] text-gray-700 text-sm font-medium py-2 px-4 rounded-lg outline-none cursor-pointer flex items-center gap-2 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {appliedStartDate && appliedEndDate
                  ? `${formatDateForDisplay(appliedStartDate)} to ${formatDateForDisplay(appliedEndDate)}`
                  : "Filter by Date"}
              </button>

              {isDateFilterOpen && (
                <div className="absolute top-full mt-2 right-0 sm:left-0 bg-white border border-gray-200 shadow-xl rounded-xl p-4 z-50 w-72">
                  <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-gray-800 border-b pb-2">Select Date Range</h3>

                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] font-medium text-gray-500">From Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-gray-700 text-sm py-2 px-3 rounded-lg outline-none focus:ring-1 focus:ring-[#0A3D81] w-full"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] font-medium text-gray-500">To Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-gray-700 text-sm py-2 px-3 rounded-lg outline-none focus:ring-1 focus:ring-[#0A3D81] w-full"
                      />
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                      <button
                        onClick={() => {
                          setStartDate("");
                          setEndDate("");
                          setAppliedStartDate("");
                          setAppliedEndDate("");
                          setCurrentPage(1);
                        }}
                        className="text-[13px] font-medium text-red-500 hover:text-red-700"
                      >
                        Clear
                      </button>

                      <button
                        onClick={() => {
                          setAppliedStartDate(startDate);
                          setAppliedEndDate(endDate);
                          setCurrentPage(1);
                          setIsDateFilterOpen(false);
                        }}
                        className="bg-[#0A3D81] text-white text-[13px] font-medium py-1.5 px-4 rounded-lg hover:bg-[#072b5c] transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {filterBy && (
              <input
                type={filterBy === 'phoneNumber' ? "tel" : "text"}
                placeholder={filterBy === 'phoneNumber' ? "Search phone number..." : `Search by ${filterBy}...`}
                value={searchQuery}
                onChange={(e) => {
                  if (filterBy === 'phoneNumber') {
                    const val = e.target.value;
                    if (val === '' || /^[0-9+\s-]+$/.test(val)) {
                      setSearchQuery(val);
                      setCurrentPage(1);
                    }
                  } else {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }
                }}
                className="bg-white border border-[#D8E2EC] text-gray-600 text-sm py-2.5 px-4 rounded-lg outline-none focus:ring-2 focus:ring-[#004B8D] w-48"
              />
            )}

            <div className="relative">
              <select
                value={filterBy}
                onChange={(e) => {
                  setFilterBy(e.target.value);
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="appearance-none bg-[#EEF4F8] text-gray-700 text-sm font-medium py-2 px-4 pr-10 rounded-lg outline-none cursor-pointer w-40"
              >
                <option value="" disabled>Filter by list</option>
                <option value="email">Email</option>
                <option value="name">Player Name</option>
                <option value="country">Country</option>
                <option value="phoneNumber">Phone Number</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <button
              className="bg-gradient-to-r from-[#FDE57E] to-[#F1C82A] text-slate-800 text-sm font-semibold py-2 px-5 rounded-lg transition-transform active:scale-95 flex items-center gap-2"
              onClick={() => { setIsCalanderModelOpen(true); }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#F3F4F6]">
                <th className="py-3 px-6 text-[13px] font-bold text-gray-700 w-16">Rank</th>
                <th className="py-3 px-6 text-[13px] font-bold text-gray-700">Player</th>
              <th
  className="py-3 px-6 text-[13px] font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors select-none"
  onClick={() => requestSort('registerDate')}
>
  <div className="flex items-center">
    Registered Date <SortIcon columnKey="registerDate" />
  </div>
</th>
                <th className="py-3 px-6 text-[13px] font-bold text-gray-700">Country</th>

                <th
                  className="py-3 px-6 text-[13px] font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors select-none"
                  onClick={() => requestSort('speed')}
                >
                  <div className="flex items-center">
                    Speed <SortIcon columnKey="speed" />
                  </div>
                </th>

                <th
                  className="py-3 px-6 text-[13px] font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors select-none"
                  onClick={() => requestSort('finished')}
                >
                  <div className="flex items-center">
                    Finished <SortIcon columnKey="finished" />
                  </div>
                </th>

                <th className="py-3 px-6 text-[13px] font-bold text-gray-700">Status</th>
                <th className="py-3 px-6 text-[13px] font-bold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500 font-medium">No users found.</td>
                </tr>
              ) : (
                users.map((user) => {
                  return (
                    <React.Fragment key={user.id}>
                      <tr className="hover:bg-gray-50 transition-colors cursor-pointer">
                        <td className="py-4 px-6 text-[14px] text-gray-500">{user.rank}</td>
                        <td className="py-4 px-6 text-[14px] font-medium text-gray-800">{user.player}</td>
                        <td className="py-4 px-6 text-[14px] text-gray-600">{formatDate(user.registerDate)}</td>
                        <td className="py-4 px-6 text-[14px] font-medium text-gray-800">{user.country}</td>
                        <td className="py-4 px-6 text-[14px] font-medium text-gray-800">{user.speed}</td>
                        <td className="py-4 px-6 text-[14px] text-gray-600">{formatTimeTaken(user.finished)}</td>

                        <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                          <div
                            onClick={() => toggleStatus(user.id, user.status)}
                            className={`relative inline-flex h-[28px] w-[85px] items-center rounded-full cursor-pointer transition-colors ${user.status ? "bg-[#00B050]" : "bg-[#990000]"}`}
                          >
                            <span className={`absolute text-[11px] font-medium text-white transition-opacity ${user.status ? "left-2.5 opacity-100" : "opacity-0"}`}>
                              Active
                            </span>
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ease-in-out z-10 ${user.status ? "translate-x-[61px]" : "translate-x-1"}`} />
                            <span className={`absolute text-[11px] font-medium text-white transition-opacity ${user.status ? "opacity-0" : "right-2 opacity-100"}`}>
                              Disabled
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-6 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="border border-gray-300 hover:bg-gray-100 text-gray-700 text-[13px] font-medium py-1 px-3 rounded-[6px] transition-all flex items-center gap-1"
                            onClick={() => {
                              setIsModelOpen(true);
                              setSelectedUser(user);
                            }}
                          >
                            View Details <span className="text-gray-400">&gt;</span>
                          </button>
                        </td>
                      </tr>

                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 gap-4">
          <span className="text-[13px] font-medium text-gray-700">
            {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-2 py-1.5 text-gray-600 hover:text-[#004B8D] text-[13px] font-medium disabled:opacity-50 flex items-center"
            >
              &lt; Previous
            </button>

            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              if (pageNumber === 1 || pageNumber === totalPages || (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)) {
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`min-w-[28px] h-[28px] rounded px-2 transition-colors text-[13px] ${currentPage === pageNumber
                      ? "bg-[#0A3D81] text-white font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    {pageNumber}
                  </button>
                );
              } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                return <span key={pageNumber} className="px-1 text-gray-400">...</span>;
              }
              return null;
            })}

            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages || totalPages === 0}
              className="px-2 py-1.5 text-gray-600 hover:text-[#004B8D] text-[13px] font-medium disabled:opacity-50 flex items-center"
            >
              Next &gt;
            </button>
          </div>
        </div>
      </div>

      {isModelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0c5b]/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#D8DCDF] rounded-[12px] w-full max-w-[1270px] shadow-2xl overflow-hidden relative flex flex-col">

            <div className="relative py-6 px-8 flex justify-center items-center">
              <h2 className="text-[22px] font-bold text-gray-900 tracking-wide">User Details</h2>
              <button onClick={closeModal} className="absolute right-6 text-gray-500 hover:text-gray-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-[#F1F4F9] py-5 px-10 md:px-20 grid grid-cols-2 lg:grid-cols-4 gap-6 items-center border-y border-gray-100">
              <div className="flex items-center gap-4 xl:gap-6">
                <span className="text-[14px] font-bold text-[#101820] w-12 shrink-0">Rank</span>
                <span className="text-[14px] font-bold text-[#004B8D]">#{selectedUser?.rank}</span>
              </div>
              <div className="flex items-center gap-4 xl:gap-6">
                <span className="text-[14px] font-bold text-gray-900 shrink-0">Registration Date</span>
                <span className="text-[14px] font-medium text-gray-700 whitespace-nowrap">{formatDate(selectedUser?.registerDate)}</span>
              </div>
              <div className="flex items-center gap-4 xl:gap-6">
                <span className="text-[14px] font-bold text-gray-900 shrink-0">Registration Time</span>
                <span className="text-[14px] font-medium text-gray-700 whitespace-nowrap">{formatTime(selectedUser?.registerDate)}</span>
              </div>
              <div className="flex items-center gap-4 xl:gap-6">
                <span className="text-[14px] font-bold text-[#101820] w-12 shrink-0">Status</span>
                <span className={`text-[14px] font-medium ${selectedUser?.status ? 'text-[#00B050]' : 'text-red-600'}`}>
                  {selectedUser?.status ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="py-10 px-10 md:px-20 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 xl:gap-x-24">
              <div className="grid grid-cols-[120px_1fr] gap-y-6 items-center">
                <span className="text-[14px] font-bold text-[#101820]">Player</span>
                <span className="text-[14px] font-medium text-gray-700">{selectedUser?.player}</span>

                <span className="text-[14px] font-bold text-[#101820]">Country</span>
                <span className="text-[14px] font-medium text-gray-700">{selectedUser?.country}</span>

                <span className="text-[14px] font-bold text-[#101820]">Speed</span>
                <span className="text-[14px] font-medium text-gray-700">{selectedUser?.speed}</span>
              </div>

              <div className="grid grid-cols-[120px_1fr] gap-y-6 items-center">
                <span className="text-[14px] font-bold text-[#101820]">Email</span>
                <span className="text-[14px] font-medium text-gray-700 truncate" title={selectedUser?.email}>{selectedUser?.email}</span>

                <span className="text-[14px] font-bold text-gray-900">Phone number</span>
                <span className="text-[14px] font-medium text-gray-700">
                  {selectedUser?.phoneNumber
                    ? `${phoneCode ? '+' + phoneCode + ' ' : ''}${selectedUser.phoneNumber}`
                    : 'N/A'}
                </span>
                <span className="text-[14px] font-bold text-gray-900">Finished</span>
                <span className="text-[14px] font-medium text-gray-700">{formatTimeTaken(selectedUser?.finished)}</span>


              </div>

              <div className="grid grid-cols-[120px_1fr] gap-y-6 items-center">
                <span className="text-[14px] font-bold text-gray-900">Vehicle</span>
                <span className="text-[14px] font-medium text-gray-700">{CAR_NAME_MAP[selectedUser?.vehicle] || "N/A"}</span>
              </div>
            </div>

            <div className="pb-8 pt-4 flex justify-center">
              <button
                onClick={closeModal}
                className="border border-[#004B8D] text-gray-700 hover:bg-gray-50 text-[13px] font-medium py-2 px-10 rounded-[8px] transition-colors active:scale-95"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetails;
