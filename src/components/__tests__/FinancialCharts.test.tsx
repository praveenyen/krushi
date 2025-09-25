import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FinancialCharts } from '../FinancialCharts';
import { useMoneyStore } from '../../stores/moneyStore';
import { analyticsService } from '../../services/analyticsService';
import type { DistributionData, TrendData, PartnerData, SpendingPattern } from '../../types/money';

// Mock the store
vi.mock('../../stores/moneyStore');
const mockUseMoneyStore = vi.mocked(useMoneyStore);

// Mock the analytics service
vi.mock('../../services/analyticsService');
const mockAnalyticsService = vi.mocked(analyticsService);

// Mock the chart components
vi.mock('../charts/CreditDebitPieChart', () => ({
  CreditDebitPieChart: ({ data, loading, error }: any) => (
    <div data-testid="pie-chart">
      {loading && <div>Loading pie chart...</div>}
      {error && <div>Error: {error}</div>}
      {data && <div>Pie chart with data</div>}
    </div>
  ),
}));

vi.mock('../charts/TransactionTimelineChart', () => ({
  TransactionTimelineChart: ({ data, loading, error }: any) => (
    <div data-testid="timeline-chart">
      {loading && <div>Loading timeline chart...</div>}
      {error && <div>Error: {error}</div>}
      {data && data.length > 0 && <div>Timeline chart with data</div>}
    </div>
  ),
}));

vi.mock('../charts/TopPartnersBarChart', () => ({
  TopPartnersBarChart: ({ data, loading, error }: any) => (
    <div data-testid="bar-chart">
      {loading && <div>Loading bar chart...</div>}
      {error && <div>Error: {error}</div>}
      {data && data.length > 0 && <div>Bar chart with data</div>}
    </div>
  ),
}));

vi.mock('../charts/BalanceAreaChart', () => ({
  BalanceAreaChart: ({ data, loading, error }: any) => (
    <div data-testid="area-chart">
      {loading && <div>Loading area chart...</div>}
      {error && <div>Error: {error}</div>}
      {data && data.length > 0 && <div>Area chart with data</div>}
    </div>
  ),
}));

