'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { DistributionData } from '../../types/money';

interface CreditDebitPieChartProps {
  data: DistributionData | null;
  loading?: boolean;
  error?: string | null;
}

const COLORS = {
  credit: '#10B981', // Green for credits (money coming in)
  debit: '#EF4444',  // Red for debits (money going out)
};

const CHART_DATA_KEYS = {
  credit: 'Credits',
  debit: 'Debits',
};

export function CreditDebitPieChart({ data, loading, error }: CreditDebitPieChartProps) {
  // Transform data for Recharts
  const chartData = React.useMemo(() => {
    if (!data) return [];

    return [
      {
        name: CHART_DATA_KEYS.credit,
        value: data.credit_total,
        percentage: data.credit_percentage,
        color: COLORS.credit,
      },
      {
        name: CHART_DATA_KEYS.debit,
        value: data.debit_total,
        percentage: data.debit_percentage,
        color: COLORS.debit,
      },
    ].filter(item => item.value > 0); // Only show segments with values
  }, [data]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Amount: <span className="font-medium">₹{data.value.toLocaleString('en-IN')}</span>
          </p>
          <p className="text-sm text-gray-600">
            Percentage: <span className="font-medium">{data.percentage.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label function for pie slices
  const renderLabel = ({ percentage }: any) => {
    return percentage > 5 ? `${percentage.toFixed(1)}%` : '';
  };

  // Error state takes priority
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">Failed to load chart</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // No data state
  if (!data || chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">No transaction data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius="80%"
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry: any) => (
              <span style={{ color: entry.color }}>
                {value}: ₹{entry.payload.value.toLocaleString('en-IN')}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}