'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { PartnerData } from '../../types/money';

interface TopPartnersBarChartProps {
  data: PartnerData[];
  loading?: boolean;
  error?: string | null;
}

const COLORS = {
  creditor: '#10B981', // Green for people who owe money
  debtor: '#EF4444',   // Red for people user owes money to
};

export function TopPartnersBarChart({ data, loading, error }: TopPartnersBarChartProps) {
  // Transform and limit data for chart
  const chartData = React.useMemo(() => {
    return data
      .slice(0, 8) // Show top 8 partners
      .map(item => ({
        name: truncateName(item.person_name),
        fullName: item.person_name,
        amount: item.total_amount,
        type: item.relationship_type,
        transactions: item.transaction_count,
        color: COLORS[item.relationship_type],
      }));
  }, [data]);

  // Truncate long names for display
  function truncateName(name: string, maxLength: number = 12): string {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + '...';
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.fullName}</p>
          <p className="text-sm text-gray-600">
            Amount: <span className="font-medium">${data.amount.toLocaleString()}</span>
          </p>
          <p className="text-sm text-gray-600">
            Type: <span className="font-medium capitalize">{data.type}</span>
          </p>
          <p className="text-sm text-gray-600">
            Transactions: <span className="font-medium">{data.transactions}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label for bars
  const CustomLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    const radius = 10;
    
    return (
      <g>
        <text 
          x={x + width / 2} 
          y={y - 5} 
          fill="#374151" 
          textAnchor="middle" 
          fontSize="12"
          fontWeight="500"
        >
          ${value.toLocaleString()}
        </text>
      </g>
    );
  };

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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-sm">No partner data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="amount" 
            radius={[4, 4, 0, 0]}
            animationDuration={800}
            label={<CustomLabel />}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex justify-center mt-2 space-x-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded mr-2" style={{ backgroundColor: COLORS.creditor }}></div>
          <span className="text-gray-600">They owe you</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded mr-2" style={{ backgroundColor: COLORS.debtor }}></div>
          <span className="text-gray-600">You owe them</span>
        </div>
      </div>
    </div>
  );
}