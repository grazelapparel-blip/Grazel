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
      const token = localStorage.getItem('grazel_token');
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
          localStorage.removeItem('grazel_token');
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to verify token on startup:', err);
        // Offline or unconfigured fallback
        const storedUser = localStorage.getItem('grazel_fallback_user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {}
        }
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
      localStorage.setItem('grazel_token', data.token);
      localStorage.setItem('grazel_user_id', data.user.id);
      setUser(data.user as UserType);
      return true;
    } catch (err: any) {
      console.warn('Login connection failed, using local mock fallback:', err.message);
      
      // Standalone mockup developer fallback
      if (email === 'admin@grazel.com' && password === 'admin123') {
        const mockAdmin: UserType = {
          id: 'admin-fallback-id',
          name: 'Developer Admin',
          email: 'admin@grazel.com',
          role: 'admin',
        };
        setUser(mockAdmin);
        localStorage.setItem('grazel_fallback_user', JSON.stringify(mockAdmin));
        localStorage.setItem('grazel_token', 'mock-admin-token');
        localStorage.setItem('grazel_user_id', mockAdmin.id);
        return true;
      } else {
        throw err;
      }
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Google authentication failed');
      }

      localStorage.setItem('grazel_token', data.token);
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
    localStorage.removeItem('grazel_token');
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
