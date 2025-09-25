import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { analyticsService } from '../analyticsService'
import { moneyService } from '../moneyService'

// Mock moneyService
vi.mock('../moneyService', () => ({
  moneyService: {
    getTransactions: vi.fn(),
    getBalanceSummaries: vi.fn(),
    getTopCreditors: vi.fn(),
    getTopDebtors: vi.fn()
  }
}))

const mockMoneyService = moneyService as any

describe('AnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getTransactionTrends', () => {
    it('should calculate daily trends for 7d timerange', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: 100,
          transaction_type: 'credit',
          transaction_date: '2024-01-01T10:00:00Z'
        },
        {
          id: '2',
          amount: 50,
          transaction_type: 'debit',
          transaction_date: '2024-01-01T15:00:00Z'
        },
        {
          id: '3',
          amount: 75,
          transaction_type: 'credit',
          transaction_date: '2024-01-02T12:00:00Z'
        }
      ]

      mockMoneyService.getTransactions.mockResolvedValue(mockTransactions)

      const result = await analyticsService.getTransactionTrends('7d')

      expect(mockMoneyService.getTransactions).toHaveBeenCalledWith({
        start_date: expect.any(String)
      })
      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
      
      // Check that data is properly aggregated
      const jan1Data = result.find(item => item.date === '2024-01-01')
      if (jan1Data) {
        expect(jan1Data.credit_amount).toBe(100)
        expect(jan1Data.debit_amount).toBe(50)
        expect(jan1Data.transaction_count).toBe(2)
      }
    })

    it('should handle empty transaction data', async () => {
      mockMoneyService.getTransactions.mockResolvedValue([])

      const result = await analyticsService.getTransactionTrends('30d')

      expect(result).toBeInstanceOf(Array)
      expect(result.every(item => item.credit_amount === 0 && item.debit_amount === 0)).toBe(true)
    })

    it('should group by month for yearly timerange', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: 100,
          transaction_type: 'credit',
          transaction_date: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          amount: 200,
          transaction_type: 'credit',
          transaction_date: '2024-01-20T10:00:00Z'
        }
      ]

      mockMoneyService.getTransactions.mockResolvedValue(mockTransactions)

      const result = await analyticsService.getTransactionTrends('1y')

      expect(result).toBeInstanceOf(Array)
      // Should have monthly groupings
      const janData = result.find(item => item.date === '2024-01')
      if (janData) {
        expect(janData.credit_amount).toBe(300)
        expect(janData.transaction_count).toBe(2)
      }
    })
  })

  describe('getCreditDebitDistribution', () => {
    it('should calculate correct distribution percentages', async () => {
      const mockTransactions = [
        { id: '1', amount: 100, transaction_type: 'credit' },
        { id: '2', amount: 200, transaction_type: 'credit' },
        { id: '3', amount: 150, transaction_type: 'debit' }
      ]

      mockMoneyService.getTransactions.mockResolvedValue(mockTransactions)

      const result = await analyticsService.getCreditDebitDistribution('30d')

      expect(result).toEqual({
        credit_total: 300,
        debit_total: 150,
        credit_percentage: (300 / 450) * 100, // ~66.67%
        debit_percentage: (150 / 450) * 100   // ~33.33%
      })
    })

    it('should handle zero transactions', async () => {
      mockMoneyService.getTransactions.mockResolvedValue([])

      const result = await analyticsService.getCreditDebitDistribution()

      expect(result).toEqual({
        credit_total: 0,
        debit_total: 0,
        credit_percentage: 0,
        debit_percentage: 0
      })
    })
  })

  describe('getTopTransactionPartners', () => {
    it('should return partners sorted by transaction amount', async () => {
      const mockSummaries = [
        {
          person_id: '1',
          person_name: 'John Doe',
          net_balance: 150,
          transaction_count: 3
        },
        {
          person_id: '2',
          person_name: 'Jane Smith',
          net_balance: -200,
          transaction_count: 5
        },
        {
          person_id: '3',
          person_name: 'Bob Johnson',
          net_balance: 75,
          transaction_count: 2
        }
      ]

      mockMoneyService.getBalanceSummaries.mockResolvedValue(mockSummaries)

      const result = await analyticsService.getTopTransactionPartners(3)

      expect(result).toHaveLength(3)
      expect(result[0]).toMatchObject({
        person_name: 'Jane Smith',
        total_amount: 200,
        relationship_type: 'debtor'
      })
      expect(result[1]).toMatchObject({
        person_name: 'John Doe',
        total_amount: 150,
        relationship_type: 'creditor'
      })
      expect(result[2]).toMatchObject({
        person_name: 'Bob Johnson',
        total_amount: 75,
        relationship_type: 'creditor'
      })
    })
  })

  describe('getTopCreditors', () => {
    it('should return formatted creditor data', async () => {
      const mockCreditors = [
        {
          person_id: '1',
          person_name: 'John Doe',
          net_balance: 150,
          transaction_count: 3
        }
      ]

      mockMoneyService.getTopCreditors.mockResolvedValue(mockCreditors)

      const result = await analyticsService.getTopCreditors(5)

      expect(mockMoneyService.getTopCreditors).toHaveBeenCalledWith(5)
      expect(result).toEqual([
        {
          person_id: '1',
          person_name: 'John Doe',
          total_amount: 150,
          transaction_count: 3,
          relationship_type: 'creditor'
        }
      ])
    })
  })

  describe('getTopDebtors', () => {
    it('should return formatted debtor data', async () => {
      const mockDebtors = [
        {
          person_id: '2',
          person_name: 'Jane Smith',
          net_balance: 200, // Already positive from moneyService
          transaction_count: 5
        }
      ]

      mockMoneyService.getTopDebtors.mockResolvedValue(mockDebtors)

      const result = await analyticsService.getTopDebtors(5)

      expect(mockMoneyService.getTopDebtors).toHaveBeenCalledWith(5)
      expect(result).toEqual([
        {
          person_id: '2',
          person_name: 'Jane Smith',
          total_amount: 200,
          transaction_count: 5,
          relationship_type: 'debtor'
        }
      ])
    })
  })

  describe('getMonthlySpendingPattern', () => {
    it('should calculate monthly patterns correctly', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: 100,
          transaction_type: 'credit',
          transaction_date: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          amount: 50,
          transaction_type: 'debit',
          transaction_date: '2024-01-20T10:00:00Z'
        },
        {
          id: '3',
          amount: 200,
          transaction_type: 'credit',
          transaction_date: '2024-02-10T10:00:00Z'
        }
      ]

      mockMoneyService.getTransactions.mockResolvedValue(mockTransactions)

      const result = await analyticsService.getMonthlySpendingPattern(3)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBe(3)
      
      // Check structure
      result.forEach(pattern => {
        expect(pattern).toHaveProperty('month')
        expect(pattern).toHaveProperty('credit_total')
        expect(pattern).toHaveProperty('debit_total')
        expect(pattern).toHaveProperty('net_amount')
      })
    })
  })

  describe('getFinancialSummary', () => {
    it('should calculate comprehensive financial summary', async () => {
      const mockTransactions = [
        { id: '1', amount: 100, transaction_type: 'credit' },
        { id: '2', amount: 200, transaction_type: 'credit' },
        { id: '3', amount: 50, transaction_type: 'debit' }
      ]

      const mockTopCreditors = [
        { person_name: 'John Doe', total_amount: 150, transaction_count: 2, relationship_type: 'creditor' }
      ]

      const mockTopDebtors = [
        { person_name: 'Jane Smith', total_amount: 75, transaction_count: 1, relationship_type: 'debtor' }
      ]

      mockMoneyService.getTransactions.mockResolvedValue(mockTransactions)
      vi.spyOn(analyticsService, 'getTopCreditors').mockResolvedValue(mockTopCreditors as any)
      vi.spyOn(analyticsService, 'getTopDebtors').mockResolvedValue(mockTopDebtors as any)

      const result = await analyticsService.getFinancialSummary('30d')

      expect(result).toEqual({
        totalCredits: 300,
        totalDebits: 50,
        netBalance: 250,
        transactionCount: 3,
        topCreditor: mockTopCreditors[0],
        topDebtor: mockTopDebtors[0],
        averageTransactionAmount: (300 + 50) / 3
      })
    })

    it('should handle empty data gracefully', async () => {
      mockMoneyService.getTransactions.mockResolvedValue([])
      vi.spyOn(analyticsService, 'getTopCreditors').mockResolvedValue([])
      vi.spyOn(analyticsService, 'getTopDebtors').mockResolvedValue([])

      const result = await analyticsService.getFinancialSummary()

      expect(result).toEqual({
        totalCredits: 0,
        totalDebits: 0,
        netBalance: 0,
        transactionCount: 0,
        topCreditor: null,
        topDebtor: null,
        averageTransactionAmount: 0
      })
    })
  })

  describe('Chart Data Transformations', () => {
    it('should transform distribution data for pie chart', () => {
      const distribution = {
        credit_total: 300,
        debit_total: 200,
        credit_percentage: 60,
        debit_percentage: 40
      }

      const result = analyticsService.transformForPieChart(distribution)

      expect(result).toEqual([
        { name: 'Credits', value: 300, percentage: 60 },
        { name: 'Debits', value: 200, percentage: 40 }
      ])
    })

    it('should transform trend data for line chart', () => {
      const trends = [
        { date: '2024-01-01', credit_amount: 100, debit_amount: 50, transaction_count: 2 },
        { date: '2024-01-02', credit_amount: 200, debit_amount: 75, transaction_count: 3 }
      ]

      const result = analyticsService.transformForLineChart(trends)

      expect(result).toEqual([
        { date: '2024-01-01', credits: 100, debits: 50, net: 50 },
        { date: '2024-01-02', credits: 200, debits: 75, net: 125 }
      ])
    })

    it('should transform partner data for bar chart', () => {
      const partners = [
        {
          person_id: '1',
          person_name: 'John Doe',
          total_amount: 150,
          transaction_count: 3,
          relationship_type: 'creditor' as const
        }
      ]

      const result = analyticsService.transformForBarChart(partners)

      expect(result).toEqual([
        { name: 'John Doe', amount: 150, type: 'creditor', count: 3 }
      ])
    })

    it('should transform spending patterns for area chart', () => {
      const patterns = [
        { month: '2024-01', credit_total: 300, debit_total: 100, net_amount: 200 }
      ]

      const result = analyticsService.transformForAreaChart(patterns)

      expect(result).toEqual([
        { month: '2024-01', credits: 300, debits: 100, net: 200 }
      ])
    })
  })
})