"use client";

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import SignInPage from './SignInPage';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10" aria-hidden="true"></div>
        
        {/* Loading Spinner */}
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
                  Loading Krushi
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Checking your authentication status...
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Show sign-in page if not authenticated
  if (!isAuthenticated) {
    return <SignInPage />;
  }

  // Render protected content if authenticated
  return <>{children}</>;
}