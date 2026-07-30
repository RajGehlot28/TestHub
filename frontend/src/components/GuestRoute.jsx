import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Redirects already-authenticated users to their own dashboard
export const GuestRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && user && user.role) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
  }

  return <>{children}</>;
};
