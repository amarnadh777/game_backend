
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Profile = () => {
  const navigate = useNavigate();

  // 1. Added fullName to the state
  const [profile, setProfile] = useState({
    fullName: '',
    userName: '',
    email: '',
    password: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL; 

  // Fetch the profile data when the component loads
  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const adminData = JSON.parse(localStorage.getItem('adminUser')); 
        const adminId = adminData?._id || adminData?.id;

        if (!adminId) {
          toast.error("Admin ID not found. Please log in again.");
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/admin/profile/${adminId}`);
        
        if (response.data.success) {
          setProfile({
            fullName: response.data.data.fullname || '', // 2. Map fullName from backend
            userName: response.data.data.userName || '',
            email: response.data.data.email || '',
            password: '', 
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error(error.response?.data?.message || "Failed to load profile data");
      }
    };

    fetchAdminProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const adminData = JSON.parse(localStorage.getItem('adminUser')); 
      const adminId = adminData?._id || adminData?.id;

      // 3. Include fullName in the payload
      const payload = {
        fullName: profile.fullName,
        userName: profile.userName,
        email: profile.email,
      };

      if (profile.password.trim() !== '') {
        payload.password = profile.password;
      }

      const response = await axios.put(`${API_BASE_URL}/admin/profile/edit/${adminId}`, payload);

      if (response.data.success) {
        toast.success('Admin profile updated successfully!');
        
        // Update local storage with new details
        const updatedLocalAdmin = { 
          ...adminData, 
          fullName: profile.fullName, 
          userName: profile.userName, 
          email: profile.email 
        };
        localStorage.setItem('adminUser', JSON.stringify(updatedLocalAdmin));

        setProfile((prev) => ({ ...prev, password: '' })); 
      }

    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 lg:p-8 w-full animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Settings</h1>
        <p className="text-slate-500 mt-2 text-sm">Update your administrator credentials and manage system access security.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-md shadow-slate-200/50 border border-slate-100 p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <div className="p-2 bg-[#11087C]/10 rounded-lg text-[#11087C]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-800">Administrator Information</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* 4. New Full Name Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
                <input
                  type="text"
                  name="fullName" 
                  value={profile.fullName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#11087C]/20 focus:border-[#11087C] outline-none transition-all duration-200 text-slate-800"
                  required
                />
              </div>
            </div>

            {/* Admin User Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  {/* Changed to an '@' icon to differentiate from Full Name */}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path></svg>
                </div>
                <input
                  type="text"
                  name="userName" 
                  value={profile.userName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#11087C]/20 focus:border-[#11087C] outline-none transition-all duration-200 text-slate-800"
                  required
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Admin Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#11087C]/20 focus:border-[#11087C] outline-none transition-all duration-200 text-slate-800"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={profile.password}
                onChange={handleChange}
                placeholder="Leave blank to keep current password"
                className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#11087C]/20 focus:border-[#11087C] outline-none transition-all duration-200 text-slate-800 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.188-1.583c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29"></path></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                )}
              </button>
            </div>
            {/* <p className="text-xs text-slate-500 mt-2">Password must be at least 8 characters long.</p> */}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
            <button
              type="button"
              className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 transition-all duration-200"
              onClick={() => {
                setProfile({ ...profile, password: '' });
                navigate(-1);
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#11087C] border border-transparent rounded-xl hover:bg-[#0d0663] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#11087C] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm shadow-[#11087C]/30"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Admin Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;