import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { moneyService } from '../services/moneyService';
import { analyticsService } from '../services/analyticsService';
import type {
    Transaction,
    Person,
    BalanceSummary,
    CreateTransactionData,
    UpdateTransactionData,
    CreatePersonData,
    UpdatePersonData,
    TransactionFilters,
    PersonFilters,
    TimeRange,
    MoneyUIState,
    PartnerData
} from '../types/money';

interface MoneyState {
    // Core data state
    transactions: Transaction[];
    persons: Person[];
    balances: BalanceSummary[];

    // Loading states
    loading: {
        transactions: boolean;
        persons: boolean;
        balances: boolean;
        creating: boolean;
        updating: boolean;
        deleting: boolean;
    };

    // Error states
    errors: {
        transactions: string | null;
        persons: string | null;
        balances: string | null;
        general: string | null;
    };

    // UI state
    uiState: MoneyUIState;

    // Computed data cache
    topCreditors: PartnerData[];
    topDebtors: PartnerData[];

    // Last fetch timestamps for cache management
    lastFetch: {
        transactions: Date | null;
        persons: Date | null;
        balances: Date | null;
    };

    // Actions - Data fetching
    fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
    fetchPersons: (filters?: PersonFilters) => Promise<void>;
    fetchBalances: () => Promise<void>;
    fetchTopCreditors: (limit?: number) => Promise<void>;
    fetchTopDebtors: (limit?: number) => Promise<void>;

    // Actions - Transaction CRUD
    createTransaction: (data: CreateTransactionData) => Promise<Transaction>;
    updateTransaction: (id: string, data: UpdateTransactionData) => Promise<Transaction>;
    deleteTransaction: (id: string) => Promise<void>;

    // Actions - Person CRUD
    createPerson: (data: CreatePersonData) => Promise<Person>;
    updatePerson: (id: string, data: UpdatePersonData) => Promise<Person>;
    deletePerson: (id: string) => Promise<void>;

    // Actions - UI state management
    setSelectedTimeRange: (timeRange: TimeRange) => void;
    setActiveFilters: (filters: TransactionFilters) => void;
    setShowTransactionForm: (show: boolean) => void;
    setShowPersonForm: (show: boolean) => void;
    setSelectedPerson: (person: Person | null) => void;
    setSelectedTransaction: (transaction: Transaction | null) => void;

    // Actions - Error handling
    clearError: (errorType: keyof MoneyState['errors']) => void;
    clearAllErrors: () => void;

    // Actions - Cache management
    invalidateCache: (dataType?: 'transactions' | 'persons' | 'balances' | 'all') => void;
    refreshData: () => Promise<void>;

    // Computed selectors
    getFilteredTransactions: () => Transaction[];
    getPersonById: (id: string) => Person | undefined;
    getTransactionById: (id: string) => Transaction | undefined;
    getBalanceForPerson: (personId: string) => BalanceSummary | undefined;
    getTotalBalance: () => number;
    getTransactionCount: () => number;
    getPersonCount: () => number;
}

const initialUIState: MoneyUIState = {
    selectedTimeRange: '30d',
    activeFilters: {},
    showTransactionForm: false,
    showPersonForm: false,
    selectedPerson: null,
    selectedTransaction: null,
};

