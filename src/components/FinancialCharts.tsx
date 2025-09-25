'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useMoneyStore } from '../stores/moneyStore';
import { analyticsService } from '../services/analyticsService';
import type { 
  TimeRange, 
  TrendData, 
  DistributionData, 
  PartnerData, 
  SpendingPattern 
} from '../types/money';

// Individual chart components (to be implemented in subtask 5.2)
import { CreditDebitPieChart } from './charts/CreditDebitPieChart';
import { TransactionTimelineChart } from './charts/TransactionTimelineChart';
import { TopPartnersBarChart } from './charts/TopPartnersBarChart';
import { BalanceAreaChart } from './charts/BalanceAreaChart';

interface FinancialChartsProps {
  className?: string;
}

interface ChartData {
  distribution: DistributionData | null;
  trends: TrendData[];
  partners: PartnerData[];
  spendingPatterns: SpendingPattern[];
}

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
  { value: 'all', label: 'All time' },
];

export function FinancialCharts({ className = '' }: FinancialChartsProps) {
  const { uiState, setSelectedTimeRange } = useMoneyStore();
  const { selectedTimeRange } = uiState;

  // Chart data state
  const [chartData, setChartData] = useState<ChartData>({
    distribution: null,
    trends: [],
    partners: [],
    spendingPatterns: [],
  });

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch chart data based on selected time range
  const fetchChartData = async (timeRange: TimeRange) => {
    try {
      setLoading(true);
      setError(null);

      const [distribution, trends, partners, spendingPatterns] = await Promise.all([
        analyticsService.getCreditDebitDistribution(timeRange),
        analyticsService.getTransactionTrends(timeRange),
        analyticsService.getTopTransactionPartners(10),
        analyticsService.getMonthlySpendingPattern(12),
      ]);

      setChartData({
        distribution,
        trends,
        partners,
        spendingPatterns,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chart data';
      setError(errorMessage);
      console.error('Error fetching chart data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when time range changes
  useEffect(() => {
    fetchChartData(selectedTimeRange);
  }, [selectedTimeRange]);

  // Handle time range selection
  const handleTimeRangeChange = (timeRange: TimeRange) => {
    setSelectedTimeRange(timeRange);
  };

  // Retry function for error recovery
  const handleRetry = () => {
    fetchChartData(selectedTimeRange);
  };

  // Memoized chart props to prevent unnecessary re-renders
  const chartProps = useMemo(() => ({
    distribution: chartData.distribution,
    trends: chartData.trends,
    partners: chartData.partners,
    spendingPatterns: chartData.spendingPatterns,
    loading,
    error,
  }), [chartData, loading, error]);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-48 bg-gray-200 rounded-lg"></div>
        <div className="h-48 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );

  // Error display component
  const ErrorDisplay = () => (
    <div className="text-center py-8">
      <div className="text-red-600 mb-4">
        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg font-medium">Failed to load charts</p>
        <p className="text-sm text-gray-600 mt-1">{error}</p>
      </div>
      <button
        onClick={handleRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div className={`financial-charts ${className}`}>
      {/* Header with time range selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Financial Overview</h2>
        
        {/* Time range selector */}
        <div className="flex flex-wrap gap-2">
          {TIME_RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleTimeRangeChange(option.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                selectedTimeRange === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart content */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorDisplay />
      ) : (
        <div className="space-y-8">
          {/* Credit vs Debit Distribution - Full width */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit vs Debit Distribution</h3>
            <div className="h-64 sm:h-80">
              <CreditDebitPieChart 
                data={chartProps.distribution} 
                loading={loading}
                error={error}
              />
            </div>
          </div>

          {/* Transaction Timeline - Full width */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Timeline</h3>
            <div className="h-64 sm:h-80">
              <TransactionTimelineChart 
                data={chartProps.trends} 
                loading={loading}
                error={error}
              />
            </div>
          </div>

          {/* Two column layout for smaller charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Partners Bar Chart */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Partners</h3>
              <div className="h-64">
                <TopPartnersBarChart 
                  data={chartProps.partners} 
                  loading={loading}
                  error={error}
                />
              </div>
            </div>

            {/* Balance Over Time Area Chart */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Balance Over Time</h3>
              <div className="h-64">
                <BalanceAreaChart 
                  data={chartProps.spendingPatterns} 
                  loading={loading}
                  error={error}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile optimization note */}
      <div className="mt-6 text-xs text-gray-500 text-center sm:hidden">
        Rotate your device for better chart viewing experience
      </div>
    </div>
  );
}