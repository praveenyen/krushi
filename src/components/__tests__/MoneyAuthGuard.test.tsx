import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MoneyAuthGuard from '../MoneyAuthGuard';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import type { User, Session } from '../../services/authService';

// Mock the useAuth hook
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock authService
vi.mock('../../services/authService', () => ({
  authService: {
    isSessionValid: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

// Mock SignInPage component
vi.mock('../SignInPage', () => ({
  default: () => <div data-testid="sign-in-page">Sign In Page</div>,
}));

const mockUseAuth = vi.mocked(useAuth);
const mockAuthService = vi.mocked(authService);

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

describe('MoneyAuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthService.isSessionValid.mockResolvedValue(true);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
  });

  it('shows loading spinner when authentication is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: true,
      error: null,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isAuthenticated: false,
    });

    render(
      <MoneyAuthGuard>
        <div data-testid="protected-content">Protected Content</div>
      </MoneyAuthGuard>
    );
    
    expect(screen.getByText('Securing Money Tracker')).toBeInTheDocument();
    expect(screen.getByText('Verifying your access to financial data...')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sign-in-page')).not.toBeInTheDocument();
  });

  it('shows sign-in page when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      error: null,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isAuthenticated: false,
    });

    render(
      <MoneyAuthGuard>
        <div data-testid="protected-content">Protected Content</div>
      </MoneyAuthGuard>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('sign-in-page')).toBeInTheDocument();
    });
    
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('shows protected content when user is authenticated with valid session', async () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      session: mockSession,
      loading: false,
      error: null,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isAuthenticated: true,
    });

    render(
      <MoneyAuthGuard>
        <div data-testid="protected-content">Protected Content</div>
      </MoneyAuthGuard>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
    
    expect(screen.queryByTestId('sign-in-page')).not.toBeInTheDocument();
    expect(screen.queryByText('Securing Money Tracker')).not.toBeInTheDocument();
  });

  it('shows error when session is invalid', async () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      session: mockSession,
      loading: false,
      error: null,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isAuthenticated: true,
    });

    mockAuthService.isSessionValid.mockResolvedValue(false);

    render(
      <MoneyAuthGuard>
        <div data-testid="protected-content">Protected Content</div>
      </MoneyAuthGuard>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Your session has expired. Please sign in again.')).toBeInTheDocument();
    });
    
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('shows error when user verification fails', async () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      session: mockSession,
      loading: false,
      error: null,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isAuthenticated: true,
    });

    mockAuthService.getCurrentUser.mockResolvedValue(null);

    render(
      <MoneyAuthGuard>
        <div data-testid="protected-content">Protected Content</div>
      </MoneyAuthGuard>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Unable to verify your identity. Please sign in again.')).toBeInTheDocument();
    });
    
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('shows error when session validation throws exception', async () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      session: mockSession,
      loading: false,
      error: null,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isAuthenticated: true,
    });

    mockAuthService.isSessionValid.mockRejectedValue(new Error('Network error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MoneyAuthGuard>
        <div data-testid="protected-content">Protected Content</div>
      </MoneyAuthGuard>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Authentication verification failed. Please try signing in again.')).toBeInTheDocument();
    });
    
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith('Session validation error:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  it('shows auth context error when present', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      error: 'Authentication service unavailable',
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isAuthenticated: false,
    });

    render(
      <MoneyAuthGuard>
        <div data-testid="protected-content">Protected Content</div>
      </MoneyAuthGuard>
    );
    
    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    expect(screen.getByText('Authentication service unavailable')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('shows loading during session validation', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      session: mockSession,
      loading: false,
      error: null,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isAuthenticated: true,
    });

    // Make session validation hang to test loading state
    mockAuthService.isSessionValid.mockImplementation(() => new Promise(() => {}));

    render(
      <MoneyAuthGuard>
        <div data-testid="protected-content">Protected Content</div>
      </MoneyAuthGuard>
    );
    
    expect(screen.getByText('Securing Money Tracker')).toBeInTheDocument();
    expect(screen.getByText('Verifying your access to financial data...')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('handles missing user but valid session', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: mockSession,
      loading: false,
      error: null,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isAuthenticated: false,
    });

    render(
      <MoneyAuthGuard>
        <div data-testid="protected-content">Protected Content</div>
      </MoneyAuthGuard>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('sign-in-page')).toBeInTheDocument();
    });
    
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('handles missing session but valid user', async () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      session: null,
      loading: false,
      error: null,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isAuthenticated: false,
    });

    render(
      <MoneyAuthGuard>
        <div data-testid="protected-content">Protected Content</div>
      </MoneyAuthGuard>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('sign-in-page')).toBeInTheDocument();
    });
    
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
});