describe('FinancialCharts', () => {
  const mockSetSelectedTimeRange = vi.fn();

  const mockDistribution: DistributionData = {
    credit_total: 1000,
    debit_total: 800,
    credit_percentage: 55.6,
    debit_percentage: 44.4,
  };

  const mockTrends: TrendData[] = [
    {
      date: '2024-01-01',
      credit_amount: 500,
      debit_amount: 300,
      transaction_count: 5,
    },
    {
      date: '2024-01-02',
      credit_amount: 300,
      debit_amount: 200,
      transaction_count: 3,
    },
  ];

  const mockPartners: PartnerData[] = [
    {
      person_id: '1',
      person_name: 'John Doe',
      total_amount: 500,
      transaction_count: 3,
      relationship_type: 'creditor',
    },
    {
      person_id: '2',
      person_name: 'Jane Smith',
      total_amount: 300,
      transaction_count: 2,
      relationship_type: 'debtor',
    },
  ];

  const mockSpendingPatterns: SpendingPattern[] = [
    {
      month: '2024-01',
      credit_total: 1000,
      debit_total: 800,
      net_amount: 200,
    },
    {
      month: '2024-02',
      credit_total: 1200,
      debit_total: 900,
      net_amount: 300,
    },
  ];

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup default store mock
    mockUseMoneyStore.mockReturnValue({
      uiState: {
        selectedTimeRange: '30d',
        activeFilters: {},
        showTransactionForm: false,
        showPersonForm: false,
        selectedPerson: null,
        selectedTransaction: null,
      },
      setSelectedTimeRange: mockSetSelectedTimeRange,
    } as any);

    // Setup default analytics service mocks
    mockAnalyticsService.getCreditDebitDistribution.mockResolvedValue(mockDistribution);
    mockAnalyticsService.getTransactionTrends.mockResolvedValue(mockTrends);
    mockAnalyticsService.getTopTransactionPartners.mockResolvedValue(mockPartners);
    mockAnalyticsService.getMonthlySpendingPattern.mockResolvedValue(mockSpendingPatterns);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders financial charts container with header', () => {
    render(<FinancialCharts />);
    
    expect(screen.getByText('Financial Overview')).toBeInTheDocument();
  });

  it('renders time range selector buttons', () => {
    render(<FinancialCharts />);
    
    expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
    expect(screen.getByText('Last 90 days')).toBeInTheDocument();
    expect(screen.getByText('Last year')).toBeInTheDocument();
    expect(screen.getByText('All time')).toBeInTheDocument();
  });

  it('highlights selected time range', () => {
    render(<FinancialCharts />);
    
    const thirtyDayButton = screen.getByText('Last 30 days');
    expect(thirtyDayButton).toHaveClass('bg-blue-600', 'text-white');
  });

  it('calls setSelectedTimeRange when time range button is clicked', () => {
    render(<FinancialCharts />);
    
    const sevenDayButton = screen.getByText('Last 7 days');
    fireEvent.click(sevenDayButton);
    
    expect(mockSetSelectedTimeRange).toHaveBeenCalledWith('7d');
  });

  it('shows loading state initially', () => {
    render(<FinancialCharts />);
    
    // Should show loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders all chart components after data loads', async () => {
    render(<FinancialCharts />);
    
    await waitFor(() => {
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByTestId('timeline-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });
  });

  it('displays chart section titles', async () => {
    render(<FinancialCharts />);
    
    await waitFor(() => {
      expect(screen.getByText('Credit vs Debit Distribution')).toBeInTheDocument();
      expect(screen.getByText('Transaction Timeline')).toBeInTheDocument();
      expect(screen.getByText('Top Partners')).toBeInTheDocument();
      expect(screen.getByText('Balance Over Time')).toBeInTheDocument();
    });
  });

  it('handles analytics service errors gracefully', async () => {
    const errorMessage = 'Failed to fetch data';
    mockAnalyticsService.getCreditDebitDistribution.mockRejectedValue(new Error(errorMessage));
    mockAnalyticsService.getTransactionTrends.mockRejectedValue(new Error(errorMessage));
    mockAnalyticsService.getTopTransactionPartners.mockRejectedValue(new Error(errorMessage));
    mockAnalyticsService.getMonthlySpendingPattern.mockRejectedValue(new Error(errorMessage));

    render(<FinancialCharts />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load charts')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('allows retry after error', async () => {
    // First call fails
    mockAnalyticsService.getCreditDebitDistribution.mockRejectedValueOnce(new Error('Network error'));
    mockAnalyticsService.getTransactionTrends.mockRejectedValueOnce(new Error('Network error'));
    mockAnalyticsService.getTopTransactionPartners.mockRejectedValueOnce(new Error('Network error'));
    mockAnalyticsService.getMonthlySpendingPattern.mockRejectedValueOnce(new Error('Network error'));

    // Second call succeeds
    mockAnalyticsService.getCreditDebitDistribution.mockResolvedValue(mockDistribution);
    mockAnalyticsService.getTransactionTrends.mockResolvedValue(mockTrends);
    mockAnalyticsService.getTopTransactionPartners.mockResolvedValue(mockPartners);
    mockAnalyticsService.getMonthlySpendingPattern.mockResolvedValue(mockSpendingPatterns);

    render(<FinancialCharts />);
    
    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    // Click retry
    fireEvent.click(screen.getByText('Try Again'));

    // Should show charts after retry
    await waitFor(() => {
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
  });

  it('fetches new data when time range changes', async () => {
    render(<FinancialCharts />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(mockAnalyticsService.getCreditDebitDistribution).toHaveBeenCalledWith('30d');
    });

    // Change time range
    fireEvent.click(screen.getByText('Last 7 days'));

    // Should call setSelectedTimeRange
    expect(mockSetSelectedTimeRange).toHaveBeenCalledWith('7d');
  });

  it('applies custom className', () => {
    const { container } = render(<FinancialCharts className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('financial-charts', 'custom-class');
  });

  it('shows mobile optimization note on mobile', () => {
    render(<FinancialCharts />);
    
    expect(screen.getByText('Rotate your device for better chart viewing experience')).toBeInTheDocument();
  });

  it('calls analytics service with correct parameters', async () => {
    render(<FinancialCharts />);
    
    await waitFor(() => {
      expect(mockAnalyticsService.getCreditDebitDistribution).toHaveBeenCalledWith('30d');
      expect(mockAnalyticsService.getTransactionTrends).toHaveBeenCalledWith('30d');
      expect(mockAnalyticsService.getTopTransactionPartners).toHaveBeenCalledWith(10);
      expect(mockAnalyticsService.getMonthlySpendingPattern).toHaveBeenCalledWith(12);
    });
  });

  it('passes correct props to chart components', async () => {
    render(<FinancialCharts />);
    
    await waitFor(() => {
      // Check that charts receive the expected data
      expect(screen.getByText('Pie chart with data')).toBeInTheDocument();
      expect(screen.getByText('Timeline chart with data')).toBeInTheDocument();
      expect(screen.getByText('Bar chart with data')).toBeInTheDocument();
      expect(screen.getByText('Area chart with data')).toBeInTheDocument();
    });
  });
});