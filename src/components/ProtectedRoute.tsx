import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import AccessDenied from './AccessDenied';

// Hardcoded admin user ID - only this user can access the app
const ADMIN_USER_ID = 'f414636e-b795-4d4e-9a95-64ebc3f8b9bd';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the attempted URL for redirecting after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show access denied if not the admin user
  if (user?.id !== ADMIN_USER_ID) {
    return <AccessDenied />;
  }

  // Render the protected content
  return <Outlet />;
};

export default ProtectedRoute;
