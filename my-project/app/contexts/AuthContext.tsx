"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return false;
      }

      // Verify token with backend
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // If backend returns user with new keys, use as is
        if (data.user && data.user.userId && data.user.firstName && data.user.lastName && data.user.email && data.user.role) {
          setUser(data.user);
        } else if (data.user && data.user.id && data.user.first_name && data.user.last_name && data.user.email && data.user.role) {
          // Fallback for old shape
          setUser({
            userId: data.user.id,
            email: data.user.email,
            firstName: data.user.first_name,
            lastName: data.user.last_name,
            role: data.user.role
          });
        } else {
          setUser(null);
        }
        setIsLoading(false);
        return true;
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsLoading(false);
      return false;
    }
  };

  const login = (token: string, userData: User) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    // Clear cookies
    document.cookie = "authToken=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    setUser(null);
    // Redirect to login page
    window.location.href = '/login';
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 