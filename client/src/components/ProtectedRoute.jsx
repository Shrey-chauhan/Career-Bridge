import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <p>Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div style={styles.forbiddenContainer}>
        <h2>403 — Access Forbidden</h2>
        <p>You do not have permission to access this page.</p>
        <p>Your current role: <strong>{user?.role}</strong></p>
      </div>
    );
  }

  return children;
}

const styles = {
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: '#94a3b8',
    fontFamily: "'Segoe UI', sans-serif",
  },
  forbiddenContainer: {
    padding: '3rem',
    textAlign: 'center',
    color: '#f87171',
    fontFamily: "'Segoe UI', sans-serif",
    backgroundColor: '#0f172a',
    minHeight: '100vh',
  },
};
