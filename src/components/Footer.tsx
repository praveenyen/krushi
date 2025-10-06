'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-16 border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Krushi
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Harness the power of your daily effort with minimalist task management 
              and financial tracking.
            </p>
          </div>

          {/* Features Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              Features
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Todo Management</li>
              <li>• Financial Tracking</li>
              <li>• Progress Analytics</li>
              <li>• Dark/Light Themes</li>
            </ul>
          </div>

          {/* Quick Links Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              Quick Links
            </h4>
            <div className="space-y-2">
              <Link 
                href="/loan" 
                className="block text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Loan Tracker
              </Link>
              <Link 
                href="/money" 
                className="block text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              >
                Money Management
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            {/* Copyright */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span>© {currentYear} Krushi.</span>
              <span>Built with</span>
              <span className="text-red-500">❤️</span>
              <span>by an individual contributor</span>
            </div>

            {/* Tech Stack */}
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500">
              <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
                Next.js
              </span>
              <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
                TypeScript
              </span>
              <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
                Supabase
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}