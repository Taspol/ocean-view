'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createSupabaseClient, UserProfile } from '@/lib/supabase';

let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient();
  }
  return supabaseClient;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  signUp: (
    email: string,
    password: string,
    lineId?: string,
    birthdate?: string
  ) => Promise<{ requiresEmailConfirmation: boolean }>;
  logIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  updateProfile: (profileData: { email?: string; line_id?: string; birthdate?: string }) => Promise<UserProfile>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        // First try server-side cookie backed session (works for LIFF/API logins).
        const sessionRes = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
        });
        const sessionData = await sessionRes.json();

        if (sessionData?.authenticated) {
          if (sessionData.profile) {
            setUser(sessionData.profile);
            return;
          }

          if (sessionData.user?.id) {
            const fallbackProfile: UserProfile = {
              id: sessionData.user.id,
              email: sessionData.user.email || '',
              line_id: undefined,
              birthdate: undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            setUser(fallbackProfile);
            return;
          }
        }

        // Fallback to local Supabase browser session for compatibility.
        const supabase = getSupabaseClient();
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.session.user.id)
            .single();

          if (profile) {
            setUser(profile);
          }
        }
      } catch (err) {
        console.error('Error checking user:', err);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    lineId?: string,
    birthdate?: string
  ): Promise<{ requiresEmailConfirmation: boolean }> => {
    try {
      setError(null);
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, line_id: lineId, birthdate }),
        credentials: 'include', // Include cookies in request
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      const requiresEmailConfirmation = !!data.requiresEmailConfirmation;

      if (requiresEmailConfirmation) {
        // No active session yet; user must confirm email first.
        setUser(null);
        return { requiresEmailConfirmation: true };
      }

      // Wait a moment for cookie to be set
      await new Promise(resolve => setTimeout(resolve, 500));

      // Try to fetch user profile from users table
      const supabase = getSupabaseClient();
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profile) {
        setUser(profile);
      } else {
        // If profile doesn't exist yet, create a minimal one
        console.warn('User profile not found immediately after signup, creating minimal profile...');
        const minimalProfile: UserProfile = {
          id: data.user.id,
          email: email,
          line_id: lineId,
          birthdate: birthdate,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setUser(minimalProfile);
      }

      return { requiresEmailConfirmation: false };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      throw err;
    }
  };

  const logIn = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Include cookies in request
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Wait a moment for cookie to be set
      await new Promise(resolve => setTimeout(resolve, 800));

      // Fetch user profile from users table
      const supabase = getSupabaseClient();
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 is "no rows found" - we'll handle that separately
        throw new Error(profileError.message || 'Failed to load user profile');
      }

      if (profile) {
        setUser(profile);
      } else {
        // If profile doesn't exist, create a minimal one from auth data
        console.warn('User profile not found, creating minimal profile...');
        const minimalProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          line_id: undefined,
          birthdate: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setUser(minimalProfile);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    }
  };

  const logOut = async () => {
    try {
      setError(null);
      // Call the logout endpoint to clear the session cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      // Clear local state
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
      throw err;
    }
  };

  const updateProfile = async (profileData: {
    email?: string;
    line_id?: string;
    birthdate?: string;
  }): Promise<UserProfile> => {
    try {
      setError(null);
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update local state with new profile
      setUser(data.profile);
      return data.profile;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      throw err;
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<void> => {
    try {
      setError(null);
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      setError(message);
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signUp,
        logIn,
        logOut,
        updateProfile,
        changePassword,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
