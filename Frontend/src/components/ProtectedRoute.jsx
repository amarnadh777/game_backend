import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Check if the token exists in localStorage
  const token = localStorage.getItem('token');

  // If there is no token, redirect to the login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If there is a token, render the child routes (which will be your Layout and Dashboard)
  return <Outlet />;
};

export default ProtectedRoute;