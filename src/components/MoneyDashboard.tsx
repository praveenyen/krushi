'use client';

import React, { useEffect, useState } from 'react';
import { useMoneyStore } from '../stores/moneyStore';
import UserCard from './UserCard';
import TransactionForm from './TransactionForm';
import { FinancialCharts } from './FinancialCharts';
import type { CreateTransactionData } from '../types/money';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardStats {
  totalBalance: number;
  totalTransactions: number;
  totalPersons: number;
  monthlyCredit: number;
  monthlyDebit: number;
}

export default function MoneyDashboard() {
  const {
    topCreditors,
    topDebtors,
    transactions,
    persons,
    balances,
    loading,
    errors,
    uiState,
    createTransaction,
    setShowTransactionForm,
    setShowPersonForm,
    refreshData,
  } = useMoneyStore();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0,
    totalTransactions: 0,
    totalPersons: 0,
    monthlyCredit: 0,
    monthlyDebit: 0,
  });

  // Calculate dashboard statistics
  useEffect(() => {
    const calculateStats = () => {
      const totalBalance = balances.reduce((sum, balance) => sum + balance.net_balance, 0);
      const totalTransactions = transactions.length;
      const totalPersons = persons.length;

      // Calculate monthly credit and debit (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentTransactions = transactions.filter(
        transaction => new Date(transaction.transaction_date) >= thirtyDaysAgo
      );

      const monthlyCredit = recentTransactions
        .filter(t => t.transaction_type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);

      const monthlyDebit = recentTransactions
        .filter(t => t.transaction_type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);

      setStats({
        totalBalance,
        totalTransactions,
        totalPersons,
        monthlyCredit,
        monthlyDebit,
      });
    };

    // calculateStats();
  }, [transactions, persons, balances]);

  // Handle transaction creation
  const handleCreateTransaction = async (data: CreateTransactionData) => {
    try {
      await createTransaction(data);
      setShowTransactionForm(false);
      // Refresh data to update all displays
      await refreshData();
    } catch (error) {
      console.error('Failed to create transaction:', error);
      throw error;
    }
  };

  // Handle user card click navigation
  const handleUserCardClick = (personId: string) => {
    // TODO: Navigate to user detail page when implemented
    router.push(`/money/users/${personId}`)
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount));
  };

  // Loading state
  if (loading.transactions || loading.persons || loading.balances) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>

            {/* Stats skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-32"></div>
                </div>
              ))}
            </div>

            {/* Cards skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                  <div className="space-y-4">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-20 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex gap-4 items-center">
              Money Tracker
              <Link href={'/'} className='text-sm text-blue-900 hover:text-blue-600'>Home</Link>
            </h1>
            <p className="text-gray-600">Track your financial relationships and transactions</p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
            <button
              onClick={() => setShowPersonForm(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Person
            </button>
            <button
              onClick={() => setShowTransactionForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Transaction
            </button>
          </div>
        </div>

        {/* Error Display */}
        {(errors.transactions || errors.persons || errors.balances || errors.general) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800">
                {errors.general || errors.transactions || errors.persons || errors.balances}
              </p>
            </div>
          </div>
        )}

        {/* Dashboard Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Balance */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Balance</p>
                <p className={`text-2xl font-bold ${stats.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {stats.totalBalance >= 0 ? '+' : '-'}{formatCurrency(stats.totalBalance)}
                </p>
              </div>
              <div className={`p-3 rounded-full ${stats.totalBalance >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                <svg className={`w-6 h-6 ${stats.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Transactions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Persons */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPersons}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Monthly Activity */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Activity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.monthlyCredit + stats.monthlyDebit)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  +{formatCurrency(stats.monthlyCredit)} / -{formatCurrency(stats.monthlyDebit)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Top Creditors and Debtors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top 5 People Who Owe You */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">People Who Owe You</h2>
              <div className="text-sm text-gray-500">Top 5</div>
            </div>

            {topCreditors.length > 0 ? (
              <div className="space-y-4">
                {topCreditors.slice(0, 5).map((creditor) => {
                  const person = persons.find(p => p.id === creditor.person_id);
                  const lastTransaction = transactions
                    .filter(t => t.person_id === creditor.person_id)
                    .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())[0];

                  return person ? (
                    <UserCard
                      key={creditor.person_id}
                      user={person}
                      balance={creditor.total_amount}
                      lastTransaction={lastTransaction}
                      onClick={() => handleUserCardClick(creditor.person_id)}
                    />
                  ) : null;
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-lg font-medium">No outstanding credits</p>
                <p className="text-sm">No one currently owes you money</p>
              </div>
            )}
          </div>

          {/* Top 5 People You Owe */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">People You Owe</h2>
              <div className="text-sm text-gray-500">Top 5</div>
            </div>

            {topDebtors.length > 0 ? (
              <div className="space-y-4">
                {topDebtors.slice(0, 5).map((debtor) => {
                  const person = persons.find(p => p.id === debtor.person_id);
                  const lastTransaction = transactions
                    .filter(t => t.person_id === debtor.person_id)
                    .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())[0];

                  return person ? (
                    <UserCard
                      key={debtor.person_id}
                      user={person}
                      balance={-debtor.total_amount} // Negative for debt
                      lastTransaction={lastTransaction}
                      onClick={() => handleUserCardClick(debtor.person_id)}
                    />
                  ) : null;
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <p className="text-lg font-medium">No outstanding debts</p>
                <p className="text-sm">You don't owe money to anyone</p>
              </div>
            )}
          </div>
        </div>

        {/* Financial Charts */}
        <div className="mb-8">
          <FinancialCharts />
        </div>

        {/* Transaction Form Modal */}
        {uiState.showTransactionForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md">
              <TransactionForm
                onSubmit={handleCreateTransaction}
                onCancel={() => setShowTransactionForm(false)}
              />
            </div>
          </div>
        )}

        {/* Person Form Modal - Placeholder */}
        {uiState.showPersonForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add New Person</h3>
                <button
                  onClick={() => setShowPersonForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mb-4">
                Person management will be available through the UserManagement component.
              </p>
              <button
                onClick={() => setShowPersonForm(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}