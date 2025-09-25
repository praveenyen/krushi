import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { TransactionTimelineChart } from '../../charts/TransactionTimelineChart';
import type { TrendData } from '../../../types/money';

// Mock Recharts components
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: ({ dataKey }: any) => <div data-testid={`line-${dataKey}`} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('TransactionTimelineChart', () => {
  const mockData: TrendData[] = [
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
    {
      date: '2024-01-03',
      credit_amount: 700,
      debit_amount: 400,
      transaction_count: 8,
    },
  ];

  const mockMonthlyData: TrendData[] = [
    {
      date: '2024-01',
      credit_amount: 5000,
      debit_amount: 3000,
      transaction_count: 50,
    },
    {
      date: '2024-02',
      credit_amount: 4500,
      debit_amount: 3500,
      transaction_count: 45,
    },
  ];

  it('renders loading state', () => {
    render(<TransactionTimelineChart data={[]} loading={true} />);
    
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('renders error state', () => {
    const errorMessage = 'Failed to load data';
    render(<TransactionTimelineChart data={[]} error={errorMessage} />);
    
    expect(screen.getByText('Failed to load chart')).toBeInTheDocument();
  });

  it('renders no data state when data is empty', () => {
    render(<TransactionTimelineChart data={[]} />);
    
    expect(screen.getByText('No transaction data available')).toBeInTheDocument();
  });

  it('renders line chart with valid data', () => {
    render(<TransactionTimelineChart data={mockData} />);
    
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line-credits')).toBeInTheDocument();
    expect(screen.getByTestId('line-debits')).toBeInTheDocument();
    expect(screen.getByTestId('line-net')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  it('handles daily date format correctly', () => {
    render(<TransactionTimelineChart data={mockData} />);
    
    // Chart should render without errors for daily data
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles monthly date format correctly', () => {
    render(<TransactionTimelineChart data={mockMonthlyData} />);
    
    // Chart should render without errors for monthly data
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles loading state correctly', () => {
    render(<TransactionTimelineChart data={mockData} loading={true} />);
    
    // Should show loading spinner even with data
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('prioritizes error state over loading state', () => {
    render(<TransactionTimelineChart data={mockData} loading={true} error="Test error" />);
    
    // Should show error, not loading
    expect(screen.getByText('Failed to load chart')).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
  });

  it('prioritizes error state over data', () => {
    render(<TransactionTimelineChart data={mockData} error="Test error" />);
    
    // Should show error, not chart
    expect(screen.getByText('Failed to load chart')).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('renders all three lines for credits, debits, and net', () => {
    render(<TransactionTimelineChart data={mockData} />);
    
    expect(screen.getByTestId('line-credits')).toBeInTheDocument();
    expect(screen.getByTestId('line-debits')).toBeInTheDocument();
    expect(screen.getByTestId('line-net')).toBeInTheDocument();
  });
});