import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '../../services/authService';
import type { User, Session, AuthError } from '@supabase/supabase-js';

// Mock the authService
vi.mock('../../services/authService', () => ({
  authService: {
    getCurrentSession: vi.fn(),
    getCurrentUser: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    refreshSession: vi.fn(),
  },
}));

// Test component that uses the useAuth hook
function TestComponent() {
  const {
    user,
    session,
    loading,
    error,
    signInWithGoogle,
    signOut,
    refreshSession,
    isAuthenticated,
  } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? user.email : 'null'}</div>
      <div data-testid="session">{session ? 'active' : 'null'}</div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="error">{error || 'null'}</div>
      <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
      <button onClick={signInWithGoogle} data-testid="sign-in">
        Sign In
      </button>
      <button onClick={signOut} data-testid="sign-out">
        Sign Out
      </button>
      <button onClick={refreshSession} data-testid="refresh">
        Refresh
      </button>
    </div>
  );
}

// Mock user and session objects
const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: {},
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2023-01-01T00:00:00Z',
} as User;

const mockSession: Session = {
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: mockUser,
} as Session;

const mockAuthError: AuthError = {
  message: 'Authentication failed',
  status: 400,
} as AuthError;

describe('AuthContext', () => {
  let mockUnsubscribe: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockUnsubscribe = vi.fn();
    vi.mocked(authService.onAuthStateChange).mockReturnValue(mockUnsubscribe);
    vi.mocked(authService.getCurrentSession).mockReturnValue(null);
    vi.mocked(authService.getCurrentUser).mockReturnValue(null);
    vi.mocked(authService.signInWithGoogle).mockResolvedValue({
      user: null,
      session: null,
      error: null,
    });
    vi.mocked(authService.signOut).mockResolvedValue({ error: null });
    vi.mocked(authService.refreshSession).mockResolvedValue({
      session: null,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('AuthProvider', () => {
    it('should provide initial auth state', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('session')).toHaveTextContent('null');
      expect(screen.getByTestId('error')).toHaveTextContent('null');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });

    it('should initialize with existing session and user', async () => {
      vi.mocked(authService.getCurrentSession).mockReturnValue(mockSession);
      vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('session')).toHaveTextContent('active');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    });

    it('should refresh session if session exists but no user', async () => {
      vi.mocked(authService.getCurrentSession).mockReturnValue(mockSession);
      vi.mocked(authService.getCurrentUser).mockReturnValueOnce(null).mockReturnValue(mockUser);
      vi.mocked(authService.refreshSession).mockResolvedValue({
        session: mockSession,
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(authService.refreshSession).toHaveBeenCalled();
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('session')).toHaveTextContent('active');
    });

    it('should handle refresh session error during initialization', async () => {
      vi.mocked(authService.getCurrentSession).mockReturnValue(mockSession);
      vi.mocked(authService.getCurrentUser).mockReturnValue(null);
      vi.mocked(authService.refreshSession).mockResolvedValue({
        session: null,
        error: mockAuthError,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('error')).toHaveTextContent('Authentication failed');
    });

    it('should subscribe to auth state changes', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(authService.onAuthStateChange).toHaveBeenCalled();
    });

    it('should unsubscribe from auth state changes on unmount', () => {
      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should handle SIGNED_IN auth state change', async () => {
      let authStateCallback: (event: string, session: Session | null) => void;
      vi.mocked(authService.onAuthStateChange).mockImplementation((callback) => {
        authStateCallback = callback;
        return mockUnsubscribe;
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Simulate SIGNED_IN event
      act(() => {
        authStateCallback('SIGNED_IN', mockSession);
      });

      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('session')).toHaveTextContent('active');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    });

    it('should handle SIGNED_OUT auth state change', async () => {
      let authStateCallback: (event: string, session: Session | null) => void;
      vi.mocked(authService.onAuthStateChange).mockImplementation((callback) => {
        authStateCallback = callback;
        return mockUnsubscribe;
      });

      // Start with authenticated state
      vi.mocked(authService.getCurrentSession).mockReturnValue(mockSession);
      vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      // Simulate SIGNED_OUT event
      act(() => {
        authStateCallback('SIGNED_OUT', null);
      });

      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('session')).toHaveTextContent('null');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });
  });

  describe('Auth actions', () => {
    it('should handle successful Google sign-in', async () => {
      vi.mocked(authService.signInWithGoogle).mockResolvedValue({
        user: null,
        session: null,
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const signInButton = screen.getByTestId('sign-in');
      
      await act(async () => {
        signInButton.click();
      });

      expect(authService.signInWithGoogle).toHaveBeenCalled();
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });

    it('should handle Google sign-in error', async () => {
      vi.mocked(authService.signInWithGoogle).mockResolvedValue({
        user: null,
        session: null,
        error: mockAuthError,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const signInButton = screen.getByTestId('sign-in');
      
      await act(async () => {
        signInButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Authentication failed');
      });
    });

    it('should handle successful sign-out', async () => {
      vi.mocked(authService.signOut).mockResolvedValue({ error: null });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const signOutButton = screen.getByTestId('sign-out');
      
      await act(async () => {
        signOutButton.click();
      });

      expect(authService.signOut).toHaveBeenCalled();
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('session')).toHaveTextContent('null');
    });

    it('should handle sign-out error', async () => {
      vi.mocked(authService.signOut).mockResolvedValue({ error: mockAuthError });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const signOutButton = screen.getByTestId('sign-out');
      
      await act(async () => {
        signOutButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Authentication failed');
      });
    });

    it('should handle successful session refresh', async () => {
      vi.mocked(authService.refreshSession).mockResolvedValue({
        session: mockSession,
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const refreshButton = screen.getByTestId('refresh');
      
      await act(async () => {
        refreshButton.click();
      });

      expect(authService.refreshSession).toHaveBeenCalled();
      expect(screen.getByTestId('session')).toHaveTextContent('active');
    });

    it('should handle session refresh error', async () => {
      vi.mocked(authService.refreshSession).mockResolvedValue({
        session: null,
        error: mockAuthError,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const refreshButton = screen.getByTestId('refresh');
      
      await act(async () => {
        refreshButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Authentication failed');
      });
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should provide auth context when used within AuthProvider', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Verify all context values are available
      expect(screen.getByTestId('user')).toBeInTheDocument();
      expect(screen.getByTestId('session')).toBeInTheDocument();
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(screen.getByTestId('isAuthenticated')).toBeInTheDocument();
      expect(screen.getByTestId('sign-in')).toBeInTheDocument();
      expect(screen.getByTestId('sign-out')).toBeInTheDocument();
      expect(screen.getByTestId('refresh')).toBeInTheDocument();
    });
  });
});