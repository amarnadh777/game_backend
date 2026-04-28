import React from 'react';
import logo from '../assets/kanoologo.png';

const Header = () => {
  return (
    <header className="w-full h-[100px] bg-[#11087C] px-6 py-4 flex items-center justify-between z-50">
      
      {/* Left Side: Menu Icon & Logo */}
      <div className="flex items-center gap-6">
        
        {/* Hamburger Menu Icon */}
        <button className="text-white hover:text-gray-300 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h9" />
          </svg>
        </button>
        
        {/* Logo Section */}
        <div className="flex items-center gap-2 cursor-pointer">
          {/* Replace this with your actual Kango logo image if you have it exported */}
        <img src={logo} alt="" />
        </div>

      </div>

      {/* Right Side: Profile Icon */}
      <div className="flex items-center">
        <button className="text-white hover:text-gray-300 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

    </header>
  );
};

export default Header;