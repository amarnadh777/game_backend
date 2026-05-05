import React from 'react';
import { Menu, UserCircle } from 'lucide-react';
import logo from '../assets/kdr-logo.png';

const Header = () => {
  return (
    <header className="w-full h-[88px] bg-white border-b border-[#D8E2EC] px-6 py-4 flex items-center justify-between z-50">
      
      {/* Left Side: Menu Icon & Logo */}
      <div className="flex items-center gap-6">
        
        {/* Hamburger Menu Icon */}
        <button className="text-[#004B8D] hover:text-[#003A6F] transition-colors">
          <Menu size={26} strokeWidth={1.8} />
        </button>
        
        {/* Logo Section */}
        <div className="flex items-center gap-3 cursor-pointer">
          <img src={logo} alt="Kanoo Daily Rental" className="h-12 w-auto max-w-[300px] object-contain" />
          <div className="hidden lg:block h-8 w-px bg-[#D8E2EC]" />
          <p className="hidden lg:block text-xs font-bold tracking-wide text-[#004B8D]">
            Leading by Far
          </p>
        </div>

      </div>

      {/* Right Side: Profile Icon */}
      <div className="flex items-center">
        <button className="text-[#004B8D] hover:text-[#003A6F] transition-colors">
          <UserCircle size={32} strokeWidth={1.6} />
        </button>
      </div>

    </header>
  );
};

export default Header;
