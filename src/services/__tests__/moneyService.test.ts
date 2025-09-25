import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { moneyService } from '../moneyService'
import { supabase } from '../supabase'

// Mock Supabase
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn()
    },
    rpc: vi.fn()
  }
}))

const mockSupabase = supabase as any

describe('MoneyService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default auth mock
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Transaction Operations', () => {
    describe('getTransactions', () => {
      it('should fetch transactions with person data', async () => {
        const mockTransactions = [
          {
            id: '1',
            user_id: 'test-user-id',
            person_id: 'person-1',
            amount: 100,
            transaction_type: 'credit',
            description: 'Test transaction',
            transaction_date: '2024-01-01T00:00:00Z',
            person: { id: 'person-1', name: 'John Doe' }
          }
        ]

        // Create a mock that returns the data when the final method is called
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          then: vi.fn().mockResolvedValue({ data: mockTransactions, error: null })
        }
        
        // Make the final method (limit in this case) return the promise
        mockQuery.limit.mockResolvedValue({ data: mockTransactions, error: null })

        mockSupabase.from.mockReturnValue(mockQuery)

        const result = await moneyService.getTransactions({
          person_id: 'person-1',
          limit: 10
        })

        expect(mockSupabase.from).toHaveBeenCalledWith('transactions')
        expect(mockQuery.select).toHaveBeenCalledWith(`
          *,
          person:persons(*)
        `)
        expect(mockQuery.eq).toHaveBeenCalledWith('person_id', 'person-1')
        expect(mockQuery.limit).toHaveBeenCalledWith(10)
        expect(result).toEqual(mockTransactions)
      })

      it('should handle database errors', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis()
        }
        
        // Mock the final resolved value with error
        mockQuery.order.mockResolvedValue({ 
          data: null, 
          error: { message: 'Database error' } 
        })

        mockSupabase.from.mockReturnValue(mockQuery)

        await expect(moneyService.getTransactions()).rejects.toThrow('Failed to fetch transactions: Database error')
      })
    })

    describe('createTransaction', () => {
      it('should create a transaction successfully', async () => {
        const transactionData = {
          person_id: 'person-1',
          amount: 100,
          transaction_type: 'credit' as const,
          description: 'Test transaction'
        }

        const mockTransaction = {
          id: '1',
          user_id: 'test-user-id',
          ...transactionData,
          transaction_date: expect.any(String),
          person: { id: 'person-1', name: 'John Doe' }
        }

        const mockQuery = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockTransaction, error: null })
        }

        mockSupabase.from.mockReturnValue(mockQuery)

        const result = await moneyService.createTransaction(transactionData)

        expect(mockSupabase.from).toHaveBeenCalledWith('transactions')
        expect(mockQuery.insert).toHaveBeenCalledWith({
          user_id: 'test-user-id',
          person_id: 'person-1',
          amount: 100,
          transaction_type: 'credit',
          description: 'Test transaction',
          transaction_date: expect.any(String)
        })
        expect(result).toEqual(mockTransaction)
      })

      it('should validate required fields', async () => {
        await expect(moneyService.createTransaction({} as any)).rejects.toThrow(
          'Missing required fields: person_id, amount, and transaction_type are required'
        )
      })

      it('should validate amount is positive', async () => {
        await expect(moneyService.createTransaction({
          person_id: 'person-1',
          amount: -100,
          transaction_type: 'credit'
        })).rejects.toThrow('Amount must be greater than 0')
      })

      it('should handle authentication errors', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' }
        })

        await expect(moneyService.createTransaction({
          person_id: 'person-1',
          amount: 100,
          transaction_type: 'credit'
        })).rejects.toThrow('User not authenticated')
      })
    })

    describe('updateTransaction', () => {
      it('should update a transaction successfully', async () => {
        const updateData = { amount: 150, description: 'Updated transaction' }
        const mockTransaction = {
          id: '1',
          ...updateData,
          updated_at: expect.any(String)
        }

        const mockQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockTransaction, error: null })
        }

        mockSupabase.from.mockReturnValue(mockQuery)

        const result = await moneyService.updateTransaction('1', updateData)

        expect(mockSupabase.from).toHaveBeenCalledWith('transactions')
        expect(mockQuery.update).toHaveBeenCalledWith({
          ...updateData,
          updated_at: expect.any(String)
        })
        expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
        expect(result).toEqual(mockTransaction)
      })

      it('should validate transaction ID', async () => {
        await expect(moneyService.updateTransaction('', {})).rejects.toThrow(
          'Transaction ID is required'
        )
      })

      it('should validate amount if provided', async () => {
        await expect(moneyService.updateTransaction('1', { amount: -50 })).rejects.toThrow(
          'Amount must be greater than 0'
        )
      })
    })

    describe('deleteTransaction', () => {
      it('should delete a transaction successfully', async () => {
        const mockQuery = {
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null })
        }

        mockSupabase.from.mockReturnValue(mockQuery)

        await moneyService.deleteTransaction('1')

        expect(mockSupabase.from).toHaveBeenCalledWith('transactions')
        expect(mockQuery.delete).toHaveBeenCalled()
        expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
      })

      it('should validate transaction ID', async () => {
        await expect(moneyService.deleteTransaction('')).rejects.toThrow(
          'Transaction ID is required'
        )
      })
    })
  })

  describe('Person Operations', () => {
    describe('getPersons', () => {
      it('should fetch persons with search filter', async () => {
        const mockPersons = [
          { id: '1', name: 'John Doe', phone_number: '123-456-7890' }
        ]

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis()
        }
        
        // Make the final method (limit in this case) return the promise
        mockQuery.limit.mockResolvedValue({ data: mockPersons, error: null })

        mockSupabase.from.mockReturnValue(mockQuery)

        const result = await moneyService.getPersons({ search: 'John', limit: 10 })

        expect(mockSupabase.from).toHaveBeenCalledWith('persons')
        expect(mockQuery.or).toHaveBeenCalledWith('name.ilike.%John%,phone_number.ilike.%John%')
        expect(result).toEqual(mockPersons)
      })
    })

    describe('createPerson', () => {
      it('should create a person successfully', async () => {
        const personData = { name: 'John Doe', phone_number: '123-456-7890' }
        const mockPerson = { id: '1', user_id: 'test-user-id', ...personData }

        // Mock duplicate check
        const mockCheckQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        }

        const mockInsertQuery = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockPerson, error: null })
        }

        mockSupabase.from
          .mockReturnValueOnce(mockCheckQuery) // First call for duplicate check
          .mockReturnValueOnce(mockInsertQuery) // Second call for insert

        const result = await moneyService.createPerson(personData)

        expect(result).toEqual(mockPerson)
      })

      it('should validate required name', async () => {
        await expect(moneyService.createPerson({ name: '' })).rejects.toThrow(
          'Name is required'
        )
      })

      it('should prevent duplicate phone numbers', async () => {
        const mockCheckQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: 'existing-id' }, error: null })
        }

        mockSupabase.from.mockReturnValue(mockCheckQuery)

        await expect(moneyService.createPerson({
          name: 'John Doe',
          phone_number: '123-456-7890'
        })).rejects.toThrow('A person with this phone number already exists')
      })
    })

    describe('deletePerson', () => {
      it('should prevent deletion if person has transactions', async () => {
        const mockCheckQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ 
            data: [{ id: 'transaction-1' }], 
            error: null 
          })
        }

        mockSupabase.from.mockReturnValue(mockCheckQuery)

        await expect(moneyService.deletePerson('person-1')).rejects.toThrow(
          'Cannot delete person with existing transactions'
        )
      })

      it('should delete person successfully if no transactions', async () => {
        const mockCheckQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null })
        }

        const mockDeleteQuery = {
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null })
        }

        mockSupabase.from
          .mockReturnValueOnce(mockCheckQuery)
          .mockReturnValueOnce(mockDeleteQuery)

        await moneyService.deletePerson('person-1')

        expect(mockDeleteQuery.delete).toHaveBeenCalled()
      })
    })
  })

  describe('Balance Calculations', () => {
    describe('getBalanceSummaries', () => {
      it('should use RPC function if available', async () => {
        const mockSummaries = [
          {
            person_id: 'person-1',
            person_name: 'John Doe',
            total_credit: 100,
            total_debit: 50,
            net_balance: 50,
            last_transaction_date: '2024-01-01T00:00:00Z',
            transaction_count: 2
          }
        ]

        mockSupabase.rpc.mockResolvedValue({ data: mockSummaries, error: null })

        const result = await moneyService.getBalanceSummaries()

        expect(mockSupabase.rpc).toHaveBeenCalledWith('get_balance_summaries')
        expect(result).toEqual(mockSummaries)
      })

      it('should fallback to manual calculation if RPC fails', async () => {
        mockSupabase.rpc.mockResolvedValue({ 
          data: null, 
          error: { message: 'Function not found' } 
        })

        const mockTransactions = [
          {
            person_id: 'person-1',
            amount: 100,
            transaction_type: 'credit',
            transaction_date: '2024-01-01T00:00:00Z',
            person: { name: 'John Doe' }
          },
          {
            person_id: 'person-1',
            amount: 50,
            transaction_type: 'debit',
            transaction_date: '2024-01-02T00:00:00Z',
            person: { name: 'John Doe' }
          }
        ]

        const mockQuery = {
          select: vi.fn().mockResolvedValue({ data: mockTransactions, error: null })
        }

        mockSupabase.from.mockReturnValue(mockQuery)

        const result = await moneyService.getBalanceSummaries()

        expect(result).toHaveLength(1)
        expect(result[0]).toMatchObject({
          person_id: 'person-1',
          person_name: 'John Doe',
          total_credit: 100,
          total_debit: 50,
          net_balance: 50,
          transaction_count: 2
        })
      })
    })

    describe('getTopCreditors', () => {
      it('should return top creditors sorted by balance', async () => {
        const mockSummaries = [
          { person_id: '1', person_name: 'John', net_balance: 100, transaction_count: 2 },
          { person_id: '2', person_name: 'Jane', net_balance: 200, transaction_count: 3 },
          { person_id: '3', person_name: 'Bob', net_balance: -50, transaction_count: 1 }
        ]

        vi.spyOn(moneyService, 'getBalanceSummaries').mockResolvedValue(mockSummaries)

        const result = await moneyService.getTopCreditors(2)

        expect(result).toHaveLength(2)
        expect(result[0].person_name).toBe('Jane')
        expect(result[0].net_balance).toBe(200)
        expect(result[1].person_name).toBe('John')
        expect(result[1].net_balance).toBe(100)
      })
    })

    describe('getTopDebtors', () => {
      it('should return top debtors with positive amounts', async () => {
        const mockSummaries = [
          { person_id: '1', person_name: 'John', net_balance: 100, transaction_count: 2 },
          { person_id: '2', person_name: 'Jane', net_balance: -200, transaction_count: 3 },
          { person_id: '3', person_name: 'Bob', net_balance: -50, transaction_count: 1 }
        ]

        vi.spyOn(moneyService, 'getBalanceSummaries').mockResolvedValue(mockSummaries)

        const result = await moneyService.getTopDebtors(2)

        expect(result).toHaveLength(2)
        expect(result[0].person_name).toBe('Jane')
        expect(result[0].net_balance).toBe(200) // Converted to positive
        expect(result[1].person_name).toBe('Bob')
        expect(result[1].net_balance).toBe(50) // Converted to positive
      })
    })
  })
})