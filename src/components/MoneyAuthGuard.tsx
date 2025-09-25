"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import SignInPage from './SignInPage';

interface MoneyAuthGuardProps {
  children: React.ReactNode;
}

/**
 * Enhanced authentication guard specifically for money tracker features
 * Provides additional security checks and better error handling
 */
export default function MoneyAuthGuard({ children }: MoneyAuthGuardProps) {
  const { isAuthenticated, loading, error, user, session } = useAuth();
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Additional session validation for money features
  useEffect(() => {
    const validateSession = async () => {
      if (!isAuthenticated || !user || !session) {
        setSessionValid(false);
        return;
      }

      try {
        // Check if session is still valid
        const isValid = await authService.isSessionValid();
        if (!isValid) {
          setValidationError('Your session has expired. Please sign in again.');
          setSessionValid(false);
          return;
        }

        // Verify user can access money features by testing a simple query
        const currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          setValidationError('Unable to verify your identity. Please sign in again.');
          setSessionValid(false);
          return;
        }

        setSessionValid(true);
        setValidationError(null);
      } catch (err) {
        console.error('Session validation error:', err);
        setValidationError('Authentication verification failed. Please try signing in again.');
        setSessionValid(false);
      }
    };

    if (isAuthenticated && user && session) {
      validateSession();
    } else if (!loading) {
      setSessionValid(false);
    }
  }, [isAuthenticated, user, session, loading]);

  // Show loading spinner during authentication check
  if (loading || sessionValid === null) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
        <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10" aria-hidden="true"></div>

        <div className="relative z-10 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex flex-col items-center space-y-4">
              <svg
                className="w-8 h-8 animate-spin text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Securing Money Tracker
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Verifying your access to financial data...
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Show authentication error if validation failed
  if (validationError || error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-orange-50 dark:from-gray-900 dark:via-red-900/20 dark:to-orange-900/20 flex items-center justify-center">
        <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10" aria-hidden="true"></div>

        <div className="relative z-10 text-center max-w-md mx-auto p-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-red-200 dark:border-red-700 p-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Authentication Required
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {validationError || error || 'Please sign in to access your financial data.'}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Show sign-in page if not authenticated or session invalid
  if (!isAuthenticated || !sessionValid) {
    return <SignInPage />;
  }

  // Render protected content if authenticated and session is valid
  return <>{children}</>;
}