import React, { useState, useEffect } from 'react';

const DisabledAccountCard = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // The function that runs when Axios triggers the event
    const handleAccountDisabled = () => {
      setIsOpen(true);
    };

    // Listen for the custom event
    window.addEventListener('accountDisabled', handleAccountDisabled);

    return () => {
      window.removeEventListener('accountDisabled', handleAccountDisabled);
    };
  }, []);

  // Make sure this component sits completely on top of everything
  if (!isOpen) return null;

  const handleLogout = () => {
    // 1. Remove tokens ONLY when the user clicks the button
    localStorage.removeItem("token");
    localStorage.removeItem("adminUser");
    
    // 2. Redirect to login page
    window.location.href = "/login?disabled=true";
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center border border-white/20">
        
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-5 shadow-inner">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        {/* Text */}
        <h3 className="text-xl font-extrabold text-slate-800 mb-2 tracking-tight">Account Disabled</h3>
        <p className="text-sm text-slate-500 mb-8 font-medium px-2">
          Your access has been revoked by the administrator. You will now be logged out.
        </p>
        
        {/* Button */}
        <button 
          onClick={handleLogout}
          className="w-full px-6 py-3 text-sm font-bold text-white bg-[#11087C] hover:bg-indigo-800 rounded-xl transition-all shadow-md active:scale-95"
        >
          Acknowledge & Logout
        </button>

      </div>
    </div>
  );
};

export default DisabledAccountCard;