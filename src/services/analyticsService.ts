import { moneyService } from './moneyService'
import type {
  Transaction,
  BalanceSummary,
  TrendData,
  DistributionData,
  PartnerData,
  SpendingPattern,
  TimeRange,
  TransactionFilters
} from '../types/money'

/**
 * Service class for money tracker analytics and data processing
 * Handles calculations for visualizations and insights
 */
export class AnalyticsService {

  // ==================== TIME RANGE UTILITIES ====================

  /**
   * Convert TimeRange to date filters
   */
  private getDateRangeFromTimeRange(timeRange: TimeRange): { start_date?: string; end_date?: string } {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (timeRange) {
      case '7d':
        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(today.getDate() - 7)
        return { start_date: sevenDaysAgo.toISOString() }
      
      case '30d':
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(today.getDate() - 30)
        return { start_date: thirtyDaysAgo.toISOString() }
      
      case '90d':
        const ninetyDaysAgo = new Date(today)
        ninetyDaysAgo.setDate(today.getDate() - 90)
        return { start_date: ninetyDaysAgo.toISOString() }
      
      case '1y':
        const oneYearAgo = new Date(today)
        oneYearAgo.setFullYear(today.getFullYear() - 1)
        return { start_date: oneYearAgo.toISOString() }
      
      case 'all':
      default:
        return {}
    }
  }

