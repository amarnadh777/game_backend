import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Menu, UserCircle, User, LogOut } from 'lucide-react';
import logo from '../assets/kdr-logo.png'; // Adjust path if needed

const Header = ({ toggleSidebar }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  // Safely parse admin user data
  let adminData = null;
  try {
    const userString = localStorage.getItem('adminUser');
    adminData = userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error("Failed to parse user data", error);
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminUser');
    toast.success('Logged out successfully!');
    navigate('/login', { replace: true });
  };

  const handleProfileUpdate = () => {
    setIsProfileOpen(false); 
    navigate('/profile');
  };

  return (
    <header className="w-full h-[88px] bg-white border-b border-[#D8E2EC] px-6 py-4 flex items-center justify-between z-50">
      
      {/* Left Side: Menu Icon & Logo */}
      <div className="flex items-center gap-6">
        
        {/* Hamburger Menu Icon */}
        <button 
          onClick={toggleSidebar}
          className="text-[#004B8D] hover:text-[#003A6F] transition-colors focus:outline-none"
        >
          <Menu size={26} strokeWidth={1.8} />
        </button>
        
        {/* Logo Section */}
        <div 
          className="flex items-center gap-3 cursor-pointer" 
          onClick={() => navigate('/')}
        >
          <img src={logo} alt="Kanoo Daily Rental" className="h-12 w-auto max-w-[300px] object-contain" />
          <div className="hidden lg:block h-8 w-px bg-[#D8E2EC]" />
          <p className="hidden lg:block text-xs font-bold tracking-wide text-[#004B8D]">
            Leading by Far
          </p>
        </div>

      </div>

      {/* Right Side: Profile Icon & Dropdown */}
      <div className="relative flex items-center">
        <button 
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="text-[#004B8D] hover:text-[#003A6F] transition-colors focus:outline-none"
        >
          <UserCircle size={32} strokeWidth={1.6} />
        </button>

        {/* Dropdown Menu */}
        {isProfileOpen && (
          <div className="absolute right-0 top-full mt-4 w-48 bg-white rounded-xl shadow-lg py-2 z-50 border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
            
            {/* User Name */}
            <div className="px-4 py-3 border-b border-slate-100 mb-1">
              <p className="text-sm font-semibold text-[#004B8D] truncate">
                {adminData ? adminData?.fullname : "Admin User"}
              </p>
            </div>

            {/* Update Profile Button */}
            <button 
              onClick={handleProfileUpdate}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-[#004B8D] transition-colors text-left"
            >
              <User size={16} strokeWidth={2} />
              Update Profile
            </button>

            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left"
            >
              <LogOut size={16} strokeWidth={2} />
              Logout
            </button>
          </div>
        )}
      </div>

    </header>
  );
};

export default Header;
