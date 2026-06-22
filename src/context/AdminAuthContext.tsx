import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin';
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  adminSignIn: (email: string, password: string) => Promise<boolean>;
  adminSignOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check admin token on mount (separate from user token)
  useEffect(() => {
    const loadAdmin = async () => {
      const adminToken = localStorage.getItem('grazel_admin_token');
      if (!adminToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Only set if user is actually admin
          if (data.role === 'admin') {
            setAdmin(data as AdminUser);
            localStorage.setItem('grazel_admin_id', data.id);
          } else {
            // Token is for non-admin user, clear it
            localStorage.removeItem('grazel_admin_token');
            setAdmin(null);
          }
        } else {
          // Token expired or invalid
          localStorage.removeItem('grazel_admin_token');
          setAdmin(null);
        }
      } catch (err) {
        console.error('Failed to verify admin token on startup:', err);
        localStorage.removeItem('grazel_admin_token');
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    };

    loadAdmin();
  }, []);

  const adminSignIn = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Authentication failed');
      }

      const data = await response.json();

      // Only accept admin role
      if (data.user.role !== 'admin') {
        throw new Error('Admin access required. User account detected.');
      }

      // Store in admin-specific storage keys
      localStorage.setItem('grazel_admin_token', data.token);
      localStorage.setItem('grazel_admin_id', data.user.id);
      setAdmin(data.user as AdminUser);
      return true;
    } catch (err: any) {
      console.error('Admin login error:', err.message);
      throw err;
    }
  };

  const adminSignOut = async () => {
    setLoading(true);
    // Clear ONLY admin tokens - never touch user tokens
    localStorage.removeItem('grazel_admin_token');
    localStorage.removeItem('grazel_admin_id');
    setAdmin(null);
    setLoading(false);
  };

  const isAuthenticated = !!admin;

  return (
    <AdminAuthContext.Provider value={{ admin, loading, isAuthenticated, adminSignIn, adminSignOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
