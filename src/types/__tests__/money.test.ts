import { describe, it, expect } from 'vitest'
import type { 
  Person, 
  Transaction, 
  BalanceSummary, 
  CreatePersonData, 
  CreateTransactionData,
  TransactionType 
} from '../money'
import type { Database } from '../supabase'

describe('Money Tracker Types', () => {
  it('should have correct Person interface structure', () => {
    const person: Person = {
      id: 'person-123',
      user_id: 'user-456',
      name: 'John Doe',
      phone_number: '+1234567890',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    expect(person.id).toBe('person-123')
    expect(person.name).toBe('John Doe')
    expect(person.phone_number).toBe('+1234567890')
  })

  it('should have correct Transaction interface structure', () => {
    const transaction: Transaction = {
      id: 'txn-123',
      user_id: 'user-456',
      person_id: 'person-123',
      amount: 100.50,
      transaction_type: 'credit',
      description: 'Payment received',
      transaction_date: '2024-01-01T12:00:00Z',
      created_at: '2024-01-01T12:00:00Z',
      updated_at: '2024-01-01T12:00:00Z'
    }

    expect(transaction.amount).toBe(100.50)
    expect(transaction.transaction_type).toBe('credit')
    expect(transaction.description).toBe('Payment received')
  })

  it('should have correct BalanceSummary interface structure', () => {
    const balance: BalanceSummary = {
      person_id: 'person-123',
      person_name: 'John Doe',
      total_credit: 500.00,
      total_debit: 200.00,
      net_balance: 300.00,
      last_transaction_date: '2024-01-01T12:00:00Z',
      transaction_count: 5
    }

    expect(balance.net_balance).toBe(300.00)
    expect(balance.transaction_count).toBe(5)
  })

  it('should have correct form data interfaces', () => {
    const createPersonData: CreatePersonData = {
      name: 'Jane Smith',
      phone_number: '+0987654321'
    }

    const createTransactionData: CreateTransactionData = {
      person_id: 'person-123',
      amount: 75.25,
      transaction_type: 'debit',
      description: 'Loan given'
    }

    expect(createPersonData.name).toBe('Jane Smith')
    expect(createTransactionData.amount).toBe(75.25)
    expect(createTransactionData.transaction_type).toBe('debit')
  })

  it('should have TransactionType enum values', () => {
    const creditType: TransactionType = 'credit'
    const debitType: TransactionType = 'debit'

    expect(creditType).toBe('credit')
    expect(debitType).toBe('debit')
  })

  it('should be compatible with Database types', () => {
    // Test that our types are compatible with Supabase Database types
    type PersonRow = Database['public']['Tables']['persons']['Row']
    type TransactionRow = Database['public']['Tables']['transactions']['Row']

    const personRow: PersonRow = {
      id: 'person-123',
      user_id: 'user-456',
      name: 'John Doe',
      phone_number: '+1234567890',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    const transactionRow: TransactionRow = {
      id: 'txn-123',
      user_id: 'user-456',
      person_id: 'person-123',
      amount: 100.50,
      transaction_type: 'credit',
      description: 'Payment received',
      transaction_date: '2024-01-01T12:00:00Z',
      created_at: '2024-01-01T12:00:00Z',
      updated_at: '2024-01-01T12:00:00Z'
    }

    // These should compile without errors if types are compatible
    expect(personRow.name).toBe('John Doe')
    expect(transactionRow.amount).toBe(100.50)
  })
})