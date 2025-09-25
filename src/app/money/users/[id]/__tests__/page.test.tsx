import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useParams, useRouter } from 'next/navigation';
import UserDetailPage from '../page';
import { useMoneyStore } from '../../../../../stores/moneyStore';
import type { Person, Transaction, BalanceSummary } from '../../../../../types/money';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock the money store
jest.mock('../../../../../stores/moneyStore', () => ({
  useMoneyStore: jest.fn(),
}));

// Mock components
jest.mock('../../../../../components/TransactionForm', () => ({
  TransactionForm: ({ onSubmit, onCancel, preselectedPersonId }: any) => (
    <div data-testid="transaction-form">
      <div>Preselected Person ID: {preselectedPersonId}</div>
      <button onClick={() => onSubmit({ amount: 100, transaction_type: 'credit' })}>
        Submit
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

jest.mock('../../../../../components/TransactionList', () => ({
  TransactionList: ({ userId }: any) => (
    <div data-testid="transaction-list">Transaction List for {userId}</div>
  ),
}));

jest.mock('../../../../../components/charts/BalanceAreaChart', () => ({
  BalanceAreaChart: ({ data }: any) => (
    <div data-testid="balance-chart">Balance Chart with {data.length} points</div>
  ),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockUseMoneyStore = useMoneyStore as jest.MockedFunction<typeof useMoneyStore>;

describe('UserDetailPage', () => {
  const mockPerson: Person = {
    id: 'person-1',
    user_id: 'user-1',
    name: 'John Doe',
    phone_number: '+1234567890',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockTransaction: Transaction = {
    id: 'transaction-1',
    user_id: 'user-1',
    person_id: 'person-1',
    amount: 100,
    transaction_type: 'credit',
    description: 'Test transaction',
    transaction_date: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    person: mockPerson,
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

  const defaultStoreState = {
    persons: [mockPerson],
    transactions: [mockTransaction],
    balances: [mockBalance],
    loading: {
      persons: false,
      transactions: false,
      balances: false,
      creating: false,
      updating: false,
      deleting: false,
    },
    errors: {
      persons: null,
      transactions: null,
      balances: null,
      general: null,
    },
    uiState: {
      selectedTimeRange: '30d' as const,
      activeFilters: {},
      showTransactionForm: false,
      showPersonForm: false,
      selectedPerson: null,
      selectedTransaction: null,
    },
    fetchPersons: jest.fn(),
    fetchTransactions: jest.fn(),
    fetchBalances: jest.fn(),
    getPersonById: jest.fn(),
    getBalanceForPerson: jest.fn(),
    createTransaction: jest.fn(),
    setShowTransactionForm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });

    mockUseParams.mockReturnValue({ id: 'person-1' });
  });

  it('renders user information correctly', async () => {
    mockUseMoneyStore.mockReturnValue({
      ...defaultStoreState,
      getPersonById: jest.fn().mockReturnValue(mockPerson),
      getBalanceForPerson: jest.fn().mockReturnValue(mockBalance),
    });

    render(<UserDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
    });
  });

  it('displays balance information correctly', async () => {
    mockUseMoneyStore.mockReturnValue({
      ...defaultStoreState,
      getPersonById: jest.fn().mockReturnValue(mockPerson),
      getBalanceForPerson: jest.fn().mockReturnValue(mockBalance),
    });

    render(<UserDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('$100.00')).toBeInTheDocument();
      expect(screen.getByText('John Doe owes you')).toBeInTheDocument();
      expect(screen.getByText('$150.00')).toBeInTheDocument(); // Total credit
      expect(screen.getByText('$50.00')).toBeInTheDocument(); // Total debit
    });
  });

  it('shows loading state initially', () => {
    mockUseMoneyStore.mockReturnValue({
      ...defaultStoreState,
      loading: {
        ...defaultStoreState.loading,
        persons: true,
      },
      getPersonById: jest.fn().mockReturnValue(undefined),
      getBalanceForPerson: jest.fn().mockReturnValue(undefined),
    });

    render(<UserDetailPage />);

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('shows error state for invalid user ID', async () => {
    mockUseMoneyStore.mockReturnValue({
      ...defaultStoreState,
      getPersonById: jest.fn().mockReturnValue(undefined),
      getBalanceForPerson: jest.fn().mockReturnValue(undefined),
    });

    render(<UserDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('User Not Found')).toBeInTheDocument();
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
    });
  });

  it('navigates back to dashboard when back button is clicked', async () => {
    mockUseMoneyStore.mockReturnValue({
      ...defaultStoreState,
      getPersonById: jest.fn().mockReturnValue(undefined),
      getBalanceForPerson: jest.fn().mockReturnValue(undefined),
    });

    render(<UserDetailPage />);

    await waitFor(() => {
      const backButton = screen.getByText('Back to Dashboard');
      fireEvent.click(backButton);
      expect(mockPush).toHaveBeenCalledWith('/money');
    });
  });

  it('opens quick transaction form when add transaction button is clicked', async () => {
    mockUseMoneyStore.mockReturnValue({
      ...defaultStoreState,
      getPersonById: jest.fn().mockReturnValue(mockPerson),
      getBalanceForPerson: jest.fn().mockReturnValue(mockBalance),
    });

    render(<UserDetailPage />);

    await waitFor(() => {
      const addButton = screen.getByText('Add Transaction');
      fireEvent.click(addButton);
      expect(screen.getByTestId('transaction-form')).toBeInTheDocument();
    });
  });

  it('handles transaction creation correctly', async () => {
    const mockCreateTransaction = jest.fn().mockResolvedValue(mockTransaction);
    const mockFetchTransactions = jest.fn();
    const mockFetchBalances = jest.fn();

    mockUseMoneyStore.mockReturnValue({
      ...defaultStoreState,
      getPersonById: jest.fn().mockReturnValue(mockPerson),
      getBalanceForPerson: jest.fn().mockReturnValue(mockBalance),
      createTransaction: mockCreateTransaction,
      fetchTransactions: mockFetchTransactions,
      fetchBalances: mockFetchBalances,
    });

    render(<UserDetailPage />);

    await waitFor(() => {
      const addButton = screen.getByText('Add Transaction');
      fireEvent.click(addButton);
    });

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateTransaction).toHaveBeenCalledWith({
        amount: 100,
        transaction_type: 'credit',
        person_id: 'person-1',
      });
    });
  });

  it('displays balance chart when transaction history exists', async () => {
    mockUseMoneyStore.mockReturnValue({
      ...defaultStoreState,
      getPersonById: jest.fn().mockReturnValue(mockPerson),
      getBalanceForPerson: jest.fn().mockReturnValue(mockBalance),
    });

    render(<UserDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('balance-chart')).toBeInTheDocument();
    });
  });

  it('displays transaction list for the user', async () => {
    mockUseMoneyStore.mockReturnValue({
      ...defaultStoreState,
      getPersonById: jest.fn().mockReturnValue(mockPerson),
      getBalanceForPerson: jest.fn().mockReturnValue(mockBalance),
    });

    render(<UserDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('transaction-list')).toBeInTheDocument();
      expect(screen.getByText('Transaction List for person-1')).toBeInTheDocument();
    });
  });

  it('shows empty state when no transactions exist', async () => {
    mockUseMoneyStore.mockReturnValue({
      ...defaultStoreState,
      transactions: [],
      getPersonById: jest.fn().mockReturnValue(mockPerson),
      getBalanceForPerson: jest.fn().mockReturnValue(null),
    });

    render(<UserDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('No transactions found for John Doe')).toBeInTheDocument();
      expect(screen.getByText('Add First Transaction')).toBeInTheDocument();
    });
  });

  it('displays error messages when present', async () => {
    mockUseMoneyStore.mockReturnValue({
      ...defaultStoreState,
      errors: {
        ...defaultStoreState.errors,
        general: 'Something went wrong',
      },
      getPersonById: jest.fn().mockReturnValue(mockPerson),
      getBalanceForPerson: jest.fn().mockReturnValue(mockBalance),
    });

    render(<UserDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });
});