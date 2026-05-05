import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar'; 
import Header from '../components/Header';   

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);


  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };
  return (
    // Root container is now flex-col so Header is on top of everything
    <div className="flex flex-col h-screen font-sans text-slate-800">
      
      {/* Full-width Header at the top */}
      <Header toggleSidebar={toggleSidebar} />

      {/* Bottom section: Sidebar on left, Main content on right */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar sits under the Header */}
        <Sidebar isOpen={isSidebarOpen} />

        {/* Main content area (scrollable) */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <Outlet />
        </main>
        
      </div>

    </div>
  );
};

export default Layout;