  /**
   * Group transactions by date period
   */
  private groupTransactionsByPeriod(
    transactions: Transaction[], 
    period: 'day' | 'week' | 'month' = 'day'
  ): Map<string, Transaction[]> {
    const groups = new Map<string, Transaction[]>()

    transactions.forEach(transaction => {
      const date = new Date(transaction.transaction_date)
      let key: string

      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0] // YYYY-MM-DD
          break
        case 'week':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        default:
          key = date.toISOString().split('T')[0]
      }

      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(transaction)
    })

    return groups
  }

  // ==================== TREND ANALYSIS ====================

  /**
   * Get transaction trends over time periods
   */
  async getTransactionTrends(timeRange: TimeRange = '30d'): Promise<TrendData[]> {
    try {
      const dateFilters = this.getDateRangeFromTimeRange(timeRange)
      const transactions = await moneyService.getTransactions(dateFilters)

      // Determine grouping period based on time range
      let period: 'day' | 'week' | 'month' = 'day'
      if (timeRange === '1y' || timeRange === 'all') {
        period = 'month'
      } else if (timeRange === '90d') {
        period = 'week'
      }

      const groupedTransactions = this.groupTransactionsByPeriod(transactions, period)
      const trendData: TrendData[] = []

      // Generate complete date range to fill gaps
      const dates = this.generateDateRange(timeRange, period)

      dates.forEach(date => {
        const dayTransactions = groupedTransactions.get(date) || []
        
        const creditAmount = dayTransactions
          .filter(t => t.transaction_type === 'credit')
          .reduce((sum, t) => sum + t.amount, 0)
        
        const debitAmount = dayTransactions
          .filter(t => t.transaction_type === 'debit')
          .reduce((sum, t) => sum + t.amount, 0)

        trendData.push({
          date,
          credit_amount: creditAmount,
          debit_amount: debitAmount,
          transaction_count: dayTransactions.length
        })
      })

      return trendData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    } catch (error) {
      console.error('Error calculating transaction trends:', error)
      throw error
    }
  }

  /**
   * Generate complete date range for trend analysis
   */
  private generateDateRange(timeRange: TimeRange, period: 'day' | 'week' | 'month'): string[] {
    const dates: string[] = []
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    let startDate: Date
    let increment: number
    let unit: 'day' | 'week' | 'month'

    switch (timeRange) {
      case '7d':
        startDate = new Date(today)
        startDate.setDate(today.getDate() - 7)
        increment = 1
        unit = 'day'
        break
      case '30d':
        startDate = new Date(today)
        startDate.setDate(today.getDate() - 30)
        increment = period === 'week' ? 7 : 1
        unit = period === 'week' ? 'week' : 'day'
        break
      case '90d':
        startDate = new Date(today)
        startDate.setDate(today.getDate() - 90)
        increment = period === 'month' ? 1 : 7
        unit = period === 'month' ? 'month' : 'week'
        break
      case '1y':
        startDate = new Date(today)
        startDate.setFullYear(today.getFullYear() - 1)
        increment = 1
        unit = 'month'
        break
      default:
        // For 'all', just return last 12 months
        startDate = new Date(today)
        startDate.setFullYear(today.getFullYear() - 1)
        increment = 1
        unit = 'month'
    }

    const current = new Date(startDate)
    while (current <= today) {
      let key: string
      
      if (unit === 'day') {
        key = current.toISOString().split('T')[0]
        current.setDate(current.getDate() + increment)
      } else if (unit === 'week') {
        const weekStart = new Date(current)
        weekStart.setDate(current.getDate() - current.getDay())
        key = weekStart.toISOString().split('T')[0]
        current.setDate(current.getDate() + 7)
      } else {
        key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
        current.setMonth(current.getMonth() + 1)
      }
      
      dates.push(key)
    }

    return dates
  }

  // ==================== DISTRIBUTION ANALYSIS ====================

  /**
   * Calculate credit vs debit distribution
   */
  async getCreditDebitDistribution(timeRange: TimeRange = 'all'): Promise<DistributionData> {
    try {
      const dateFilters = this.getDateRangeFromTimeRange(timeRange)
      const transactions = await moneyService.getTransactions(dateFilters)

      const creditTotal = transactions
        .filter(t => t.transaction_type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0)

      const debitTotal = transactions
        .filter(t => t.transaction_type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0)

      const total = creditTotal + debitTotal

      return {
        credit_total: creditTotal,
        debit_total: debitTotal,
        credit_percentage: total > 0 ? (creditTotal / total) * 100 : 0,
        debit_percentage: total > 0 ? (debitTotal / total) * 100 : 0
      }
    } catch (error) {
      console.error('Error calculating credit/debit distribution:', error)
      throw error
    }
  }

  // ==================== PARTNER ANALYSIS ====================

  /**
   * Get top transaction partners (both creditors and debtors)
   */
  async getTopTransactionPartners(limit: number = 10): Promise<PartnerData[]> {
    try {
      const balanceSummaries = await moneyService.getBalanceSummaries()
      
      const partners: PartnerData[] = balanceSummaries.map(summary => ({
        person_id: summary.person_id,
        person_name: summary.person_name,
        total_amount: Math.abs(summary.net_balance),
        transaction_count: summary.transaction_count,
        relationship_type: summary.net_balance > 0 ? 'creditor' : 'debtor'
      }))

      return partners
        .sort((a, b) => b.total_amount - a.total_amount)
        .slice(0, limit)
    } catch (error) {
      console.error('Error fetching top transaction partners:', error)
      throw error
    }
  }

  /**
   * Get top creditors (people who owe money)
   */
  async getTopCreditors(limit: number = 5): Promise<PartnerData[]> {
    try {
      const creditors = await moneyService.getTopCreditors(limit)
      
      return creditors.map(summary => ({
        person_id: summary.person_id,
        person_name: summary.person_name,
        total_amount: summary.net_balance,
        transaction_count: summary.transaction_count,
        relationship_type: 'creditor' as const
      }))
    } catch (error) {
      console.error('Error fetching top creditors:', error)
      throw error
    }
  }

  /**
   * Get top debtors (people user owes money to)
   */
  async getTopDebtors(limit: number = 5): Promise<PartnerData[]> {
    try {
      const debtors = await moneyService.getTopDebtors(limit)
      
      return debtors.map(summary => ({
        person_id: summary.person_id,
        person_name: summary.person_name,
        total_amount: summary.net_balance, // Already converted to positive in moneyService
        transaction_count: summary.transaction_count,
        relationship_type: 'debtor' as const
      }))
    } catch (error) {
      console.error('Error fetching top debtors:', error)
      throw error
    }
  }

  // ==================== SPENDING PATTERNS ====================

  /**
   * Get monthly spending patterns
   */
  async getMonthlySpendingPattern(months: number = 12): Promise<SpendingPattern[]> {
    try {
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - months)
      
      const transactions = await moneyService.getTransactions({
        start_date: startDate.toISOString()
      })

      const monthlyGroups = this.groupTransactionsByPeriod(transactions, 'month')
      const patterns: SpendingPattern[] = []

      // Generate last N months
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        const monthTransactions = monthlyGroups.get(monthKey) || []
        
        const creditTotal = monthTransactions
          .filter(t => t.transaction_type === 'credit')
          .reduce((sum, t) => sum + t.amount, 0)
        
        const debitTotal = monthTransactions
          .filter(t => t.transaction_type === 'debit')
          .reduce((sum, t) => sum + t.amount, 0)

        patterns.push({
          month: monthKey,
          credit_total: creditTotal,
          debit_total: debitTotal,
          net_amount: creditTotal - debitTotal
        })
      }

      return patterns
    } catch (error) {
      console.error('Error calculating monthly spending patterns:', error)
      throw error
    }
  }

  // ==================== CHART DATA TRANSFORMATIONS ====================

  /**
   * Transform balance summaries for pie chart consumption
   */
  transformForPieChart(distribution: DistributionData): Array<{ name: string; value: number; percentage: number }> {
    return [
      {
        name: 'Credits',
        value: distribution.credit_total,
        percentage: distribution.credit_percentage
      },
      {
        name: 'Debits',
        value: distribution.debit_total,
        percentage: distribution.debit_percentage
      }
    ]
  }

  /**
   * Transform trend data for line chart consumption
   */
  transformForLineChart(trends: TrendData[]): Array<{ date: string; credits: number; debits: number; net: number }> {
    return trends.map(trend => ({
      date: trend.date,
      credits: trend.credit_amount,
      debits: trend.debit_amount,
      net: trend.credit_amount - trend.debit_amount
    }))
  }

  /**
   * Transform partner data for bar chart consumption
   */
  transformForBarChart(partners: PartnerData[]): Array<{ name: string; amount: number; type: string; count: number }> {
    return partners.map(partner => ({
      name: partner.person_name,
      amount: partner.total_amount,
      type: partner.relationship_type,
      count: partner.transaction_count
    }))
  }

  /**
   * Transform spending patterns for area chart consumption
   */
  transformForAreaChart(patterns: SpendingPattern[]): Array<{ month: string; credits: number; debits: number; net: number }> {
    return patterns.map(pattern => ({
      month: pattern.month,
      credits: pattern.credit_total,
      debits: pattern.debit_total,
      net: pattern.net_amount
    }))
  }

  // ==================== SUMMARY STATISTICS ====================

  /**
   * Get comprehensive financial summary
   */
  async getFinancialSummary(timeRange: TimeRange = '30d'): Promise<{
    totalCredits: number;
    totalDebits: number;
    netBalance: number;
    transactionCount: number;
    topCreditor: PartnerData | null;
    topDebtor: PartnerData | null;
    averageTransactionAmount: number;
  }> {
    try {
      const dateFilters = this.getDateRangeFromTimeRange(timeRange)
      const transactions = await moneyService.getTransactions(dateFilters)
      
      const totalCredits = transactions
        .filter(t => t.transaction_type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const totalDebits = transactions
        .filter(t => t.transaction_type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0)

      const topCreditors = await this.getTopCreditors(1)
      const topDebtors = await this.getTopDebtors(1)

      const averageTransactionAmount = transactions.length > 0 
        ? (totalCredits + totalDebits) / transactions.length 
        : 0

      return {
        totalCredits,
        totalDebits,
        netBalance: totalCredits - totalDebits,
        transactionCount: transactions.length,
        topCreditor: topCreditors[0] || null,
        topDebtor: topDebtors[0] || null,
        averageTransactionAmount
      }
    } catch (error) {
      console.error('Error calculating financial summary:', error)
      throw error
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService()