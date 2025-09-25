import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useParams, useRouter } from 'next/navigation';
import UserDetailPage from '../page';
import { useMoneyStore } from '../../../../../stores/moneyStore';
import { useAuth } from '../../../../../contexts/AuthContext';
import type { User, Session } from '../../../../../services/authService';
import type { Person, BalanceSummary } from '../../../../../types/money';

// Mock Next.js hooks
vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(),
}));

// Mock the money store
vi.mock('../../../../../stores/moneyStore', () => ({
  useMoneyStore: vi.fn(),
}));

// Mock the useAuth hook
vi.mock('../../../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock components
vi.mock('../../../../../components/TransactionForm', () => ({
  TransactionForm: ({ onSubmit, onCancel }: any) => (
    <div data-testid="transaction-form">
      <button onClick={() => onSubmit({ amount: 100, transaction_type: 'credit' })}>
        Submit Transaction
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock('../../../../../components/TransactionList', () => ({
  default: ({ userId }: { userId: string }) => (
    <div data-testid="transaction-list">Transaction List for {userId}</div>
  ),
}));

vi.mock('../../../../../components/charts/BalanceAreaChart', () => ({
  BalanceAreaChart: ({ data }: { data: any[] }) => (
    <div data-testid="balance-chart">Balance Chart ({data.length} points)</div>
  ),
}));

const mockUseParams = vi.mocked(useParams);
const mockUseRouter = vi.mocked(useRouter);
const mockUseMoneyStore = vi.mocked(useMoneyStore);
const mockUseAuth = vi.mocked(useAuth);

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

const mockPerson: Person = {
  id: 'person-1',
  user_id: 'user-123',
  name: 'John Doe',
  phone_number: '+1234567890',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockBalance: BalanceSummary = {
  person_id: 'person-1',
  person_name: 'John Doe',
  total_credit: 150,
  total_debit: 50,
  net_balance: 100,
  last_transaction_date: '2024-01-01T00:00:00Z',
  transaction_count: 2,
};

describe('User Detail Page Authentication Integration', () => {
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

    mockUseParams.mockReturnValue({ id: 'person-1' });

    mockUseMoneyStore.mockReturnValue({
      transactions: [],
      loading: {
        transactions: false,
        persons: false,
        balances: false,
      },
      errors: {},
      fetchPersons: vi.fn().mockResolvedValue({}),
      fetchTransactions: vi.fn().mockResolvedValue({}),
      fetchBalances: vi.fn().mockResolvedValue({}),
      getPersonById: vi.fn().mockReturnValue(mockPerson),
      getBalanceForPerson: vi.fn().mockReturnValue(mockBalance),
      createTransaction: vi.fn().mockResolvedValue({}),
    } as any);
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

    render(<UserDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('sign-in-page')).toBeInTheDocument();
    });
    
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
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

    render(<UserDetailPage />);
    
    expect(screen.getByText('Securing Money Tracker')).toBeInTheDocument();
    expect(screen.getByText('Verifying your access to financial data...')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('should show user detail page when authenticated', async () => {
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

    render(<UserDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    expect(screen.queryByTestId('sign-in-page')).not.toBeInTheDocument();
  });

  it('should show authentication error when session validation fails', async () => {
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

    render(<UserDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Session expired')).toBeInTheDocument();
    });
    
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('should handle authentication state changes during user detail view', async () => {
    const { rerender } = render(<UserDetailPage />);

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

    rerender(<UserDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
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

    rerender(<UserDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    });
    
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
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
      transactions: [],
      loading: {
        transactions: true,
        persons: true,
        balances: true,
      },
      errors: {},
      fetchPersons: vi.fn(),
      fetchTransactions: vi.fn(),
      fetchBalances: vi.fn(),
      getPersonById: vi.fn().mockReturnValue(undefined),
      getBalanceForPerson: vi.fn().mockReturnValue(undefined),
      createTransaction: vi.fn(),
    } as any);

    render(<UserDetailPage />);
    
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('should handle user not found error when authenticated', async () => {
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
      transactions: [],
      loading: {
        transactions: false,
        persons: false,
        balances: false,
      },
      errors: {},
      fetchPersons: vi.fn(),
      fetchTransactions: vi.fn(),
      fetchBalances: vi.fn(),
      getPersonById: vi.fn().mockReturnValue(undefined),
      getBalanceForPerson: vi.fn().mockReturnValue(undefined),
      createTransaction: vi.fn(),
    } as any);

    render(<UserDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('User Not Found')).toBeInTheDocument();
      expect(screen.getByText("The user you're looking for doesn't exist or you don't have permission to view it.")).toBeInTheDocument();
    });
  });

  it('should verify user has access to the specific person data', async () => {
    const fetchPersons = vi.fn().mockResolvedValue({});
    const fetchTransactions = vi.fn().mockResolvedValue({});
    const fetchBalances = vi.fn().mockResolvedValue({});

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
      transactions: [],
      loading: {
        transactions: false,
        persons: false,
        balances: false,
      },
      errors: {},
      fetchPersons,
      fetchTransactions,
      fetchBalances,
      getPersonById: vi.fn().mockReturnValue(mockPerson),
      getBalanceForPerson: vi.fn().mockReturnValue(mockBalance),
      createTransaction: vi.fn(),
    } as any);

    render(<UserDetailPage />);
    
    await waitFor(() => {
      expect(fetchPersons).toHaveBeenCalled();
      expect(fetchTransactions).toHaveBeenCalledWith({ person_id: 'person-1' });
      expect(fetchBalances).toHaveBeenCalled();
    });
  });

  it('should handle data access errors gracefully', async () => {
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
      transactions: [],
      loading: {
        transactions: false,
        persons: false,
        balances: false,
      },
      errors: {
        general: 'Access denied: insufficient permissions',
      },
      fetchPersons: vi.fn().mockRejectedValue(new Error('Access denied')),
      fetchTransactions: vi.fn(),
      fetchBalances: vi.fn(),
      getPersonById: vi.fn().mockReturnValue(mockPerson),
      getBalanceForPerson: vi.fn().mockReturnValue(mockBalance),
      createTransaction: vi.fn(),
    } as any);

    render(<UserDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Access denied: insufficient permissions')).toBeInTheDocument();
    });
  });
});