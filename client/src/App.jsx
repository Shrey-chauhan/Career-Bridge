import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StudentProfile from './pages/StudentProfile';
import CompanyProfile from './pages/CompanyProfile';
import CompanyJobs from './pages/company/CompanyJobs';
import CreateEditJob from './pages/company/CreateEditJob';
import StudentJobs from './pages/student/StudentJobs';
import JobDetails from './pages/student/JobDetails';
import StudentApplications from './pages/student/Applications';
import StudentApplicationDetails from './pages/student/ApplicationDetails';
import CompanyApplications from './pages/company/Applications';
import CompanyApplicationDetails from './pages/company/ApplicationDetails';
import Notifications from './pages/notifications/Notifications';
import StudentInterviews from './pages/student/StudentInterviews';
import CompanyInterviews from './pages/company/CompanyInterviews';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStudents from './pages/admin/AdminStudents';
import AdminStudentDetails from './pages/admin/AdminStudentDetails';
import AdminCompanies from './pages/admin/AdminCompanies';
import AdminJobs from './pages/admin/AdminJobs';
import AdminApplications from './pages/admin/AdminApplications';
import AdminInterviews from './pages/admin/AdminInterviews';
import AdminPlacementDrives from './pages/admin/AdminPlacementDrives';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminAnalytics from './pages/admin/AdminAnalytics';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TPO']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TPO']}>
                  <AdminStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students/:id"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TPO']}>
                  <AdminStudentDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/companies"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TPO']}>
                  <AdminCompanies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/jobs"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TPO']}>
                  <AdminJobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/applications"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TPO']}>
                  <AdminApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/interviews"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TPO']}>
                  <AdminInterviews />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/drives"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TPO']}>
                  <AdminPlacementDrives />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TPO']}>
                  <AdminAuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TPO']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/interviews"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentInterviews />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company/interviews"
              element={
                <ProtectedRoute allowedRoles={['COMPANY']}>
                  <CompanyInterviews />
                </ProtectedRoute>
              }
            />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/profile"
            element={
              <ProtectedRoute allowedRoles={['COMPANY']}>
                <CompanyProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/jobs"
            element={
              <ProtectedRoute allowedRoles={['COMPANY']}>
                <CompanyJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/jobs/create"
            element={
              <ProtectedRoute allowedRoles={['COMPANY']}>
                <CreateEditJob />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/jobs/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['COMPANY']}>
                <CreateEditJob />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/applications"
            element={
              <ProtectedRoute allowedRoles={['COMPANY']}>
                <CompanyApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/applications/:id"
            element={
              <ProtectedRoute allowedRoles={['COMPANY']}>
                <CompanyApplicationDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/jobs"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/jobs/:id"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <JobDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/applications"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/applications/:id"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentApplicationDetails />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </NotificationProvider>
  </AuthProvider>
);
}
