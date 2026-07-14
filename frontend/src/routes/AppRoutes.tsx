import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import Login from '../pages/Login';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import AppShell from '../components/AppShell';
import Dashboard from '../pages/Dashboard';
import TenantSetup from '../pages/TenantSetup';
import Unauthorized from '../pages/Unauthorized';
import type { UserRoleType } from '../types';

interface GuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRoleType[];
}

export const ProtectedRoute: React.FC<GuardProps> = ({ children, allowedRoles }) => {
  const { token, user, activeRole } = useAuthStore();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // ActiveRole must match the allowed roles if restricted
  if (allowedRoles && activeRole && !allowedRoles.includes(activeRole)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth screens */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/403" element={<Unauthorized />} />

        {/* Protected App shell wrapper */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          {/* Unified dynamic dashboard route based on user roles */}
          <Route index element={<Dashboard />} />
          
          {/* Institutional Setup and profile configuration */}
          <Route
            path="tenant-setup"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'college_admin']}>
                <TenantSetup />
              </ProtectedRoute>
            }
          />

          {/* Root redirect catch */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
