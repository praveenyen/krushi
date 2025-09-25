'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TrendData } from '../../types/money';

interface TransactionTimelineChartProps {
  data: TrendData[];
  loading?: boolean;
  error?: string | null;
}

const COLORS = {
  credit: '#10B981', // Green for credits
  debit: '#EF4444',  // Red for debits
  net: '#3B82F6',    // Blue for net balance
};

export function TransactionTimelineChart({ data, loading, error }: TransactionTimelineChartProps) {
  // Transform data for Recharts
  const chartData = React.useMemo(() => {
    return data.map(item => ({
      date: formatDate(item.date),
      credits: item.credit_amount,
      debits: item.debit_amount,
      net: item.credit_amount - item.debit_amount,
      transactions: item.transaction_count,
    }));
  }, [data]);

  // Format date for display
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    
    // Check if it's a month format (YYYY-MM)
    if (dateString.match(/^\d{4}-\d{2}$/)) {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
    }
    
    // Regular date format
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-medium">${entry.value.toLocaleString()}</span>
            </p>
          ))}
          {payload[0]?.payload?.transactions && (
            <p className="text-sm text-gray-600 mt-1 pt-1 border-t">
              Transactions: <span className="font-medium">{payload[0].payload.transactions}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom dot component for better visibility
  const CustomDot = (props: any) => {
    const { cx, cy, fill } = props;
    return <circle cx={cx} cy={cy} r={3} fill={fill} stroke="#fff" strokeWidth={2} />;
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
  if (!data || data.length === 0) {
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
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            height={36}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="credits"
            stroke={COLORS.credit}
            strokeWidth={2}
            name="Credits"
            dot={<CustomDot />}
            activeDot={{ r: 5, stroke: COLORS.credit, strokeWidth: 2, fill: '#fff' }}
            animationDuration={800}
          />
          <Line
            type="monotone"
            dataKey="debits"
            stroke={COLORS.debit}
            strokeWidth={2}
            name="Debits"
            dot={<CustomDot />}
            activeDot={{ r: 5, stroke: COLORS.debit, strokeWidth: 2, fill: '#fff' }}
            animationDuration={800}
          />
          <Line
            type="monotone"
            dataKey="net"
            stroke={COLORS.net}
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Net Balance"
            dot={<CustomDot />}
            activeDot={{ r: 5, stroke: COLORS.net, strokeWidth: 2, fill: '#fff' }}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}