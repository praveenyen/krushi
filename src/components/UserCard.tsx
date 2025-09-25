'use client';

import React from 'react';
import type { Person, Transaction } from '../types/money';

interface UserCardProps {
  user: Person;
  balance: number;
  lastTransaction?: Transaction;
  onClick: () => void;
  className?: string;
}

export default function UserCard({
  user,
  balance,
  lastTransaction,
  onClick,
  className = ''
}: UserCardProps) {
  // Determine balance color and styling
  const isPositive = balance > 0;
  const isNegative = balance < 0;
  const isZero = balance === 0;

  const balanceColorClass = isPositive
    ? 'text-green-600'
    : isNegative
      ? 'text-red-600'
      : 'text-gray-500';

  const cardBorderClass = isPositive
    ? 'border-l-green-500'
    : isNegative
      ? 'border-l-red-500'
      : 'border-l-gray-300';

  // Format balance for display
  const formatBalance = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount));
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Generate user initials for avatar
  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // Get balance description
  const getBalanceDescription = (): string => {
    if (isPositive) {
      return 'owes you';
    } else if (isNegative) {
      return 'you owe';
    } else {
      return 'settled';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 
        ${cardBorderClass} border-l-4
        p-4 cursor-pointer transition-all duration-200 
        hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`View details for ${user.name}. Balance: ${formatBalance(balance)} ${getBalanceDescription()}`}
    >
      <div className="flex items-center justify-between">
        {/* User Info Section */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Avatar */}
          <div className={`
            flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm
            ${isPositive ? 'bg-green-500' : isNegative ? 'bg-red-500' : 'bg-gray-400'}
          `}>
            {getUserInitials(user.name)}
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {user.name}
            </h3>

            {user.phone_number && (
              <p className="text-sm text-gray-500 truncate">
                {user.phone_number}
              </p>
            )}

            {/* Last Transaction Info */}
            {lastTransaction && (
              <p className="text-xs text-gray-400 mt-1">
                Last transaction: {formatDate(lastTransaction.transaction_date)}
              </p>
            )}
          </div>
        </div>

        {/* Balance Section */}
        <div className="flex-shrink-0 text-right ml-4">
          <div className={`text-xl font-bold ${balanceColorClass}`}>
            {formatBalance(balance)}
          </div>
          <div className="text-sm text-gray-500">
            {getBalanceDescription()}
          </div>

          {/* Balance indicator icon */}
          <div className="flex justify-end mt-1">
            {isPositive && (
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
              </svg>
            )}
            {isNegative && (
              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
              </svg>
            )}
            {isZero && (
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Mobile-specific layout adjustments */}
      <div className="sm:hidden mt-3 pt-3 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {getBalanceDescription()}
          </span>
          <span className={`text-lg font-bold ${balanceColorClass}`}>
            {formatBalance(balance)}
          </span>
        </div>
      </div>
    </div>
  );
}