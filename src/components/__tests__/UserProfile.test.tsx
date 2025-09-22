import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UserProfile from '../UserProfile';
import { useAuth } from '../../contexts/AuthContext';
import type { User, Session } from '../../services/authService';

// Mock the useAuth hook
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

describe('UserProfile', () => {
  const mockSignOut = vi.fn();
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    user_metadata: {
      full_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser as User,
      session: { access_token: 'token' } as Session,
      loading: false,
      error: null,
      signInWithGoogle: vi.fn(),
      signOut: mockSignOut,
      refreshSession: vi.fn(),
      isAuthenticated: true,
    });
  });

  it('renders nothing when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      error: null,
      signInWithGoogle: vi.fn(),
      signOut: mockSignOut,
      refreshSession: vi.fn(),
      isAuthenticated: false,
    });

    const { container } = render(<UserProfile />);
    expect(container.firstChild).toBeNull();
  });

  it('displays user information when authenticated', () => {
    render(<UserProfile />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /user menu for test user/i })).toBeInTheDocument();
  });

  it('shows user initials when avatar fails to load', () => {
    const userWithoutAvatar = {
      ...mockUser,
      user_metadata: {
        full_name: 'Test User',
        avatar_url: null,
      },
    };

    mockUseAuth.mockReturnValue({
      user: userWithoutAvatar as User,
      session: { access_token: 'token' } as Session,
      loading: false,
      error: null,
      signInWithGoogle: vi.fn(),
      signOut: mockSignOut,
      refreshSession: vi.fn(),
      isAuthenticated: true,
    });

    render(<UserProfile />);
    
    expect(screen.getByText('T')).toBeInTheDocument(); // First letter of "Test User"
  });

  it('opens dropdown menu when profile button is clicked', () => {
    render(<UserProfile />);
    
    const profileButton = screen.getByRole('button', { name: /user menu for test user/i });
    fireEvent.click(profileButton);
    
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('calls signOut when sign out button is clicked', () => {
    render(<UserProfile />);
    
    // Open dropdown
    const profileButton = screen.getByRole('button', { name: /user menu for test user/i });
    fireEvent.click(profileButton);
    
    // Click sign out
    const signOutButton = screen.getByRole('button', { name: /sign out/i });
    fireEvent.click(signOutButton);
    
    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it('closes dropdown when clicking outside', () => {
    render(<UserProfile />);
    
    // Open dropdown
    const profileButton = screen.getByRole('button', { name: /user menu for test user/i });
    fireEvent.click(profileButton);
    
    expect(screen.getByText('Account')).toBeInTheDocument();
    
    // Click outside
    fireEvent.mouseDown(document.body);
    
    expect(screen.queryByText('Account')).not.toBeInTheDocument();
  });

  it('shows loading state when signing out', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser as User,
      session: { access_token: 'token' } as Session,
      loading: true,
      error: null,
      signInWithGoogle: vi.fn(),
      signOut: mockSignOut,
      refreshSession: vi.fn(),
      isAuthenticated: true,
    });

    render(<UserProfile />);
    
    // Open dropdown
    const profileButton = screen.getByRole('button', { name: /user menu for test user/i });
    fireEvent.click(profileButton);
    
    expect(screen.getByText('Signing out...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /signing out/i })).toBeDisabled();
  });
});