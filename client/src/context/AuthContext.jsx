import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, registerApi, getMeApi, logoutApi } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user on startup if token exists
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const data = await getMeApi();
          if (data.success && data.user) {
            setUser(data.user);
            setToken(storedToken);
            setIsAuthenticated(true);
          } else {
            handleLogoutState();
          }
        } catch (error) {
          console.error('Failed to restore authentication state:', error);
          handleLogoutState();
        }
      } else {
        handleLogoutState();
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const handleLogoutState = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  const login = async (email, password) => {
    const res = await loginApi({ email, password });
    if (res.success && res.token && res.user) {
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setUser(res.user);
      setIsAuthenticated(true);
    }
    return res;
  };

  const register = async (name, email, password, role) => {
    const res = await registerApi({ name, email, password, role });
    if (res.success && res.token && res.user) {
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setUser(res.user);
      setIsAuthenticated(true);
    }
    return res;
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.warn('Logout endpoint error:', error);
    } finally {
      handleLogoutState();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
