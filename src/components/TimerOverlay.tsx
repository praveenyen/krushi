import React from 'react';

interface TimerOverlayProps {
  todoText: string;
  onClose: () => void;
}

export default function TimerOverlay({ todoText, onClose }: TimerOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 mx-auto mb-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Timer Complete Message */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Timer Complete!
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Great job focusing on:
        </p>
        
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-8 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          &ldquo;{todoText}&rdquo;
        </p>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg
            transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
        >
          Continue Working
        </button>
      </div>
    </div>
  );
}