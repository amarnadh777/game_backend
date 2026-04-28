import axios from "axios";
import React, { useEffect, useState } from "react";
import ExportModal from "../components/ExportModal";

const UserDetails = () => {
  const [users, setUsers] = useState([]);
  const [filterBy, setFilterBy] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState();
  const [isCalanderModleOpen, setIsCalanderModelOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        setUsers([]); 

        let url = `${import.meta.env.VITE_API_URL}/game-sessions/admin/leaderboard?page=${currentPage}&limit=${itemsPerPage}`;
        
        if (filterBy && searchQuery) {
          url += `&filterBy=${filterBy}&searchQuery=${searchQuery}`;
        }

        const response = await axios.get(url);
        const data = response.data.leaderboard;
        const paginationInfo = response.data.pagination; 

        const transformData = data.map((user) => ({
          id: user.user || user.id,
          rank: user.rank === "-" ? "-" : String(user.rank).padStart(2, '0'),
          player: user.firstName + " " + user.lastName,
          email: user.email,
          country: user.country,
          speed: `${user.highestSpeed} KM/H`, 
          finished: user.timeTaken,
          status: user.status,
          phoneNumber: user.phoneNumber,
          finishedAt: user.completedAt,
          registerDate:user.registerDate
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
  }, [currentPage, filterBy, searchQuery]);

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
    setUsers(
      users.map((user) =>
        user.id === id ? { ...user, status: !user.status } : user,
      ),
    );

    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/user/toggle-status/${id}`);
    } catch (error) {
      console.error("Failed to update status in DB:", error);
      setUsers(
        users.map((user) =>
          user.id === id ? { ...user, status: currentStatus } : user,
        ),
      );
      alert("Failed to update user status. Please try again.");
    }
  };

  const closeModal = () => {
    setIsModelOpen(false);
  };

  return (
    // Background exactly matches the Dashboard blue
    <div className="w-full min-h-screen p-6 md:p-8 bg-[#EBF5FF] flex flex-col gap-4">
      <ExportModal isOpen={isCalanderModleOpen} onClose={() => {setIsCalanderModelOpen(false)}} />

      {/* Main Page Title */}
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-wide mb-2">
        Welcome To Kanoo Daily Rental
      </h1>

      {/* White Container Card */}
      <div className="bg-white rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden border border-white">
        
        {/* Header Section inside the white card */}
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-[18px] font-bold text-gray-900">
            User Details
          </h2>

          {/* Controls: Filter & Download */}
          <div className="flex items-center gap-4">
            {/* Kept your search input logic */}
            {filterBy && (
              <input
                type="text"
                placeholder={`Search by ${filterBy}...`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); 
                }}
                className="bg-gray-50 border border-gray-200 text-gray-600 text-sm py-2.5 px-4 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 w-48"
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
                className="appearance-none bg-[#F3F4F6] text-gray-700 text-sm font-medium py-2 px-4 pr-10 rounded-lg outline-none cursor-pointer w-40"
              >
                <option value="" disabled>Filter by list</option>
                <option value="email">Email</option>
                <option value="name">Player Name</option>
                <option value="country">Country</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Yellow Download Button */}
            <button 
              className="bg-gradient-to-r from-[#FDE57E] to-[#F1C82A] text-slate-800 text-sm font-semibold py-2 px-5 rounded-lg transition-transform active:scale-95 flex items-center gap-2" 
              onClick={() =>{setIsCalanderModelOpen(true)}}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download 
            </button>
          </div>
        </div>

        {/* Main Table Area */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              {/* Light gray header background */}
              <tr className="bg-[#F3F4F6]">
                <th className="py-3 px-6 text-[13px] font-bold text-gray-700 w-16">Rank</th>
                <th className="py-3 px-6 text-[13px] font-bold text-gray-700">Player</th>
                <th className="py-3 px-6 text-[13px] font-bold text-gray-700">Email</th>
                <th className="py-3 px-6 text-[13px] font-bold text-gray-700">Country</th>
                <th className="py-3 px-6 text-[13px] font-bold text-gray-700">Speed</th>
                <th className="py-3 px-6 text-[13px] font-bold text-gray-700">Finished</th>
                <th className="py-3 px-6 text-[13px] font-bold text-gray-700">Status</th>
                <th className="py-3 px-6 text-[13px] font-bold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500 font-medium">No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
            
                  <td className="py-4 px-6 text-[14px] text-gray-500">{user.rank}</td>
                  <td className="py-4 px-6 text-[14px] font-medium text-gray-800">{user.player}</td>
                  <td className="py-4 px-6 text-[14px] text-gray-600">{user.email}</td>
                  <td className="py-4 px-6 text-[14px] font-medium text-gray-800">{user.country}</td>
                  <td className="py-4 px-6 text-[14px] font-medium text-gray-800">{user.speed}</td>
                  <td className="py-4 px-6 text-[14px] text-gray-600">{formatTimeTaken(user.finished)}</td>

                  {/* Plain Text Status column to match screenshot */}
                  <td className="py-4 px-6 text-[14px] text-gray-600">Active</td>

                  {/* Actions: Toggle & View More */}
                  <td className="py-4 px-6 flex items-center gap-3">
                    
                    {/* Rebuilt Toggle to match specific red/green colors */}
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

                    {/* View Button */}
                    <button 
                      className="border border-gray-300 hover:bg-gray-100 text-gray-700 text-[13px] font-medium py-1 px-3 rounded-[6px] transition-all flex items-center gap-1"
                      onClick={() =>{
                        setIsModelOpen(true)
                        setSelectedUser(user)
                      }}
                    >
                      View <span className="text-gray-400">&gt;</span>
                    </button>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 gap-4">
          <span className="text-[13px] font-medium text-gray-700">
            {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
          </span>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-2 py-1.5 text-gray-600 hover:text-blue-600 text-[13px] font-medium disabled:opacity-50 flex items-center"
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
                     className={`min-w-[28px] h-[28px] rounded px-2 transition-colors text-[13px] ${
                       currentPage === pageNumber
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
              className="px-2 py-1.5 text-gray-600 hover:text-blue-600 text-[13px] font-medium disabled:opacity-50 flex items-center"
            >
              Next &gt;
            </button>
          </div>
        </div>
      </div>

      {/* --- USER DETAILS MODAL (Kept identical to your original logic) --- */}
      {/* --- USER DETAILS MODAL --- */}
{/* --- USER DETAILS MODAL --- */}
      {isModelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0c5b]/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          
          {/* Changed max-w to 1270px to match your design perfectly */}
          <div className="bg-white border border-[#D8DCDF] rounded-[12px] w-full max-w-[1270px] shadow-2xl overflow-hidden relative flex flex-col">
            
            {/* Header Section */}
            <div className="relative py-6 px-8 flex justify-center items-center">
              <h2 className="text-[22px] font-bold text-gray-900 tracking-wide">
                User Details
              </h2>
              <button onClick={closeModal} className="absolute right-6 text-gray-500 hover:text-gray-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Top Highlighted Data Ribbon */}
            <div className="bg-[#F1F4F9] py-5 px-10 md:px-20 grid grid-cols-2 lg:grid-cols-4 gap-6 items-center border-y border-gray-100">
              <div className="flex items-center gap-4 xl:gap-6">
                <span className="text-[14px] font-bold text-gray-900 w-12 shrink-0">Rank</span>
                <span className="text-[14px] font-bold text-[#0A3D81]">#{selectedUser?.rank}</span>
              </div>
              <div className="flex items-center gap-4 xl:gap-6">
                <span className="text-[14px] font-bold text-gray-900 w-12 shrink-0">Date</span>
                <span className="text-[14px] font-medium text-gray-700 whitespace-nowrap">{formatDate(selectedUser?.registerDate)}</span>
              </div>
              <div className="flex items-center gap-4 xl:gap-6">
                <span className="text-[14px] font-bold text-gray-900 w-12 shrink-0">Time</span>
                <span className="text-[14px] font-medium text-gray-700 whitespace-nowrap">{formatTime(selectedUser?.registerDate)}</span>
              </div>
              <div className="flex items-center gap-4 xl:gap-6">
                <span className="text-[14px] font-bold text-gray-900 w-12 shrink-0">Status</span>
                <span className={`text-[14px] font-medium ${selectedUser?.status ? 'text-[#00B050]' : 'text-red-600'}`}>
                  {selectedUser?.status ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Main Details Grid */}
            <div className="py-10 px-10 md:px-20 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 xl:gap-x-24">
              
              {/* Left Column (Using Grid to force perfectly straight alignment) */}
              <div className="grid grid-cols-[120px_1fr] gap-y-6 items-center">
                <span className="text-[14px] font-bold text-gray-900">Player</span>
                <span className="text-[14px] font-medium text-gray-700">{selectedUser?.player}</span>

                <span className="text-[14px] font-bold text-gray-900">Country</span>
                <span className="text-[14px] font-medium text-gray-700">{selectedUser?.country}</span>

                <span className="text-[14px] font-bold text-gray-900">Speed</span>
                <span className="text-[14px] font-medium text-gray-700">{selectedUser?.speed}</span>
              </div>

              {/* Right Column (Using Grid to force perfectly straight alignment) */}
              <div className="grid grid-cols-[120px_1fr] gap-y-6 items-center">
                <span className="text-[14px] font-bold text-gray-900">Email</span>
                <span className="text-[14px] font-medium text-gray-700 truncate" title={selectedUser?.email}>{selectedUser?.email}</span>

                <span className="text-[14px] font-bold text-gray-900">Phone number</span>
                <span className="text-[14px] font-medium text-gray-700">{selectedUser?.phoneNumber || 'N/A'}</span>

                <span className="text-[14px] font-bold text-gray-900">Finished</span>
                <span className="text-[14px] font-medium text-gray-700">{formatTimeTaken(selectedUser?.finished)}</span>
              </div>

            </div>

            {/* Footer Section */}
            <div className="pb-8 pt-4 flex justify-center">
              <button 
                onClick={closeModal}
                className="border border-[#004785] text-gray-700 hover:bg-gray-50 text-[13px] font-medium py-2 px-10 rounded-[8px] transition-colors active:scale-95"
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