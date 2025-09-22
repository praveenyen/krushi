"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService, type User, type Session } from '../services/authService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get initial session and user
        const currentSession = await authService.getCurrentSession();
        const currentUser = await authService.getCurrentUser();

        setSession(currentSession);
        setUser(currentUser);

        // If we have a session but no user, try to refresh
        if (currentSession && !currentUser) {
          const { session: refreshedSession, error: refreshError } = await authService.refreshSession();
          if (refreshError) {
            console.error('Failed to refresh session:', refreshError);
            setError(refreshError.message);
          } else if (refreshedSession) {
            setSession(refreshedSession);
            const refreshedUser = await authService.getCurrentUser();
            setUser(refreshedUser);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session);
      
      setSession(session);
      setUser(session?.user || null);
      setError(null);

      // Handle specific auth events
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user || null);
        setSession(session);
      }

      // Set loading to false after any auth state change
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.signInWithGoogle();
      
      if (response.error) {
        setError(response.error.message);
        console.error('Google sign-in failed:', response.error);
      }
      // Note: For OAuth, the actual auth state will be updated via onAuthStateChange
      // after the redirect completes
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setError(errorMessage);
      console.error('Sign-in error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { error: signOutError } = await authService.signOut();
      
      if (signOutError) {
        setError(signOutError.message);
        console.error('Sign-out failed:', signOutError);
      } else {
        // Clear state immediately for better UX
        setUser(null);
        setSession(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out';
      setError(errorMessage);
      console.error('Sign-out error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { session: refreshedSession, error: refreshError } = await authService.refreshSession();
      
      if (refreshError) {
        setError(refreshError.message);
        console.error('Session refresh failed:', refreshError);
      } else if (refreshedSession) {
        setSession(refreshedSession);
        setUser(refreshedSession.user);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh session';
      setError(errorMessage);
      console.error('Session refresh error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const isAuthenticated = Boolean(user && session);

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    signInWithGoogle,
    signOut,
    refreshSession,
    isAuthenticated,
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