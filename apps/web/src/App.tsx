import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/Layout/AppLayout';

import { LoginPage } from './pages/auth/LoginPage';
import { UnauthorizedPage } from './pages/shared/UnauthorizedPage';
import { NotFoundPage } from './pages/shared/NotFoundPage';

import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AttendanceOverviewPage } from './pages/admin/AttendanceOverviewPage';
import { StudentsPage } from './pages/admin/StudentsPage';
import { TeachersPage } from './pages/admin/TeachersPage';
import { ClassesPage } from './pages/admin/ClassesPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { LeaveApprovalsPage } from './pages/admin/LeaveApprovalsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { SettingsPage } from './pages/admin/SettingsPage';

import { TeacherDashboardPage } from './pages/teacher/TeacherDashboardPage';
import { MarkAttendancePage } from './pages/teacher/MarkAttendancePage';
import { AttendanceHistoryPage } from './pages/teacher/AttendanceHistoryPage';

import { ParentDashboardPage } from './pages/parent/ParentDashboardPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1
    }
  }
});

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-slate-500">Authenticating...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
  if (user.role === 'parent') return <Navigate to="/parent/dashboard" replace />;

  return <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<RootRedirect />} />

              {/* Admin Routes */}
              <Route
                path="admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/attendance"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AttendanceOverviewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/students"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <StudentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/teachers"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <TeachersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/classes"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ClassesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/reports"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/leave-approvals"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <LeaveApprovalsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/settings"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Teacher Routes */}
              <Route
                path="teacher/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <TeacherDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="teacher/mark-attendance"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <MarkAttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="teacher/history"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <AttendanceHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="teacher/leaves"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <LeaveApprovalsPage />
                  </ProtectedRoute>
                }
              />

              {/* Parent Routes */}
              <Route
                path="parent/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['parent', 'admin']}>
                    <ParentDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="parent/leaves"
                element={
                  <ProtectedRoute allowedRoles={['parent', 'admin']}>
                    <ParentDashboardPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