export const useMoneyStore = create<MoneyState>()(
    persist(
        (set, get) => ({
            // Initial state
            transactions: [],
            persons: [],
            balances: [],

            loading: {
                transactions: false,
                persons: false,
                balances: false,
                creating: false,
                updating: false,
                deleting: false,
            },

            errors: {
                transactions: null,
                persons: null,
                balances: null,
                general: null,
            },

            uiState: initialUIState,

            topCreditors: [],
            topDebtors: [],

            lastFetch: {
                transactions: null,
                persons: null,
                balances: null,
            },

            // Data fetching actions
            fetchTransactions: async (filters = {}) => {
                try {
                    set((state) => ({
                        loading: { ...state.loading, transactions: true },
                        errors: { ...state.errors, transactions: null },
                    }));

                    const transactions = await moneyService.getTransactions(filters);

                    set((state) => ({
                        transactions,
                        loading: { ...state.loading, transactions: false },
                        lastFetch: { ...state.lastFetch, transactions: new Date() },
                    }));
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transactions';
                    set((state) => ({
                        loading: { ...state.loading, transactions: false },
                        errors: { ...state.errors, transactions: errorMessage },
                    }));
                    throw error;
                }
            },

            fetchPersons: async (filters = {}) => {
                try {
                    set((state) => ({
                        loading: { ...state.loading, persons: true },
                        errors: { ...state.errors, persons: null },
                    }));

                    const persons = await moneyService.getPersons(filters);

                    set((state) => ({
                        persons,
                        loading: { ...state.loading, persons: false },
                        lastFetch: { ...state.lastFetch, persons: new Date() },
                    }));
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch persons';
                    set((state) => ({
                        loading: { ...state.loading, persons: false },
                        errors: { ...state.errors, persons: errorMessage },
                    }));
                    throw error;
                }
            },

            fetchBalances: async () => {
                try {
                    set((state) => ({
                        loading: { ...state.loading, balances: true },
                        errors: { ...state.errors, balances: null },
                    }));

                    const balances = await moneyService.getBalanceSummaries();

                    set((state) => ({
                        balances,
                        loading: { ...state.loading, balances: false },
                        lastFetch: { ...state.lastFetch, balances: new Date() },
                    }));
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch balances';
                    set((state) => ({
                        loading: { ...state.loading, balances: false },
                        errors: { ...state.errors, balances: errorMessage },
                    }));
                    throw error;
                }
            },

            fetchTopCreditors: async (limit = 5) => {
                try {
                    const topCreditors = await analyticsService.getTopCreditors(limit);
                    set({ topCreditors });
                } catch (error) {
                    console.error('Failed to fetch top creditors:', error);
                }
            },

            fetchTopDebtors: async (limit = 5) => {
                try {
                    const topDebtors = await analyticsService.getTopDebtors(limit);
                    set({ topDebtors });
                } catch (error) {
                    console.error('Failed to fetch top debtors:', error);
                }
            },

            // Transaction CRUD actions with optimistic updates
            createTransaction: async (data: CreateTransactionData) => {
                try {
                    set((state) => ({
                        loading: { ...state.loading, creating: true },
                        errors: { ...state.errors, general: null },
                    }));

                    // Optimistic update - create temporary transaction
                    const tempTransaction: Transaction = {
                        id: `temp-${Date.now()}`,
                        user_id: 'temp',
                        person_id: data.person_id,
                        amount: data.amount,
                        transaction_type: data.transaction_type,
                        description: data.description || null,
                        transaction_date: data.transaction_date || new Date().toISOString(),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        person: get().persons.find(p => p.id === data.person_id),
                    };

                    set((state) => ({
                        transactions: [tempTransaction, ...state.transactions],
                    }));

                    // Create actual transaction
                    const createdTransaction = await moneyService.createTransaction(data);

                    // Replace temporary transaction with real one
                    set((state) => ({
                        transactions: state.transactions.map(t =>
                            t.id === tempTransaction.id ? createdTransaction : t
                        ),
                        loading: { ...state.loading, creating: false },
                    }));

                    // Refresh related data
                    get().fetchBalances();
                    get().fetchTopCreditors();
                    get().fetchTopDebtors();

                    return createdTransaction;
                } catch (error) {
                    // Remove optimistic update on error
                    set((state) => ({
                        transactions: state.transactions.filter(t => !t.id.startsWith('temp-')),
                        loading: { ...state.loading, creating: false },
                        errors: {
                            ...state.errors,
                            general: error instanceof Error ? error.message : 'Failed to create transaction'
                        },
                    }));
                    throw error;
                }
            },

            updateTransaction: async (id: string, data: UpdateTransactionData) => {
                const originalTransaction = get().transactions.find(t => t.id === id);

                try {
                    set((state) => ({
                        loading: { ...state.loading, updating: true },
                        errors: { ...state.errors, general: null },
                    }));

                    // Optimistic update
                    if (originalTransaction) {
                        const optimisticTransaction = { ...originalTransaction, ...data };
                        set((state) => ({
                            transactions: state.transactions.map(t =>
                                t.id === id ? optimisticTransaction : t
                            ),
                        }));
                    }

                    // Update actual transaction
                    const updatedTransaction = await moneyService.updateTransaction(id, data);

                    // Replace with real updated transaction
                    set((state) => ({
                        transactions: state.transactions.map(t =>
                            t.id === id ? updatedTransaction : t
                        ),
                        loading: { ...state.loading, updating: false },
                    }));

                    // Refresh related data
                    get().fetchBalances();
                    get().fetchTopCreditors();
                    get().fetchTopDebtors();

                    return updatedTransaction;
                } catch (error) {
                    // Revert optimistic update on error
                    if (originalTransaction) {
                        set((state) => ({
                            transactions: state.transactions.map(t =>
                                t.id === id ? originalTransaction : t
                            ),
                        }));
                    }

                    set((state) => ({
                        loading: { ...state.loading, updating: false },
                        errors: {
                            ...state.errors,
                            general: error instanceof Error ? error.message : 'Failed to update transaction'
                        },
                    }));
                    throw error;
                }
            },

            deleteTransaction: async (id: string) => {
                const transactionToDelete = get().transactions.find(t => t.id === id);

                try {
                    set((state) => ({
                        loading: { ...state.loading, deleting: true },
                        errors: { ...state.errors, general: null },
                    }));

                    // Optimistic update - remove transaction
                    set((state) => ({
                        transactions: state.transactions.filter(t => t.id !== id),
                    }));

                    // Delete actual transaction
                    await moneyService.deleteTransaction(id);

                    set((state) => ({
                        loading: { ...state.loading, deleting: false },
                    }));

                    // Refresh related data
                    get().fetchBalances();
                    get().fetchTopCreditors();
                    get().fetchTopDebtors();
                } catch (error) {
                    // Revert optimistic update on error
                    if (transactionToDelete) {
                        set((state) => ({
                            transactions: [...state.transactions, transactionToDelete],
                        }));
                    }

                    set((state) => ({
                        loading: { ...state.loading, deleting: false },
                        errors: {
                            ...state.errors,
                            general: error instanceof Error ? error.message : 'Failed to delete transaction'
                        },
                    }));
                    throw error;
                }
            },

            // Person CRUD actions with optimistic updates
            createPerson: async (data: CreatePersonData) => {
                try {
                    set((state) => ({
                        loading: { ...state.loading, creating: true },
                        errors: { ...state.errors, general: null },
                    }));

                    // Optimistic update - create temporary person
                    const tempPerson: Person = {
                        id: `temp-${Date.now()}`,
                        user_id: 'temp',
                        name: data.name,
                        phone_number: data.phone_number || null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    };

                    set((state) => ({
                        persons: [...state.persons, tempPerson],
                    }));

                    // Create actual person
                    const createdPerson = await moneyService.createPerson(data);

                    // Replace temporary person with real one
                    set((state) => ({
                        persons: state.persons.map(p =>
                            p.id === tempPerson.id ? createdPerson : p
                        ),
                        loading: { ...state.loading, creating: false },
                    }));

                    return createdPerson;
                } catch (error) {
                    // Remove optimistic update on error
                    set((state) => ({
                        persons: state.persons.filter(p => !p.id.startsWith('temp-')),
                        loading: { ...state.loading, creating: false },
                        errors: {
                            ...state.errors,
                            general: error instanceof Error ? error.message : 'Failed to create person'
                        },
                    }));
                    throw error;
                }
            },

            updatePerson: async (id: string, data: UpdatePersonData) => {
                const originalPerson = get().persons.find(p => p.id === id);

                try {
                    set((state) => ({
                        loading: { ...state.loading, updating: true },
                        errors: { ...state.errors, general: null },
                    }));

                    // Optimistic update
                    if (originalPerson) {
                        const optimisticPerson = { ...originalPerson, ...data };
                        set((state) => ({
                            persons: state.persons.map(p =>
                                p.id === id ? optimisticPerson : p
                            ),
                        }));
                    }

                    // Update actual person
                    const updatedPerson = await moneyService.updatePerson(id, data);

                    // Replace with real updated person
                    set((state) => ({
                        persons: state.persons.map(p =>
                            p.id === id ? updatedPerson : p
                        ),
                        loading: { ...state.loading, updating: false },
                    }));

                    return updatedPerson;
                } catch (error) {
                    // Revert optimistic update on error
                    if (originalPerson) {
                        set((state) => ({
                            persons: state.persons.map(p =>
                                p.id === id ? originalPerson : p
                            ),
                        }));
                    }

                    set((state) => ({
                        loading: { ...state.loading, updating: false },
                        errors: {
                            ...state.errors,
                            general: error instanceof Error ? error.message : 'Failed to update person'
                        },
                    }));
                    throw error;
                }
            },

            deletePerson: async (id: string) => {
                const personToDelete = get().persons.find(p => p.id === id);

                try {
                    set((state) => ({
                        loading: { ...state.loading, deleting: true },
                        errors: { ...state.errors, general: null },
                    }));

                    // Optimistic update - remove person
                    set((state) => ({
                        persons: state.persons.filter(p => p.id !== id),
                    }));

                    // Delete actual person
                    await moneyService.deletePerson(id);

                    set((state) => ({
                        loading: { ...state.loading, deleting: false },
                    }));

                    // Refresh related data
                    get().fetchBalances();
                } catch (error) {
                    // Revert optimistic update on error
                    if (personToDelete) {
                        set((state) => ({
                            persons: [...state.persons, personToDelete],
                        }));
                    }

                    set((state) => ({
                        loading: { ...state.loading, deleting: false },
                        errors: {
                            ...state.errors,
                            general: error instanceof Error ? error.message : 'Failed to delete person'
                        },
                    }));
                    throw error;
                }
            },

            // UI state management actions
            setSelectedTimeRange: (timeRange: TimeRange) => {
                set((state) => ({
                    uiState: { ...state.uiState, selectedTimeRange: timeRange },
                }));
            },

            setActiveFilters: (filters: TransactionFilters) => {
                set((state) => ({
                    uiState: { ...state.uiState, activeFilters: filters },
                }));
            },

            setShowTransactionForm: (show: boolean) => {
                set((state) => ({
                    uiState: { ...state.uiState, showTransactionForm: show },
                }));
            },

            setShowPersonForm: (show: boolean) => {
                set((state) => ({
                    uiState: { ...state.uiState, showPersonForm: show },
                }));
            },

            setSelectedPerson: (person: Person | null) => {
                set((state) => ({
                    uiState: { ...state.uiState, selectedPerson: person },
                }));
            },

            setSelectedTransaction: (transaction: Transaction | null) => {
                set((state) => ({
                    uiState: { ...state.uiState, selectedTransaction: transaction },
                }));
            },

            // Error handling actions
            clearError: (errorType: keyof MoneyState['errors']) => {
                set((state) => ({
                    errors: { ...state.errors, [errorType]: null },
                }));
            },

            clearAllErrors: () => {
                set(() => ({
                    errors: {
                        transactions: null,
                        persons: null,
                        balances: null,
                        general: null,
                    },
                }));
            },

            // Cache management actions
            invalidateCache: (dataType = 'all') => {
                set((state) => {
                    const newLastFetch = { ...state.lastFetch };

                    if (dataType === 'all') {
                        newLastFetch.transactions = null;
                        newLastFetch.persons = null;
                        newLastFetch.balances = null;
                    } else {
                        newLastFetch[dataType] = null;
                    }

                    return { lastFetch: newLastFetch };
                });
            },

            refreshData: async () => {
                try {
                    await Promise.all([
                        get().fetchTransactions(get().uiState.activeFilters),
                        get().fetchPersons(),
                        get().fetchBalances(),
                        get().fetchTopCreditors(),
                        get().fetchTopDebtors(),
                    ]);
                } catch (error) {
                    console.error('Failed to refresh data:', error);
                    throw error;
                }
            },

            // Computed selectors
            getFilteredTransactions: () => {
                const { transactions, uiState } = get();
                const { activeFilters } = uiState;

                return transactions.filter(transaction => {
                    // Apply person filter
                    if (activeFilters.person_id && transaction.person_id !== activeFilters.person_id) {
                        return false;
                    }

                    // Apply transaction type filter
                    if (activeFilters.transaction_type && transaction.transaction_type !== activeFilters.transaction_type) {
                        return false;
                    }

                    // Apply date range filters
                    if (activeFilters.start_date) {
                        const transactionDate = new Date(transaction.transaction_date);
                        const startDate = new Date(activeFilters.start_date);
                        if (transactionDate < startDate) {
                            return false;
                        }
                    }

                    if (activeFilters.end_date) {
                        const transactionDate = new Date(transaction.transaction_date);
                        const endDate = new Date(activeFilters.end_date);
                        if (transactionDate > endDate) {
                            return false;
                        }
                    }

                    return true;
                });
            },

            getPersonById: (id: string) => {
                return get().persons.find(person => person.id === id);
            },

            getTransactionById: (id: string) => {
                return get().transactions.find(transaction => transaction.id === id);
            },

            getBalanceForPerson: (personId: string) => {
                return get().balances.find(balance => balance.person_id === personId);
            },

            getTotalBalance: () => {
                return get().balances.reduce((total, balance) => total + balance.net_balance, 0);
            },

            getTransactionCount: () => {
                return get().transactions.length;
            },

            getPersonCount: () => {
                return get().persons.length;
            },
        }),
        {
            name: 'money-storage',
            partialize: (state) => ({
                uiState: state.uiState,
                lastFetch: state.lastFetch,
            }),
        }
    )
);