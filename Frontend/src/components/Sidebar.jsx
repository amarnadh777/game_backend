import React from 'react';
import { NavLink } from 'react-router-dom';
import { Image, LayoutDashboard, LogOut, Users } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/banners', label: 'Banners', icon: Image },
];

const Sidebar = () => {
  const navItemClasses = ({ isActive }) => 
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm group ${
      isActive 
        ? 'bg-[#FFD100] text-[#004B8D] font-extrabold shadow-sm' 
        : 'hover:bg-white/10 font-medium text-white/85 hover:text-white'
    }`;

  const iconClasses = (isActive) => 
    `w-5 h-5 ${isActive ? 'text-[#004B8D]' : 'opacity-75 group-hover:opacity-100 transition-opacity'}`;

  return (
    // Removed top padding/margin so it connects perfectly to the header
    <aside className="w-[243px] bg-[#004B8D] text-white flex flex-col z-20 relative overflow-hidden">

      {/* Navigation Links */}
      <nav className="flex-1 py-6 flex flex-col gap-2 px-4 relative z-10">
        {navItems.map((item) => {
          const NavigationIcon = item.icon;

          return (
            <NavLink key={item.to} to={item.to} className={navItemClasses}>
              {({ isActive }) => (
                <>
                  <NavigationIcon className={iconClasses(isActive)} strokeWidth={1.8} />
                  {item.label}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
      
      {/* Logout Button */}
      <div className="p-6 border-t border-white/20">
         <button className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors w-full group">
           <LogOut className="w-5 h-5 opacity-75 group-hover:opacity-100 transition-opacity" strokeWidth={1.8} />
           Logout
         </button>
      </div>
    </aside>
  );
};

export default Sidebar;
