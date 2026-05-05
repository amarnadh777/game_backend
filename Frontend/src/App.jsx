import './App.css'

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardBanner from './pages/DashboardBanner'
import Layout from './layouts/Layout';
import UserDetails from './pages/UserDetails';
import Dashboard from './pages/Dashboard';
import { Toaster } from 'react-hot-toast';

function App() {


  return (
    <>
    <Toaster position="top-right" />
<BrowserRouter>
      <Routes>
        
        {/* The Parent Route uses the Layout */}
        <Route path="/" element={<Layout />}>
  
          <Route index element={<Navigate to="/banners" replace />} />
          
          {/* Your Banner Management Page */}
          <Route path="banners" element={<DashboardBanner />} />
          <Route path="users" element={<UserDetails />} />
          <Route path="dashboard" element={<Dashboard />} />




        </Route>

      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
