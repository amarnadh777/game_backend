import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardBanner from './pages/DashboardBanner'
import Login from "./pages/Login"
import Layout from './layouts/Layout';
import UserDetails from './pages/UserDetails';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute'; // Import the new component
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          
          {/* Public Route (No Layout, No Protection) */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes Wrapper */}
          <Route element={<ProtectedRoute />}>
            
            {/* Everything inside here is now protected! */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/banners" replace />} />
              
              {/* Your Management Pages */}
              <Route path="banners" element={<DashboardBanner />} />
              <Route path="users" element={<UserDetails />} />
              <Route path="dashboard" element={<Dashboard />} />
            </Route>

          </Route>

        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App