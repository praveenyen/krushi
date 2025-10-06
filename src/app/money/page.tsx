'use client';

import React, { useEffect, useState } from 'react';
import MoneyAuthGuard from '../../components/MoneyAuthGuard';
import MoneyDashboard from '../../components/MoneyDashboard';
import TransactionForm from '../../components/TransactionForm';
import { useMoneyStore } from '../../stores/moneyStore';
import type { CreateTransactionData } from '../../types/money';

export default function MoneyPage() {
  const {
    fetchTransactions,
    fetchPersons,
    fetchBalances,
    fetchTopCreditors,
    fetchTopDebtors,
    createTransaction,
    loading,
    errors,
    refreshData
  } = useMoneyStore();

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchTransactions(),
          fetchPersons(),
          fetchBalances(),
          fetchTopCreditors(5),
          fetchTopDebtors(5),
        ]);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };

    // loadData();
  }, []);


  // State for floating action button transaction form
  const [showQuickTransactionForm, setShowQuickTransactionForm] = useState(false);

  // Handle quick transaction creation
  const handleQuickTransaction = async (data: CreateTransactionData) => {
    try {
      await createTransaction(data);
      setShowQuickTransactionForm(false);
      // Refresh all data to update dashboard
      await refreshData();
    } catch (error) {
      console.error('Failed to create quick transaction:', error);
      throw error;
    }
  };

  // Loading state for initial page load
  if (loading.transactions && loading.persons && loading.balances) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your financial data...</p>
        </div>
      </div>
    );
  }

  // Error state for critical failures
  if (errors.general && !loading.transactions && !loading.persons && !loading.balances) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Data</h1>
            <p className="text-gray-600 mb-6">{errors.general}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <MoneyAuthGuard>
      <div className="relative">
        {/* Main Dashboard */}
        <MoneyDashboard />

        {/* Floating Action Button for Quick Transaction Entry */}
        <button
          onClick={() => setShowQuickTransactionForm(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40 focus:outline-none focus:ring-4 focus:ring-blue-300"
          aria-label="Add quick transaction"
          title="Add Transaction"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>

        {/* Quick Transaction Form Modal */}
        {showQuickTransactionForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md">
              <TransactionForm
                onSubmit={handleQuickTransaction}
                onCancel={() => setShowQuickTransactionForm(false)}
              />
            </div>
          </div>
        )}

        {/* Mobile-specific optimizations */}
        <div className="sm:hidden">
          {/* Bottom padding to account for floating action button */}
          <div className="h-20"></div>
        </div>
      </div>
    </MoneyAuthGuard>
  );
}