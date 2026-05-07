import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Added Link here
import axios from 'axios';
import toast from 'react-hot-toast';
import logo from '../assets/kanoologo.png';

const Login = () => {
  // Using 'identifier' to allow either email or username to match our backend logic
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Basic frontend validation
    if (!identifier || !password) {
      toast.error("Please enter both email/username and password");
      return;
    }

    setIsLoading(true);

    try {
      // Send both as email and username so the backend's $or logic picks it up correctly
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/admin/login`, {
        email: identifier,
        username: identifier, 
        password: password
      });

      if (response.data.success) {
        toast.success("Login successful!");
        
        // Store the token and admin info in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(response.data.data));

        // Navigate to the dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      // Extract the error message from the backend response
      const errorMessage = error.response?.data?.message || "Failed to login. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#EBF5FF] p-6 relative overflow-hidden">
      
      {/* Decorative background blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#11087C] opacity-5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#F1C82A] opacity-10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Login Card */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[440px] p-8 md:p-10 relative z-10 border border-white">
        
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-auto h-16 mb-6 flex items-center justify-center bg-[#11087C] p-4 rounded-xl shadow-inner">
             <img src={logo} alt="Kanoo Logo" className="h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-wide mb-2">
            Admin Login
          </h1>
          <p className="text-sm font-medium text-gray-500 text-center">
            Welcome to Kanoo Daily Rental. Please sign in to continue.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          
          {/* Email/Username Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-gray-700 ml-1">
              Email or Username
            </label>
            <input
              type="text" 
              required
              placeholder="Enter your email or username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-800 text-sm py-3 px-4 rounded-lg outline-none focus:ring-2 focus:ring-[#0A3D81] transition-all w-full"
            />
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[13px] font-bold text-gray-700">
                Password
              </label>
              {/* NEW: Forgot Password Link */}
              <Link 
                to="/forgot-password" 
                className="text-[12px] font-semibold text-[#0A3D81] hover:text-[#11087C] hover:underline transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-800 text-sm py-3 px-4 rounded-lg outline-none focus:ring-2 focus:ring-[#0A3D81] transition-all w-full"
            />
          </div>

          {/* Login Button */}
          <button 
            type="submit"
            disabled={isLoading}
            className={`mt-4 w-full bg-gradient-to-r from-[#FDE57E] to-[#F1C82A] text-slate-800 text-[15px] font-bold py-3 px-5 rounded-lg transition-transform flex items-center justify-center gap-2 ${
              isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-[#F1C82A]/20 active:scale-95'
            }`}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
            {!isLoading && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;