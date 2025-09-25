import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TransactionList from '../TransactionList';
import type { Transaction, Person } from '../../types/money';

// Mock the money store
vi.mock('../../stores/moneyStore', () => ({
    useMoneyStore: vi.fn()
}));

const { useMoneyStore } = await import('../../stores/moneyStore');

describe('TransactionList', () => {
    const mockPersons: Person[] = [
        {
            id: '1',
            user_id: 'user1',
            name: 'John Doe',
            phone_number: '+1234567890',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
        },
        {
            id: '2',
            user_id: 'user1',
            name: 'Jane Smith',
            phone_number: '+0987654321',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
        },
        {
            id: '3',
            user_id: 'user1',
            name: 'Bob Johnson',
            phone_number: '+1122334455',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
        }
    ];

    const mockTransactions: Transaction[] = [
        {
            id: 'trans1',
            user_id: 'user1',
            person_id: '1',
            amount: 100.50,
            transaction_type: 'credit',
            description: 'Lunch payment',
            transaction_date: '2024-01-15T12:00:00Z',
            created_at: '2024-01-15T12:00:00Z',
            updated_at: '2024-01-15T12:00:00Z'
        },
        {
            id: 'trans2',
            user_id: 'user1',
            person_id: '2',
            amount: 75.25,
            transaction_type: 'debit',
            description: 'Coffee money',
            transaction_date: '2024-01-14T10:30:00Z',
            created_at: '2024-01-14T10:30:00Z',
            updated_at: '2024-01-14T10:30:00Z'
        },
        {
            id: 'trans3',
            user_id: 'user1',
            person_id: '3',
            amount: 200.00,
            transaction_type: 'credit',
            description: null,
            transaction_date: '2024-01-13T15:45:00Z',
            created_at: '2024-01-13T15:45:00Z',
            updated_at: '2024-01-13T15:45:00Z'
        },
        {
            id: 'trans4',
            user_id: 'user1',
            person_id: '1',
            amount: 50.00,
            transaction_type: 'debit',
            description: 'Gas money',
            transaction_date: '2024-01-12T09:15:00Z',
            created_at: '2024-01-12T09:15:00Z',
            updated_at: '2024-01-12T09:15:00Z'
        }
    ];

    const mockStoreState = {
        transactions: mockTransactions,
        persons: mockPersons,
        loading: {
            transactions: false,
            persons: false,
            balances: false,
            creating: false,
            updating: false,
            deleting: false
        },
        fetchTransactions: vi.fn(),
        fetchPersons: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useMoneyStore as any).mockReturnValue(mockStoreState);
    });

    describe('Basic Rendering', () => {
        it('renders transaction list with header', () => {
            render(<TransactionList />);

            expect(screen.getByText('Transactions')).toBeInTheDocument();
            expect(screen.getByText('(4 total)')).toBeInTheDocument();
            expect(screen.getByText('Filters')).toBeInTheDocument();
        });

        it('renders all transactions by default', () => {
            render(<TransactionList />);

            expect(screen.getAllByText('John Doe')).toHaveLength(2); // John has 2 transactions
            expect(screen.getByText('Jane Smith')).toBeInTheDocument();
            expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
            expect(screen.getAllByText('+$100.50')).toHaveLength(2); // Desktop and mobile
            expect(screen.getAllByText('-$75.25')).toHaveLength(2); // Desktop and mobile
            expect(screen.getAllByText('+$200.00')).toHaveLength(2); // Desktop and mobile
        });

        it('applies custom className', () => {
            const { container } = render(<TransactionList className="custom-class" />);
            expect(container.firstChild).toHaveClass('custom-class');
        });

        it('shows loading state', () => {
            (useMoneyStore as any).mockReturnValue({
                ...mockStoreState,
                loading: { ...mockStoreState.loading, transactions: true }
            });

            render(<TransactionList />);
            expect(screen.getByText('Loading transactions...')).toBeInTheDocument();
        });

        it('shows empty state when no transactions', () => {
            (useMoneyStore as any).mockReturnValue({
                ...mockStoreState,
                transactions: []
            });

            render(<TransactionList />);
            expect(screen.getByText('No transactions found')).toBeInTheDocument();
            expect(screen.getByText('Get started by creating your first transaction.')).toBeInTheDocument();
        });
    });

    describe('Transaction Display', () => {
        it('displays transaction information correctly', () => {
            render(<TransactionList />);

            // Check first transaction
            expect(screen.getAllByText('John Doe')).toHaveLength(2); // John has 2 transactions
            expect(screen.getByText('Lunch payment')).toBeInTheDocument();
            expect(screen.getAllByText('+$100.50')).toHaveLength(2); // Desktop and mobile
            expect(screen.getAllByText('They owe')).toHaveLength(4); // Multiple transactions

            // Check second transaction
            expect(screen.getByText('Jane Smith')).toBeInTheDocument();
            expect(screen.getByText('Coffee money')).toBeInTheDocument();
            expect(screen.getAllByText('-$75.25')).toHaveLength(2); // Desktop and mobile
            expect(screen.getAllByText('I owe')).toHaveLength(4); // 2 debit transactions × 2 (desktop + mobile)
        });

        it('handles transactions without descriptions', () => {
            render(<TransactionList />);

            // Transaction 3 has no description
            expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
            expect(screen.getAllByText('+$200.00')).toHaveLength(2); // Desktop and mobile
            // Should not show description text
            expect(screen.queryByText('null')).not.toBeInTheDocument();
        });

        it('formats dates correctly', () => {
            render(<TransactionList />);

            // Should show formatted dates
            expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
            expect(screen.getByText(/Jan 14, 2024/)).toBeInTheDocument();
        });

        it('shows correct transaction type indicators', () => {
            render(<TransactionList />);

            // Credit transactions should have green indicators
            const creditIndicators = document.querySelectorAll('.bg-green-500');
            expect(creditIndicators).toHaveLength(2); // 2 credit transactions

            // Debit transactions should have red indicators
            const debitIndicators = document.querySelectorAll('.bg-red-500');
            expect(debitIndicators).toHaveLength(2); // 2 debit transactions
        });
    });

    describe('Filtering', () => {
        it('shows and hides filter panel', async () => {
            const user = userEvent.setup();
            render(<TransactionList />);

            const filtersButton = screen.getByText('Filters');

            // Filters should be hidden initially
            expect(screen.queryByLabelText('Search Person')).not.toBeInTheDocument();

            // Show filters
            await user.click(filtersButton);
            expect(screen.getByLabelText('Search Person')).toBeInTheDocument();

            // Hide filters
            await user.click(filtersButton);
            expect(screen.queryByLabelText('Search Person')).not.toBeInTheDocument();
        });

        it('filters by person name search', async () => {
            const user = userEvent.setup();
            render(<TransactionList />);

            // Show filters
            await user.click(screen.getByText('Filters'));

            // Search for "John Doe" (more specific to avoid matching "Bob Johnson")
            const searchInput = screen.getByLabelText('Search Person');
            await user.type(searchInput, 'John Doe');

            await waitFor(() => {
                expect(screen.getAllByText('John Doe')).toHaveLength(2); // John has 2 transactions
                expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
                expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
                expect(screen.getByText('(2 total)')).toBeInTheDocument();
            });
        });

        it('filters by transaction type', async () => {
            const user = userEvent.setup();
            render(<TransactionList />);

            // Show filters
            await user.click(screen.getByText('Filters'));

            // Filter by credit transactions
            const typeSelect = screen.getByLabelText('Transaction Type');
            await user.selectOptions(typeSelect, 'credit');

            await waitFor(() => {
                // Should show only credit transactions (John Doe and Bob Johnson)
                expect(screen.getByText('John Doe')).toBeInTheDocument();
                expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
                expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
                // Should show (2 total) instead of (4 total)
                expect(screen.getByText('(2 total)')).toBeInTheDocument();
            });
        });

        it('filters by date range', async () => {
            const user = userEvent.setup();
            render(<TransactionList />);

            // Show filters
            await user.click(screen.getByText('Filters'));

            // Set date range to only include Jan 14-15, 2024
            const startDateInput = screen.getByLabelText('Start Date');
            const endDateInput = screen.getByLabelText('End Date');

            await user.type(startDateInput, '2024-01-14');
            await user.type(endDateInput, '2024-01-15');

            await waitFor(() => {
                // Should show only transactions from Jan 14-15
                expect(screen.getByText('John Doe')).toBeInTheDocument(); // Jan 15
                expect(screen.getByText('Jane Smith')).toBeInTheDocument(); // Jan 14
                expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument(); // Jan 13
                expect(screen.getByText('(2 total)')).toBeInTheDocument();
            });
        });

        it('clears all filters', async () => {
            const user = userEvent.setup();
            render(<TransactionList />);

            // Show filters and apply some
            await user.click(screen.getByText('Filters'));

            const searchInput = screen.getByLabelText('Search Person');
            await user.type(searchInput, 'John Doe');

            // Clear filters
            await user.click(screen.getByText('Clear Filters'));

            await waitFor(() => {
                expect(searchInput).toHaveValue('');
                // Should show all transactions again
                expect(screen.getAllByText('John Doe')).toHaveLength(2); // John has 2 transactions
                expect(screen.getByText('Jane Smith')).toBeInTheDocument();
                expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
            });
        });
    });

    describe('Sorting', () => {
        it('sorts by date in descending order by default', () => {
            render(<TransactionList />);

            const transactionElements = screen.getAllByText(/Jan \d+, 2024/);
            // Should be in descending order: Jan 15, Jan 14, Jan 13, Jan 12
            expect(transactionElements[0]).toHaveTextContent('Jan 15, 2024');
            expect(transactionElements[1]).toHaveTextContent('Jan 14, 2024');
        });

        it('changes sort order', async () => {
            const user = userEvent.setup();
            render(<TransactionList />);

            // Show filters
            await user.click(screen.getByText('Filters'));

            // Change sort order to ascending
            const sortOrderButton = screen.getByTitle('Sort Ascending');
            await user.click(sortOrderButton);

            await waitFor(() => {
                const transactionElements = screen.getAllByText(/Jan \d+, 2024/);
                // Should now be in ascending order: Jan 12, Jan 13, Jan 14, Jan 15
                expect(transactionElements[0]).toHaveTextContent('Jan 12, 2024');
                expect(transactionElements[1]).toHaveTextContent('Jan 13, 2024');
            });
        });

        it('sorts by amount', async () => {
            const user = userEvent.setup();
            render(<TransactionList />);

            // Show filters
            await user.click(screen.getByText('Filters'));

            // Sort by amount
            const sortSelect = screen.getByLabelText('Sort By');
            await user.selectOptions(sortSelect, 'amount');

            await waitFor(() => {
                // Should be sorted by amount descending: $200, $100.50, $75.25, $50
                // Get all amount elements and check the first few
                const amountElements = screen.getAllByText(/[\+\-]\$\d+\.\d+/);
                expect(amountElements[0]).toHaveTextContent('+$200.00');
                expect(amountElements[2]).toHaveTextContent('+$100.50'); // Skip mobile duplicate
            });
        });

        it('sorts by person name', async () => {
            const user = userEvent.setup();
            render(<TransactionList />);

            // Show filters
            await user.click(screen.getByText('Filters'));

            // Sort by person
            const sortSelect = screen.getByLabelText('Sort By');
            await user.selectOptions(sortSelect, 'person');

            await waitFor(() => {
                // Should be sorted by person name descending: John, Jane, Bob
                // Check that John Doe appears first (he has 2 transactions)
                const allPersonElements = screen.getAllByText(/(John Doe|Jane Smith|Bob Johnson)/);
                expect(allPersonElements[0]).toHaveTextContent('John Doe');
                expect(allPersonElements[1]).toHaveTextContent('John Doe'); // John has 2 transactions
            });
        });
    });

    describe('Pagination', () => {
        const manyTransactions = Array.from({ length: 25 }, (_, i) => ({
            id: `trans${i + 1}`,
            user_id: 'user1',
            person_id: '1',
            amount: 10 + i,
            transaction_type: 'credit' as const,
            description: `Transaction ${i + 1}`,
            transaction_date: `2024-01-${String(i + 1).padStart(2, '0')}T12:00:00Z`,
            created_at: `2024-01-${String(i + 1).padStart(2, '0')}T12:00:00Z`,
            updated_at: `2024-01-${String(i + 1).padStart(2, '0')}T12:00:00Z`
        }));

        it('shows pagination when there are many transactions', () => {
            (useMoneyStore as any).mockReturnValue({
                ...mockStoreState,
                transactions: manyTransactions
            });

            render(<TransactionList />);

            expect(screen.getByText('Previous')).toBeInTheDocument();
            expect(screen.getByText('Next')).toBeInTheDocument();
            expect(screen.getByText('1')).toBeInTheDocument();
            expect(screen.getByText('2')).toBeInTheDocument();
        });

        it('navigates between pages', async () => {
            const user = userEvent.setup();
            (useMoneyStore as any).mockReturnValue({
                ...mockStoreState,
                transactions: manyTransactions
            });

            render(<TransactionList />);

            // Should show first 20 transactions
            expect(screen.getByText('Showing 1 to 20 of 25 results')).toBeInTheDocument();

            // Go to next page
            await user.click(screen.getByText('Next'));

            await waitFor(() => {
                expect(screen.getByText('Showing 21 to 25 of 25 results')).toBeInTheDocument();
            });

            // Go back to previous page
            await user.click(screen.getByText('Previous'));

            await waitFor(() => {
                expect(screen.getByText('Showing 1 to 20 of 25 results')).toBeInTheDocument();
            });
        });

        it('disables pagination buttons appropriately', async () => {
            const user = userEvent.setup();
            (useMoneyStore as any).mockReturnValue({
                ...mockStoreState,
                transactions: manyTransactions
            });

            render(<TransactionList />);

            // Previous should be disabled on first page
            expect(screen.getByText('Previous')).toBeDisabled();

            // Go to last page
            await user.click(screen.getByText('2'));

            await waitFor(() => {
                // Next should be disabled on last page
                expect(screen.getByText('Next')).toBeDisabled();
            });
        });
    });

    describe('User-specific filtering', () => {
        it('filters transactions by userId when provided', () => {
            render(<TransactionList userId="1" />);

            // Should only show transactions for person with ID "1" (John Doe)
            expect(screen.getAllByText('John Doe')).toHaveLength(2); // John has 2 transactions
            expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
            expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
        });
    });

    describe('Limit functionality', () => {
        it('limits the number of transactions shown', () => {
            render(<TransactionList limit={2} />);

            // Should only show 2 transactions
            const transactionElements = document.querySelectorAll('[class*="hover:bg-gray-50"]');
            expect(transactionElements).toHaveLength(2);
        });
    });

    describe('Data Loading', () => {
        it('fetches transactions and persons on mount when empty', () => {
            const mockFetchTransactions = vi.fn();
            const mockFetchPersons = vi.fn();

            (useMoneyStore as any).mockReturnValue({
                ...mockStoreState,
                transactions: [],
                persons: [],
                fetchTransactions: mockFetchTransactions,
                fetchPersons: mockFetchPersons
            });

            render(<TransactionList />);

            expect(mockFetchTransactions).toHaveBeenCalled();
            expect(mockFetchPersons).toHaveBeenCalled();
        });

        it('does not fetch data when already loaded', () => {
            const mockFetchTransactions = vi.fn();
            const mockFetchPersons = vi.fn();

            (useMoneyStore as any).mockReturnValue({
                ...mockStoreState,
                fetchTransactions: mockFetchTransactions,
                fetchPersons: mockFetchPersons
            });

            render(<TransactionList />);

            expect(mockFetchTransactions).not.toHaveBeenCalled();
            expect(mockFetchPersons).not.toHaveBeenCalled();
        });
    });

    describe('Responsive Design', () => {
        it('renders mobile-specific layout elements', () => {
            render(<TransactionList />);

            // Check for mobile-specific classes
            const mobileElements = document.querySelectorAll('.sm\\:hidden');
            expect(mobileElements.length).toBeGreaterThan(0);
        });
    });

    describe('Empty States', () => {
        it('shows appropriate message when filters return no results', async () => {
            const user = userEvent.setup();
            render(<TransactionList />);

            // Show filters and search for non-existent person
            await user.click(screen.getByText('Filters'));
            const searchInput = screen.getByLabelText('Search Person');
            await user.type(searchInput, 'NonExistent');

            await waitFor(() => {
                expect(screen.getByText('No transactions found')).toBeInTheDocument();
                expect(screen.getByText('Try adjusting your filters to see more results.')).toBeInTheDocument();
            });
        });
    });
});