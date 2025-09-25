import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import MoneyPage from '../page';
import { useAuth } from '../../../contexts/AuthContext';
import { useMoneyStore } from '../../../stores/moneyStore';
import { authService } from '../../../services/authService';
import type { User, Session } from '../../../services/authService';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock the useAuth hook
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock the money store
vi.mock('../../../stores/moneyStore', () => ({
  useMoneyStore: vi.fn(),
}));

// Mock authService
vi.mock('../../../services/authService', () => ({
  authService: {
    isSessionValid: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

// Mock MoneyDashboard component
vi.mock('../../../components/MoneyDashboard', () => ({
  default: () => <div data-testid="money-dashboard">Money Dashboard</div>,
}));

// Mock TransactionForm component
vi.mock('../../../components/TransactionForm', () => ({
  default: ({ onSubmit, onCancel }: any) => (
    <div data-testid="transaction-form">
      <button onClick={() => onSubmit({ amount: 100, transaction_type: 'credit' })}>
        Submit
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseMoneyStore = vi.mocked(useMoneyStore);
const mockUseRouter = vi.mocked(useRouter);
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

describe('Money Page Authentication Integration', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    } as any);

    mockUseMoneyStore.mockReturnValue({
      createTransaction: vi.fn().mockResolvedValue({}),
      loading: {
        transactions: false,
        persons: false,
        balances: false,
      },
      errors: {},
      refreshData: vi.fn().mockResolvedValue({}),
    } as any);

    // Mock authService methods
    mockAuthService.isSessionValid.mockResolvedValue(true);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
  });

  it('should show sign-in page when user is not authenticated', async () => {
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

    render(<MoneyPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Welcome to Krushi')).toBeInTheDocument();
    });
    
    expect(screen.queryByTestId('money-dashboard')).not.toBeInTheDocument();
  });

  it('should show loading state during authentication', () => {
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

    render(<MoneyPage />);
    
    expect(screen.getByText('Securing Money Tracker')).toBeInTheDocument();
    expect(screen.getByText('Verifying your access to financial data...')).toBeInTheDocument();
    expect(screen.queryByTestId('money-dashboard')).not.toBeInTheDocument();
  });

  it('should show money dashboard when user is authenticated', async () => {
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

    render(<MoneyPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('money-dashboard')).toBeInTheDocument();
    });
    
    expect(screen.queryByTestId('sign-in-page')).not.toBeInTheDocument();
  });

  it('should show error state when authentication fails', async () => {
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

    render(<MoneyPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Authentication service unavailable')).toBeInTheDocument();
    });
    
    expect(screen.queryByTestId('money-dashboard')).not.toBeInTheDocument();
  });

  it('should show loading state when money data is loading', () => {
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

    mockUseMoneyStore.mockReturnValue({
      createTransaction: vi.fn(),
      loading: {
        transactions: true,
        persons: true,
        balances: true,
      },
      errors: {},
      refreshData: vi.fn(),
    } as any);

    render(<MoneyPage />);
    
    expect(screen.getByText('Loading your financial data...')).toBeInTheDocument();
    expect(screen.queryByTestId('money-dashboard')).not.toBeInTheDocument();
  });

  it('should show error state when money data fails to load', () => {
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

    mockUseMoneyStore.mockReturnValue({
      createTransaction: vi.fn(),
      loading: {
        transactions: false,
        persons: false,
        balances: false,
      },
      errors: {
        general: 'Failed to load financial data',
      },
      refreshData: vi.fn(),
    } as any);

    render(<MoneyPage />);
    
    expect(screen.getByText('Unable to Load Data')).toBeInTheDocument();
    expect(screen.getByText('Failed to load financial data')).toBeInTheDocument();
    expect(screen.queryByTestId('money-dashboard')).not.toBeInTheDocument();
  });

  it('should handle authentication state changes during session', async () => {
    const { rerender } = render(<MoneyPage />);

    // Start unauthenticated
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

    rerender(<MoneyPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Welcome to Krushi')).toBeInTheDocument();
    });

    // Simulate successful authentication
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

    rerender(<MoneyPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('money-dashboard')).toBeInTheDocument();
    });
    
    expect(screen.queryByTestId('sign-in-page')).not.toBeInTheDocument();
  });

  it('should handle session expiration gracefully', async () => {
    const { rerender } = render(<MoneyPage />);

    // Start authenticated
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

    rerender(<MoneyPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('money-dashboard')).toBeInTheDocument();
    });

    // Simulate session expiration
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      error: 'Session expired',
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isAuthenticated: false,
    });

    rerender(<MoneyPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Session expired')).toBeInTheDocument();
    });
    
    expect(screen.queryByTestId('money-dashboard')).not.toBeInTheDocument();
  });
});