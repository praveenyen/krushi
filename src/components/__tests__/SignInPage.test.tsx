import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SignInPage from '../SignInPage';
import { useAuth } from '../../contexts/AuthContext';

// Mock the useAuth hook
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

describe('SignInPage', () => {
  const mockSignInWithGoogle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      error: null,
      signInWithGoogle: mockSignInWithGoogle,
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isAuthenticated: false,
    });
  });

  it('renders the sign-in page with welcome message', () => {
    render(<SignInPage />);
    
    expect(screen.getByText('Welcome to Krushi')).toBeInTheDocument();
    expect(screen.getByText(/Harness the power of your daily effort/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('calls signInWithGoogle when sign-in button is clicked', async () => {
    render(<SignInPage />);
    
    const signInButton = screen.getByRole('button', { name: /sign in with google/i });
    fireEvent.click(signInButton);
    
    expect(mockSignInWithGoogle).toHaveBeenCalledOnce();
  });

  it('shows loading state when authentication is in progress', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: true,
      error: null,
      signInWithGoogle: mockSignInWithGoogle,
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isAuthenticated: false,
    });

    render(<SignInPage />);
    
    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeDisabled();
  });

  it('displays error message when authentication fails', () => {
    const errorMessage = 'Authentication failed';
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      error: errorMessage,
      signInWithGoogle: mockSignInWithGoogle,
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isAuthenticated: false,
    });

    render(<SignInPage />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows benefits of signing in', () => {
    render(<SignInPage />);
    
    expect(screen.getByText('Why sign in?')).toBeInTheDocument();
    expect(screen.getByText('Sync your todos across all devices')).toBeInTheDocument();
    expect(screen.getByText('Never lose your progress')).toBeInTheDocument();
    expect(screen.getByText('Sync theme and timer preferences')).toBeInTheDocument();
  });
});