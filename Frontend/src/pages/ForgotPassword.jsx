import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import logo from '../assets/kanoologo.png';

const ForgotPassword = () => {
  const navigate = useNavigate();
  
  // -- State variables --
  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP & Reset
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for toggling password visibility
  
  // Form Data
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // =====================================
  // STEP 1: Request OTP
  // =====================================
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/admin/forgot-password`, { email });
      if (response.data.success) {
        toast.success("OTP sent to your email!");
        setStep(2); // Move to the next screen instantly!
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================
  // STEP 2: Verify OTP & Reset Password
  // =====================================
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      toast.error("Please enter both OTP and new password");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/admin/reset-password`, { 
        email, 
        otp, 
        newPassword 
      });
      
      if (response.data.success) {
        toast.success("Password reset successfully!");
        navigate('/'); // Send them back to Login
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP or request failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#EBF5FF] p-6 relative overflow-hidden">
      
      {/* Decorative background blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#004B8D] opacity-5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FFD100] opacity-15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[440px] p-8 md:p-10 relative z-10 border border-white">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-auto h-16 mb-6 flex items-center justify-center bg-[#004B8D] p-4 rounded-xl shadow-inner">
             <img src={logo} alt="Kanoo Logo" className="h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-wide mb-2">
            {step === 1 ? 'Forgot Password' : 'Reset Password'}
          </h1>
          <p className="text-sm font-medium text-gray-500 text-center">
            {step === 1 
              ? "Enter your email address and we'll send you a 4-digit OTP." 
              : `Enter the OTP sent to ${email} and your new password.`}
          </p>
        </div>

        {/* ======================= UI FOR STEP 1 ======================= */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-gray-700 ml-1">Email Address</label>
              <input
                type="email" 
                required
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-800 text-sm py-3 px-4 rounded-lg outline-none focus:ring-2 focus:ring-[#004B8D] transition-all w-full"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className={`mt-2 w-full bg-[#FFD100] text-[#004B8D] text-[15px] font-bold py-3 px-5 rounded-lg transition-transform ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-[#FFD100]/40 active:scale-95'}`}
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* ======================= UI FOR STEP 2 ======================= */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
            
            {/* OTP Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-gray-700 ml-1">4-Digit OTP</label>
              <input
                type="text" 
                required
                maxLength="4"
                placeholder="e.g. 1234"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Only allow numbers
                className="bg-gray-50 border border-gray-200 text-gray-800 text-center text-lg tracking-[8px] font-bold py-3 px-4 rounded-lg outline-none focus:ring-2 focus:ring-[#004B8D] transition-all w-full"
              />
            </div>

            {/* New Password Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-gray-700 ml-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-gray-800 text-sm py-3 px-4 pr-12 rounded-lg outline-none focus:ring-2 focus:ring-[#004B8D] transition-all w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className={`mt-2 w-full bg-[#004B8D] text-white text-[15px] font-bold py-3 px-5 rounded-lg transition-transform ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#003A6F] active:scale-95'}`}
            >
              {isLoading ? 'Resetting...' : 'Verify & Reset Password'}
            </button>
            
            {/* Let them go back if they made a typo in their email */}
            <button 
              type="button" 
              onClick={() => setStep(1)}
              className="text-[12px] text-gray-500 hover:text-[#004B8D] font-semibold mt-1 transition-colors"
            >
              Change Email Address
            </button>
          </form>
        )}

        {/* Back to Login Link */}
        <div className="mt-8 text-center">
          <Link to="/" className="text-[13px] font-semibold text-[#004B8D] hover:text-[#003A6F] hover:underline transition-colors">
            &larr; Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;