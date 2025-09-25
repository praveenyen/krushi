'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMoneyStore } from '../../../../stores/moneyStore';
import { TransactionForm } from '../../../../components/TransactionForm';
import TransactionList from '../../../../components/TransactionList';
import { BalanceAreaChart } from '../../../../components/charts/BalanceAreaChart';
import MoneyAuthGuard from '../../../../components/MoneyAuthGuard';
import type { Transaction } from '../../../../types/money';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const {
    transactions,
    loading,
    errors,
    fetchPersons,
    fetchTransactions,
    fetchBalances,
    getPersonById,
    getBalanceForPerson,
    createTransaction
  } = useMoneyStore();

  const [showQuickForm, setShowQuickForm] = useState(false);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [balanceHistory, setBalanceHistory] = useState<Array<{ date: string; balance: number }>>([]);

  const person = getPersonById(userId);
  const balance = getBalanceForPerson(userId);

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchPersons(),
          fetchTransactions({ person_id: userId }),
          fetchBalances()
        ]);
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };

    if (userId) {
      loadData();
    }
  }, [userId, fetchPersons, fetchTransactions, fetchBalances]);

  // Filter transactions for this user and calculate balance history
  useEffect(() => {
    const filtered = transactions.filter(t => t.person_id === userId);
    setUserTransactions(filtered);

    // Calculate balance over time
    const sortedTransactions = [...filtered].sort((a, b) => 
      new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );

    const history: Array<{ date: string; balance: number }> = [];
    let runningBalance = 0;

    sortedTransactions.forEach(transaction => {
      if (transaction.transaction_type === 'credit') {
        runningBalance += transaction.amount;
      } else {
        runningBalance -= transaction.amount;
      }

      history.push({
        date: transaction.transaction_date,
        balance: runningBalance
      });
    });

    setBalanceHistory(history);
  }, [transactions, userId]);

  // Handle invalid user ID
  if (!loading.persons && !person && userId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              User Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The user you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
            </p>
            <button
              onClick={() => router.push('/money')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading.persons || loading.transactions || loading.balances) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse" data-testid="loading-skeleton">
            {/* Header skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                </div>
              </div>
            </div>
            
            {/* Balance card skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-4"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            </div>

            {/* Chart skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleQuickTransaction = async (data: { amount: number; transaction_type: 'credit' | 'debit'; description?: string }) => {
    try {
      await createTransaction({
        ...data,
        person_id: userId
      });
      setShowQuickForm(false);
      // Refresh data
      await Promise.all([
        fetchTransactions({ person_id: userId }),
        fetchBalances()
      ]);
    } catch (error) {
      console.error('Failed to create transaction:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600 dark:text-green-400';
    if (balance < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getBalanceLabel = (balance: number) => {
    if (balance > 0) return 'owes you';
    if (balance < 0) return 'you owe';
    return 'balanced';
  };

  return (
    <MoneyAuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/money')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* User Avatar */}
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                  {person?.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {person?.name || 'Unknown User'}
                </h1>
                {person?.phone_number && (
                  <p className="text-gray-600 dark:text-gray-400">
                    {person.phone_number}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowQuickForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Transaction</span>
            </button>
          </div>
        </div>

        {/* Balance Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Current Balance
          </h2>
          
          {balance ? (
            <div className="flex items-center space-x-4">
              <div className={`text-3xl font-bold ${getBalanceColor(balance.net_balance)}`}>
                {formatCurrency(Math.abs(balance.net_balance))}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                {person?.name} {getBalanceLabel(balance.net_balance)}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400">
              No transactions yet
            </div>
          )}

          {balance && (
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Total Credit</div>
                <div className="font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(balance.total_credit)}
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Total Debit</div>
                <div className="font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(balance.total_debit)}
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Transactions</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {balance.transaction_count}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Balance Trend Chart */}
        {balanceHistory.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Balance Over Time
            </h2>
            <div className="h-64">
              <BalanceAreaChart data={balanceHistory} />
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Transaction History
          </h2>
          
          {userTransactions.length > 0 ? (
            <TransactionList userId={userId} />
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No transactions found for {person?.name}
              </p>
              <button
                onClick={() => setShowQuickForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add First Transaction
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {(errors.transactions || errors.persons || errors.general) && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-red-800 dark:text-red-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">
                {errors.transactions || errors.persons || errors.general}
              </span>
            </div>
          </div>
        )}

        {/* Quick Transaction Form Modal */}
        {showQuickForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Add Transaction for {person?.name}
                  </h3>
                  <button
                    onClick={() => setShowQuickForm(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <TransactionForm
                  onSubmit={handleQuickTransaction}
                  onCancel={() => setShowQuickForm(false)}
                  preselectedPersonId={userId}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </MoneyAuthGuard>
  );
}