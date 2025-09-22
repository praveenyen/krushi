import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuthGuard from '../AuthGuard';
import { useAuth } from '../../contexts/AuthContext';
import type { User, Session } from '../../services/authService';

// Mock the useAuth hook
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock SignInPage component
vi.mock('../SignInPage', () => ({
  default: () => <div data-testid="sign-in-page">Sign In Page</div>,
}));

const mockUseAuth = vi.mocked(useAuth);

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      <AuthGuard>
        <div data-testid="protected-content">Protected Content</div>
      </AuthGuard>
    );
    
    expect(screen.getByText('Loading Krushi')).toBeInTheDocument();
    expect(screen.getByText('Checking your authentication status...')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sign-in-page')).not.toBeInTheDocument();
  });

  it('shows sign-in page when user is not authenticated', () => {
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
      <AuthGuard>
        <div data-testid="protected-content">Protected Content</div>
      </AuthGuard>
    );
    
    expect(screen.getByTestId('sign-in-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByText('Loading Krushi')).not.toBeInTheDocument();
  });

  it('shows protected content when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' } as User,
      session: { access_token: 'token' } as Session,
      loading: false,
      error: null,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isAuthenticated: true,
    });

    render(
      <AuthGuard>
        <div data-testid="protected-content">Protected Content</div>
      </AuthGuard>
    );
    
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('sign-in-page')).not.toBeInTheDocument();
    expect(screen.queryByText('Loading Krushi')).not.toBeInTheDocument();
  });
});