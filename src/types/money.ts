// Money Tracker Feature Types

export type TransactionType = 'credit' | 'debit';

// Core interfaces matching database schema
export interface Person {
  id: string;
  user_id: string;
  name: string;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  person_id: string;
  amount: number;
  transaction_type: TransactionType;
  description: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  // Optional joined data
  person?: Person;
}

// Balance summary interface for aggregated data
export interface BalanceSummary {
  person_id: string;
  person_name: string;
  total_credit: number;
  total_debit: number;
  net_balance: number;
  last_transaction_date: string;
  transaction_count: number;
}

// Form data interfaces for creating/updating records
export interface CreatePersonData {
  name: string;
  phone_number?: string | null;
}

export interface UpdatePersonData {
  name?: string;
  phone_number?: string | null;
}

export interface CreateTransactionData {
  person_id: string;
  amount: number;
  transaction_type: TransactionType;
  description?: string | null;
  transaction_date?: string;
}

export interface UpdateTransactionData {
  person_id?: string;
  amount?: number;
  transaction_type?: TransactionType;
  description?: string | null;
  transaction_date?: string;
}

// Filter and query interfaces
export interface TransactionFilters {
  person_id?: string;
  transaction_type?: TransactionType;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface PersonFilters {
  search?: string;
  limit?: number;
  offset?: number;
}

// Chart and visualization data interfaces
export interface TrendData {
  date: string;
  credit_amount: number;
  debit_amount: number;
  transaction_count: number;
}

export interface DistributionData {
  credit_total: number;
  debit_total: number;
  credit_percentage: number;
  debit_percentage: number;
}

export interface PartnerData {
  person_id: string;
  person_name: string;
  total_amount: number;
  transaction_count: number;
  relationship_type: 'creditor' | 'debtor';
}

export interface SpendingPattern {
  month: string;
  credit_total: number;
  debit_total: number;
  net_amount: number;
}

// Time range options for filtering
export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

// UI state interfaces
export interface MoneyUIState {
  selectedTimeRange: TimeRange;
  activeFilters: TransactionFilters;
  showTransactionForm: boolean;
  showPersonForm: boolean;
  selectedPerson: Person | null;
  selectedTransaction: Transaction | null;
}