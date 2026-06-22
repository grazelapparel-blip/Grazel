import React, { createContext, useContext, useEffect, useState } from 'react';

export interface UserType {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: UserType | null;
  profile: UserType | null; // Keep profile alias for backwards compatibility
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: (googleUser: {
    googleId: string;
    email: string;
    name?: string;
    avatar?: string;
  }) => Promise<boolean>;
  signUp: (name: string, email: string, password: string, role?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  // Check active token on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('grazel_user_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data as UserType);
          localStorage.setItem('grazel_user_id', data.id);
        } else {
          // Token expired or invalid
          localStorage.removeItem('grazel_user_token');
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to verify token on startup:', err);
        localStorage.removeItem('grazel_user_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
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
      // Only accept user role for regular login
      if (data.user.role === 'admin') {
        throw new Error('Admin users must log in through the admin panel.');
      }
      localStorage.setItem('grazel_user_token', data.token);
      localStorage.setItem('grazel_user_id', data.user.id);
      setUser(data.user as UserType);
      return true;
    } catch (err: any) {
      console.error('Login error:', err.message);
      throw err;
    }
  };

  const signUp = async (name: string, email: string, password: string, role?: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      // Auto-login after successful registration
      if (data.token && data.user) {
        localStorage.setItem('grazel_user_token', data.token);
        localStorage.setItem('grazel_user_id', data.user.id);
        setUser(data.user as UserType);
      }

      return true;
    } catch (err: any) {
      console.error('Registration API Error:', err);
      throw err;
    }
  };

  const signInWithGoogle = async (googleUser: {
    googleId: string;
    email: string;
    name?: string;
    avatar?: string;
  }): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleUser),
      });

      const text = await response.text();
      let data: { message?: string; token?: string; user?: UserType } = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error('Invalid response from authentication server');
        }
      }

      if (!response.ok) {
        throw new Error(data.message || `Google authentication failed (${response.status})`);
      }

      localStorage.setItem('grazel_user_token', data.token);
      localStorage.setItem('grazel_user_id', data.user.id);
      setUser(data.user as UserType);
      return true;
    } catch (err) {
      console.error('Google Login Error:', err);
      throw err;
    }
  };

  const signOut = async () => {
    setLoading(true);
    localStorage.removeItem('grazel_user_token');
    localStorage.removeItem('grazel_fallback_user');
    localStorage.removeItem('grazel_user');
    localStorage.removeItem('grazel_user_id');
    setUser(null);
    setLoading(false);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: user, // Alias compatibility
        loading,
        isAdmin,
        signOut,
        signIn,
        signInWithGoogle,
        signUp,
      }}
    >
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
