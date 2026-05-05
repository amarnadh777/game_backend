import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar'; 
import Header from '../components/Header';   

const Layout = () => {
  return (
    // Root container is now flex-col so Header is on top of everything
    <div className="flex flex-col h-screen font-sans text-[#101820]">
      
      {/* Full-width Header at the top */}
      <Header />

      {/* Bottom section: Sidebar on left, Main content on right */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar sits under the Header */}
        <Sidebar />

        {/* Main content area (scrollable) */}
        <main className="flex-1 overflow-y-auto bg-[#F4F8FC]">
          <Outlet />
        </main>
        
      </div>

    </div>
  );
};

export default Layout;
