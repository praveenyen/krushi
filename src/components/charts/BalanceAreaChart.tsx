'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { SpendingPattern } from '../../types/money';

interface BalanceData {
  date: string;
  balance: number;
}

interface BalanceAreaChartProps {
  data: SpendingPattern[] | BalanceData[];
  loading?: boolean;
  error?: string | null;
}

const COLORS = {
  positive: '#10B981', // Green for positive balance
  negative: '#EF4444', // Red for negative balance
  neutral: '#6B7280',  // Gray for neutral/zero
};

export function BalanceAreaChart({ data, loading, error }: BalanceAreaChartProps) {
  // Transform data for Recharts
  const chartData = React.useMemo(() => {
    // Check if data is SpendingPattern or BalanceData format
    if (data.length === 0) return [];
    
    const firstItem = data[0];
    const isSpendingPattern = 'month' in firstItem && 'net_amount' in firstItem;
    
    if (isSpendingPattern) {
      return (data as SpendingPattern[]).map(item => ({
        month: formatMonth(item.month),
        balance: item.net_amount,
        credits: item.credit_total,
        debits: item.debit_total,
        // Separate positive and negative values for different coloring
        positiveBalance: item.net_amount > 0 ? item.net_amount : 0,
        negativeBalance: item.net_amount < 0 ? item.net_amount : 0,
      }));
    } else {
      return (data as BalanceData[]).map(item => ({
        month: formatDate(item.date),
        balance: item.balance,
        credits: 0, // Not available in BalanceData format
        debits: 0,  // Not available in BalanceData format
        // Separate positive and negative values for different coloring
        positiveBalance: item.balance > 0 ? item.balance : 0,
        negativeBalance: item.balance < 0 ? item.balance : 0,
      }));
    }
  }, [data]);

  // Format month for display
  function formatMonth(monthString: string): string {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { 
      year: '2-digit', 
      month: 'short' 
    });
  }

  // Format date for display
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric'
    });
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            {data.credits > 0 && (
              <p className="text-sm text-green-600">
                Credits: <span className="font-medium">${data.credits.toLocaleString()}</span>
              </p>
            )}
            {data.debits > 0 && (
              <p className="text-sm text-red-600">
                Debits: <span className="font-medium">${data.debits.toLocaleString()}</span>
              </p>
            )}
            <div className={data.credits > 0 || data.debits > 0 ? "border-t pt-1" : ""}>
              <p className={`text-sm font-medium ${
                data.balance > 0 ? 'text-green-600' : 
                data.balance < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                Balance: ${data.balance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom gradient definitions
  const gradients = (
    <defs>
      <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor={COLORS.positive} stopOpacity={0.8}/>
        <stop offset="95%" stopColor={COLORS.positive} stopOpacity={0.1}/>
      </linearGradient>
      <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor={COLORS.negative} stopOpacity={0.1}/>
        <stop offset="95%" stopColor={COLORS.negative} stopOpacity={0.8}/>
      </linearGradient>
    </defs>
  );

  // Loading state
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
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

  // No data state
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">No balance data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          {gradients}
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
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
          
          {/* Reference line at zero */}
          <ReferenceLine y={0} stroke={COLORS.neutral} strokeDasharray="2 2" />
          
          {/* Area for positive balances */}
          <Area
            type="monotone"
            dataKey="positiveBalance"
            stroke={COLORS.positive}
            strokeWidth={2}
            fill="url(#positiveGradient)"
            animationDuration={800}
          />
          
          {/* Area for negative balances */}
          <Area
            type="monotone"
            dataKey="negativeBalance"
            stroke={COLORS.negative}
            strokeWidth={2}
            fill="url(#negativeGradient)"
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex justify-center mt-2 space-x-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded mr-2" style={{ backgroundColor: COLORS.positive }}></div>
          <span className="text-gray-600">Positive Balance</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded mr-2" style={{ backgroundColor: COLORS.negative }}></div>
          <span className="text-gray-600">Negative Balance</span>
        </div>
      </div>
    </div>
  );
}