import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import logo from '../assets/kanoologo.png'; // Make sure this path is correct

const Header = ({ toggleSidebar }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminUser');
    toast.success('Logged out successfully!');
    navigate('/login', { replace: true });
  };

  // Add a function to handle profile navigation
  const handleProfileUpdate = () => {
    setIsProfileOpen(false); // Close the dropdown
    navigate('/profile');    // Navigate to the profile update page
  };

  return (
    <header className="w-full h-[100px] bg-[#11087C] px-6 py-4 flex items-center justify-between z-50">
      
      {/* Left Side: Menu Icon & Logo */}
      <div className="flex items-center gap-6">
        <button 
          className="text-white hover:text-gray-300 transition-colors"
          onClick={toggleSidebar}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h9" />
          </svg>
        </button>
        
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <img src={logo} alt="Kango Logo" />
        </div>
      </div>

      {/* Right Side: Profile Icon */}
      <div className="relative flex items-center">
        <button 
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="text-white hover:text-gray-300 transition-colors focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {isProfileOpen && (
          <div className="absolute right-0 top-full mt-4 w-48 bg-white rounded-xl shadow-2xl py-2 z-50 border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
            
            <div className="px-4 py-2 border-b border-slate-100 mb-1">
              <p className="text-sm font-semibold text-slate-800">Admin User</p>
            </div>

            {/* NEW: Update Profile Button */}
            <button 
              onClick={handleProfileUpdate}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              Update Profile
            </button>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Logout
            </button>
          </div>
        )}
      </div>

    </header>
  );
};

export default Header;