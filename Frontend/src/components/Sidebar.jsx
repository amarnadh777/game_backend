import React from 'react';
import toast from 'react-hot-toast';
import { NavLink, useNavigate } from 'react-router-dom';

// 1. Accept the isOpen prop
const Sidebar = ({ isOpen }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminUser');
    toast.success('Logged out successfully!');
    navigate('/login', { replace: true });
  };

  const navItemClasses = ({ isActive }) => 
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm group whitespace-nowrap ${
      isActive 
        ? 'bg-[#FFD100] text-[#004B8D] font-extrabold shadow-sm' 
        : 'hover:bg-white/10 font-medium text-white/85 hover:text-white'
    }`;

  const iconClasses = (isActive) => 
    `w-5 h-5 min-w-[20px] ${isActive ? 'text-indigo-900' : 'opacity-70 group-hover:opacity-100 transition-opacity'}`;

  return (
    // 2. Add transition classes and dynamically toggle between w-[243px] and w-0 based on isOpen
    <aside 
      className={`bg-[#11087C] text-white flex flex-col z-20 relative overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen ? 'w-[243px]' : 'w-0'
      }`}
    >
      
      {/* Decorative background blur */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-5 blur-2xl"></div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 flex flex-col gap-2 px-4 relative z-10">
        
        <NavLink to="/dashboard" className={navItemClasses}>
          {({ isActive }) => (
            <>
              <svg className={iconClasses(isActive)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              Dashboard
            </>
          )}
        </NavLink>

        <NavLink to="/users" className={navItemClasses}>
          {({ isActive }) => (
            <>
              <svg className={iconClasses(isActive)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
           Leaderboard

           
            </>
          )}
        </NavLink>

        <NavLink to="/banners" className={navItemClasses}>
          {({ isActive }) => (
            <>
              <svg className={iconClasses(isActive)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Banners
            </>
          )}
        </NavLink>

      </nav>
      
      {/* Logout Button */}
      <div className="p-6 border-t border-indigo-800/50">
         <button 
           onClick={handleLogout} 
           className="flex items-center gap-2 text-sm font-medium text-indigo-200 hover:text-white transition-colors w-full group whitespace-nowrap"
         >
           <svg className="w-5 h-5 min-w-[20px] opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
           Logout
         </button>
      </div>
    </aside>
  );
};

export default Sidebar;
