import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios'; 
import axiosInstance from '../api/axios';

const AdminManagement = () => {
  // --- State Management ---
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form State
  const initialFormState = {
    userName: '',
    fullname: '',
    email: '',
    password: '',
    role: 'admin', 
    isActive: true
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- Fetch Initial Data ---
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await axiosInstance.get(`/admin/list`);
        if (response.data.success) {
          setAdmins(response.data.data);
        }
      } catch (error) {
        console.error("API Error fetching admins:", error);
        toast.error("Failed to load administrators.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (admin) => {
    setFormData({ ...admin, password: '' }); 
    setCurrentAdminId(admin._id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // ==========================================
  // AXIOS API INTEGRATION (CREATE & EDIT)
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isEditing) {
      // 1. REAL PUT REQUEST TO EDIT ADMIN
      try {
        const payload = {
          fullname: formData.fullname,
          userName: formData.userName,
          email: formData.email,
        };
        
        // Only include password if the user typed a new one
        if (formData.password) {
          payload.password = formData.password;
        }

        const response = await axiosInstance.put(`/admin/profile/edit/${currentAdminId}`, payload);

        if (response.data.success) {
          // Replace the old admin data in the state with the newly updated data from the backend
          const updatedAdmin = response.data.data;
          setAdmins(admins.map(a => a._id === currentAdminId ? updatedAdmin : a));
          
          toast.success(response.data.message); // Displays "Admin profile updated successfully"
          setIsModalOpen(false);
        }
      } catch (error) {
        console.error("API Error updating admin:", error);
        if (error.response && error.response.data) {
          toast.error(error.response.data.message || "Failed to update admin profile");
        } else {
          toast.error("Server error. Please check your connection.");
        }
      }
    } else {
      // 2. REAL POST REQUEST TO CREATE ADMIN
      try {
        const response = await axiosInstance.post(`/admin/create-with-temp-password`, {
          fullname: formData.fullname,
          userName: formData.userName,
          email: formData.email
          // Password omitted for creation as per request
        });

        const data = response.data;

        if (data.success) {
          const newAdmin = { 
            _id: data.data.id, 
            userName: data.data.userName,
            fullname: data.data.fullname,
            email: data.data.email,
            isActive: data.data.isActive,
            role: 'admin' 
          }; 
          
          setAdmins([...admins, newAdmin]);
          toast.success(data.message); 
          setIsModalOpen(false);
        }
      } catch (error) {
        console.error("API Error creating admin:", error);
        if (error.response && error.response.data) {
          toast.error(error.response.data.message || "Failed to create admin");
        } else {
          toast.error("Server error. Please check your connection.");
        }
      }
    }
  };

  // ==========================================
  // AXIOS API INTEGRATION (TOGGLE STATUS)
  // ==========================================
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const response = await axiosInstance.patch(`/admin/toggle-status/${id}`, {}, {
        // headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        setAdmins(admins.map(a => a._id === id ? { ...a, isActive: response.data.isActive } : a));
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error("API Error toggling status:", error);
      if (error.response && error.response.data) {
        toast.error(error.response.data.message || "Failed to update status");
      } else {
        toast.error("Server error. Please check your connection.");
      }
    }
  };

  const openDeleteModal = (admin) => {
    setAdminToDelete(admin);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setAdminToDelete(null);
  };

  // ==========================================
  // AXIOS API INTEGRATION (DELETE)
  // ==========================================
  const handleDelete = async () => {
    if (!adminToDelete) return;
    setIsDeleting(true);
    
    try {
      const response = await axiosInstance.delete(`/admin/delete/${adminToDelete._id}`, {
        // headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        // Remove the deleted admin from the state
        setAdmins(admins.filter(a => a._id !== adminToDelete._id));
        toast.success(response.data.message || 'Admin deleted successfully');
        closeDeleteModal();
      }
    } catch (error) {
      console.error("API Error deleting admin:", error);
      if (error.response && error.response.data) {
        toast.error(error.response.data.message || "Failed to delete admin");
      } else {
        toast.error("Server error. Please check your connection.");
      }
    } finally {
      setIsDeleting(false); // Stop the loading state on the button
    }
  };

  // --- UI Render ---
  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Management</h1>
          <p className="text-gray-500 mt-1">Create, update, disable, and remove administrators.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-[#11087C] hover:bg-indigo-800 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Add New Admin
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" className="text-center py-8">Loading admins...</td></tr>
              ) : admins.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-500">No admins found.</td></tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{admin.fullname}</td>
                    <td className="px-6 py-4">@{admin.userName}</td>
                    <td className="px-6 py-4">{admin.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${admin.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {admin.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-3">
                      <button onClick={() => openEditModal(admin)} className="text-blue-600 hover:text-blue-900 transition-colors" title="Edit">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleToggleStatus(admin._id, admin.isActive)} className={`${admin.isActive ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'} transition-colors`} title={admin.isActive ? "Disable Admin" : "Enable Admin"}>
                        {admin.isActive ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                      </button>
                      <button onClick={() => openDeleteModal(admin)} className="text-red-600 hover:text-red-900 transition-colors" title="Delete">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">{isEditing ? 'Edit Admin' : 'Create New Admin'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input required type="text" name="fullname" value={formData.fullname} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#11087C] focus:border-[#11087C] outline-none transition-all" placeholder="John Doe" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input required type="text" name="userName" value={formData.userName} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#11087C] focus:border-[#11087C] outline-none transition-all" placeholder="johndoe123" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#11087C] focus:border-[#11087C] outline-none transition-all" placeholder="john@example.com" />
              </div>

              {/* Password field only shown when editing an admin */}
              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-xs text-gray-400 font-normal">(Leave blank to keep current)</span>
                  </label>
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#11087C] focus:border-[#11087C] outline-none transition-all" placeholder="••••••••" />
                </div>
              )}

              <div className="mt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-[#11087C] text-white font-medium rounded-lg hover:bg-indigo-800 transition-colors shadow-md">
                  {isEditing ? 'Save Changes' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Overlay */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center border border-white/20">
            <h3 className="text-xl font-extrabold text-slate-800 mb-2 tracking-tight">Delete Admin?</h3>
            <p className="text-sm text-slate-500 mb-8 font-medium">
              Are you sure you want to remove <strong className="text-slate-800">@{adminToDelete?.userName}</strong>? This action is permanent.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full px-6 py-3 text-sm font-bold text-white bg-[#990000] hover:bg-red-800 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Admin'}
              </button>
              <button 
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="w-full px-6 py-3 text-sm font-bold border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 rounded-xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;