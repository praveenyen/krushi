import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { CreditDebitPieChart } from '../../charts/CreditDebitPieChart';
import type { DistributionData } from '../../../types/money';

// Mock Recharts components
vi.mock('recharts', () => ({
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ data }: any) => <div data-testid="pie" data-length={data?.length || 0} />,
  Cell: () => <div data-testid="cell" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('CreditDebitPieChart', () => {
  const mockData: DistributionData = {
    credit_total: 1000,
    debit_total: 800,
    credit_percentage: 55.6,
    debit_percentage: 44.4,
  };

  it('renders loading state', () => {
    render(<CreditDebitPieChart data={null} loading={true} />);
    
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const errorMessage = 'Failed to load data';
    render(<CreditDebitPieChart data={null} error={errorMessage} />);
    
    expect(screen.getByText('Failed to load chart')).toBeInTheDocument();
  });

  it('renders no data state when data is null', () => {
    render(<CreditDebitPieChart data={null} />);
    
    expect(screen.getByText('No transaction data available')).toBeInTheDocument();
  });

  it('renders no data state when totals are zero', () => {
    const emptyData: DistributionData = {
      credit_total: 0,
      debit_total: 0,
      credit_percentage: 0,
      debit_percentage: 0,
    };
    
    render(<CreditDebitPieChart data={emptyData} />);
    
    expect(screen.getByText('No transaction data available')).toBeInTheDocument();
  });

  it('renders pie chart with valid data', () => {
    render(<CreditDebitPieChart data={mockData} />);
    
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  it('filters out zero values from chart data', () => {
    const dataWithZero: DistributionData = {
      credit_total: 1000,
      debit_total: 0,
      credit_percentage: 100,
      debit_percentage: 0,
    };
    
    render(<CreditDebitPieChart data={dataWithZero} />);
    
    const pieElement = screen.getByTestId('pie');
    expect(pieElement).toHaveAttribute('data-length', '1'); // Only one segment
  });

  it('includes both segments when both have values', () => {
    render(<CreditDebitPieChart data={mockData} />);
    
    const pieElement = screen.getByTestId('pie');
    expect(pieElement).toHaveAttribute('data-length', '2'); // Both segments
  });

  it('handles loading state correctly', () => {
    render(<CreditDebitPieChart data={mockData} loading={true} />);
    
    // Should show loading spinner even with data
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument();
  });

  it('prioritizes error state over loading state', () => {
    render(<CreditDebitPieChart data={mockData} loading={true} error="Test error" />);
    
    // Should show error, not loading
    expect(screen.getByText('Failed to load chart')).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
  });

  it('prioritizes error state over data', () => {
    render(<CreditDebitPieChart data={mockData} error="Test error" />);
    
    // Should show error, not chart
    expect(screen.getByText('Failed to load chart')).toBeInTheDocument();
    expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument();
  });
});