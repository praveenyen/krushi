import { supabase } from './supabase'
import type {
  Transaction,
  Person,
  BalanceSummary,
  CreateTransactionData,
  UpdateTransactionData,
  CreatePersonData,
  UpdatePersonData,
  TransactionFilters,
  PersonFilters
} from '../types/money'

/**
 * Service class for money tracker database operations
 * Handles CRUD operations for transactions and persons with proper error handling
 */
export class MoneyService {
  
  // ==================== TRANSACTION OPERATIONS ====================
  
  /**
   * Fetch transactions with optional filtering
   */
  async getTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
    try {
      // Verify authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('Authentication error in getTransactions:', authError)
        throw new Error(`Authentication failed: ${authError.message}`)
      }
      if (!user) {
        throw new Error('User not authenticated. Please sign in to view transactions.')
      }

      let query = supabase
        .from('transactions')
        .select(`
          *,
          person:persons(*)
        `)
        .order('transaction_date', { ascending: false })

      // Apply filters
      if (filters.person_id) {
        query = query.eq('person_id', filters.person_id)
      }
      
      if (filters.transaction_type) {
        query = query.eq('transaction_type', filters.transaction_type)
      }
      
      if (filters.start_date) {
        query = query.gte('transaction_date', filters.start_date)
      }
      
      if (filters.end_date) {
        query = query.lte('transaction_date', filters.end_date)
      }
      
