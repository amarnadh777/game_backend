import React from 'react';
import toast from 'react-hot-toast';
import { NavLink, useNavigate } from 'react-router-dom';
import { Image, LayoutDashboard, LogOut, Users, Shield } from 'lucide-react';

const Sidebar = ({ isOpen }) => {
  const navigate = useNavigate();

  // Safely pull the user data from localStorage and check their role
  const userString = localStorage.getItem('adminUser');
  let isSuperAdmin = false;
  
  try {
    const currentUser = userString ? JSON.parse(userString) : null;
    isSuperAdmin = currentUser?.role === 'superadmin';
  } catch (error) {
    console.error("Failed to parse user data", error);
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminUser');
    toast.success('Logged out successfully!');
    navigate('/login', { replace: true });
  };

  // Define base nav items
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/users', label: 'Leaderboard', icon: Users }, 
    { to: '/banners', label: 'Banners', icon: Image },
  ];

  // Conditionally add Admin Management if the user is a superadmin
  if (isSuperAdmin) {
    navItems.push({ to: '/admin-management', label: 'Admin Management', icon: Shield });
  }

  // Changed text-sm to text-xs, reduced gap and padding
  const navItemClasses = ({ isActive }) => 
    `flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-xs group whitespace-nowrap ${
      isActive 
        ? 'bg-[#FFD100] text-[#004B8D] font-extrabold shadow-sm' 
        : 'hover:bg-white/10 font-medium text-white/85 hover:text-white'
    }`;

  // Reduced icon size to match smaller text
  const iconClasses = (isActive) => 
    `w-4 h-4 min-w-[16px] ${isActive ? 'text-[#004B8D]' : 'opacity-75 group-hover:opacity-100 transition-opacity'}`;

  return (
    <aside 
      className={`bg-[#004B8D] text-white flex flex-col z-20 relative overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen ? 'w-[200px]' : 'w-0'
      }`}
    >
      {/* Navigation Links */}
      <nav className="flex-1 py-6 flex flex-col gap-1.5 px-3 relative z-10">
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
      <div className="p-4 border-t border-white/20">
         <button 
           onClick={handleLogout}
           className="flex items-center gap-2.5 text-xs font-medium text-white/80 hover:text-white transition-colors w-full group whitespace-nowrap"
         >
           <LogOut className="w-4 h-4 min-w-[16px] opacity-75 group-hover:opacity-100 transition-opacity" strokeWidth={1.8} />
           Logout
         </button>
      </div>
    </aside>
  );
};

export default Sidebar;