      if (filters.limit) {
        query = query.limit(filters.limit)
      }
      
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to fetch transactions: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error fetching transactions:', error)
      throw error
    }
  }

  /**
   * Create a new transaction
   */
  async createTransaction(data: CreateTransactionData): Promise<Transaction> {
    try {
      // Validate required fields
      if (!data.person_id || !data.amount || !data.transaction_type) {
        throw new Error('Missing required fields: person_id, amount, and transaction_type are required')
      }

      if (data.amount <= 0) {
        throw new Error('Amount must be greater than 0')
      }

      // Get current user with enhanced error handling
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('Authentication error in createTransaction:', authError)
        throw new Error(`Authentication failed: ${authError.message}`)
      }
      if (!user) {
        throw new Error('User not authenticated. Please sign in to create transactions.')
      }

      const transactionData = {
        user_id: user.id,
        person_id: data.person_id,
        amount: data.amount,
        transaction_type: data.transaction_type,
        description: data.description || null,
        transaction_date: data.transaction_date || new Date().toISOString()
      }

      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select(`
          *,
          person:persons(*)
        `)
        .single()

      if (error) {
        throw new Error(`Failed to create transaction: ${error.message}`)
      }

      return transaction
    } catch (error) {
      console.error('Error creating transaction:', error)
      throw error
    }
  }

  /**
   * Update an existing transaction
   */
  async updateTransaction(id: string, data: UpdateTransactionData): Promise<Transaction> {
    try {
      if (!id) {
        throw new Error('Transaction ID is required')
      }

      // Validate amount if provided
      if (data.amount !== undefined && data.amount <= 0) {
        throw new Error('Amount must be greater than 0')
      }

      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      }

      const { data: transaction, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          person:persons(*)
        `)
        .single()

      if (error) {
        throw new Error(`Failed to update transaction: ${error.message}`)
      }

      return transaction
    } catch (error) {
      console.error('Error updating transaction:', error)
      throw error
    }
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(id: string): Promise<void> {
    try {
      if (!id) {
        throw new Error('Transaction ID is required')
      }

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Failed to delete transaction: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      throw error
    }
  }

  // ==================== PERSON OPERATIONS ====================

  /**
   * Fetch persons with optional filtering
   */
  async getPersons(filters: PersonFilters = {}): Promise<Person[]> {
    try {
      // Verify authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('Authentication error in getPersons:', authError)
        throw new Error(`Authentication failed: ${authError.message}`)
      }
      if (!user) {
        throw new Error('User not authenticated. Please sign in to view persons.')
      }

      let query = supabase
        .from('persons')
        .select('*')
        .order('name', { ascending: true })

      // Apply search filter
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%`)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to fetch persons: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error fetching persons:', error)
      throw error
    }
  }

  /**
   * Create a new person
   */
  async createPerson(data: CreatePersonData): Promise<Person> {
    try {
      // Validate required fields
      if (!data.name?.trim()) {
        throw new Error('Name is required')
      }

      // Get current user with enhanced error handling
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('Authentication error in createPerson:', authError)
        throw new Error(`Authentication failed: ${authError.message}`)
      }
      if (!user) {
        throw new Error('User not authenticated. Please sign in to create persons.')
      }

      // Check for duplicate phone number if provided
      if (data.phone_number) {
        const { data: existing } = await supabase
          .from('persons')
          .select('id')
          .eq('phone_number', data.phone_number)
          .eq('user_id', user.id)
          .single()

        if (existing) {
          throw new Error('A person with this phone number already exists')
        }
      }

      const personData = {
        user_id: user.id,
        name: data.name.trim(),
        phone_number: data.phone_number?.trim() || null
      }

      const { data: person, error } = await supabase
        .from('persons')
        .insert(personData)
        .select('*')
        .single()

      if (error) {
        throw new Error(`Failed to create person: ${error.message}`)
      }

      return person
    } catch (error) {
      console.error('Error creating person:', error)
      throw error
    }
  }

  /**
   * Update an existing person
   */
  async updatePerson(id: string, data: UpdatePersonData): Promise<Person> {
    try {
      if (!id) {
        throw new Error('Person ID is required')
      }

      // Validate name if provided
      if (data.name !== undefined && !data.name?.trim()) {
        throw new Error('Name cannot be empty')
      }

      // Check for duplicate phone number if provided
      if (data.phone_number) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: existing } = await supabase
            .from('persons')
            .select('id')
            .eq('phone_number', data.phone_number)
            .eq('user_id', user.id)
            .neq('id', id)
            .single()

          if (existing) {
            throw new Error('A person with this phone number already exists')
          }
        }
      }

      const updateData = {
        ...data,
        name: data.name?.trim(),
        phone_number: data.phone_number?.trim() || null,
        updated_at: new Date().toISOString()
      }

      const { data: person, error } = await supabase
        .from('persons')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        throw new Error(`Failed to update person: ${error.message}`)
      }

      return person
    } catch (error) {
      console.error('Error updating person:', error)
      throw error
    }
  }

  /**
   * Delete a person (only if no transactions exist)
   */
  async deletePerson(id: string): Promise<void> {
    try {
      if (!id) {
        throw new Error('Person ID is required')
      }

      // Check if person has any transactions
      const { data: transactions, error: checkError } = await supabase
        .from('transactions')
        .select('id')
        .eq('person_id', id)
        .limit(1)

      if (checkError) {
        throw new Error(`Failed to check person transactions: ${checkError.message}`)
      }

      if (transactions && transactions.length > 0) {
        throw new Error('Cannot delete person with existing transactions')
      }

      const { error } = await supabase
        .from('persons')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Failed to delete person: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting person:', error)
      throw error
    }
  }

  // ==================== BALANCE CALCULATIONS ====================

  /**
   * Get balance summaries for all persons with aggregated data
   */
  async getBalanceSummaries(): Promise<BalanceSummary[]> {
    try {
      // Verify authentication
      // const { data: { user }, error: authError } = await supabase.auth.getUser()
      // if (authError) {
      //   console.error('Authentication error in getBalanceSummaries:', authError)
      //   throw new Error(`Authentication failed: ${authError.message}`)
      // }
      // if (!user) {
      //   throw new Error('User not authenticated. Please sign in to view balance summaries.')
      // }

      const { data, error } = await supabase.rpc('get_balance_summaries')

      if (error) {
        // Fallback to manual calculation if RPC function doesn't exist
        return this.calculateBalanceSummariesManually()
      }

      return data || []
    } catch (error) {
      // Re-throw authentication errors without fallback
      if (error instanceof Error && error.message.includes('Authentication failed')) {
        throw error
      }
      if (error instanceof Error && error.message.includes('User not authenticated')) {
        throw error
      }
      
      console.error('Error fetching balance summaries, falling back to manual calculation:', error)
      // return this.calculateBalanceSummariesManually()
    }
  }

  /**
   * Manual balance calculation as fallback
   */
  private async calculateBalanceSummariesManually(): Promise<BalanceSummary[]> {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          person_id,
          amount,
          transaction_type,
          transaction_date,
          person:persons(name)
        `)

      if (error) {
        throw new Error(`Failed to fetch transactions for balance calculation: ${error.message}`)
      }

      // Group transactions by person and calculate balances
      const balanceMap = new Map<string, BalanceSummary>()

      transactions?.forEach(transaction => {
        const personId = transaction.person_id
        const personName = (transaction.person as any)?.name || 'Unknown'
        
        if (!balanceMap.has(personId)) {
          balanceMap.set(personId, {
            person_id: personId,
            person_name: personName,
            total_credit: 0,
            total_debit: 0,
            net_balance: 0,
            last_transaction_date: transaction.transaction_date,
            transaction_count: 0
          })
        }

        const summary = balanceMap.get(personId)!
        
        if (transaction.transaction_type === 'credit') {
          summary.total_credit += transaction.amount
        } else {
          summary.total_debit += transaction.amount
        }
        
        summary.transaction_count += 1
        
        // Update last transaction date if this one is more recent
        if (new Date(transaction.transaction_date) > new Date(summary.last_transaction_date)) {
          summary.last_transaction_date = transaction.transaction_date
        }
      })

      // Calculate net balances and return as array
      const summaries = Array.from(balanceMap.values()).map(summary => ({
        ...summary,
        net_balance: summary.total_credit - summary.total_debit
      }))

      return summaries.sort((a, b) => Math.abs(b.net_balance) - Math.abs(a.net_balance))
    } catch (error) {
      console.error('Error in manual balance calculation:', error)
      throw error
    }
  }

  /**
   * Get top creditors (people who owe money to the user)
   */
  async getTopCreditors(limit: number = 5): Promise<BalanceSummary[]> {
    try {
      const summaries = await this.getBalanceSummaries()
      return summaries
        .filter(summary => summary.net_balance > 0)
        .sort((a, b) => b.net_balance - a.net_balance)
        .slice(0, limit)
    } catch (error) {
      console.error('Error fetching top creditors:', error)
      throw error
    }
  }

  /**
   * Get top debtors (people the user owes money to)
   */
  async getTopDebtors(limit: number = 5): Promise<BalanceSummary[]> {
    try {
      const summaries = await this.getBalanceSummaries()
      return summaries
        .filter(summary => summary.net_balance < 0)
        .sort((a, b) => a.net_balance - b.net_balance)
        .slice(0, limit)
        .map(summary => ({
          ...summary,
          net_balance: Math.abs(summary.net_balance) // Convert to positive for display
        }))
    } catch (error) {
      console.error('Error fetching top debtors:', error)
      throw error
    }
  }
}

// Export singleton instance
export const moneyService = new MoneyService()