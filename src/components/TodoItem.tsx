import React from 'react';
import { TodoItemProps } from '../types/todo';

export default function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <div className={`group flex items-center gap-4 p-4 sm:p-5 
      bg-white dark:bg-gray-800 border-2 rounded-xl shadow-sm
      hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10
      transition-all duration-300 ease-in-out
      ${todo.completed 
        ? 'border-green-200 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10' 
        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
      }`}>
      
      {/* Custom Checkbox */}
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={onToggle}
          className="sr-only"
          aria-label={`Mark "${todo.text}" as ${todo.completed ? 'incomplete' : 'complete'}`}
        />
        <div 
          onClick={onToggle}
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg border-2 cursor-pointer
            flex items-center justify-center transition-all duration-200
            ${todo.completed
              ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-gray-700'
            }`}
        >
          {todo.completed && (
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>

      {/* Todo text with enhanced styling */}
      <div className="flex-1 min-w-0">
        <p className={`text-base sm:text-lg font-medium transition-all duration-300
          ${todo.completed
            ? 'line-through text-gray-500 dark:text-gray-400'
            : 'text-gray-900 dark:text-gray-100'
          }`}>
          {todo.text}
        </p>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          {new Date(todo.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      {/* Delete button with enhanced styling */}
      <button
        onClick={onDelete}
        className="flex-shrink-0 p-2 sm:p-3 text-gray-400 hover:text-red-600 dark:hover:text-red-400
          hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg
          focus:outline-none focus:ring-4 focus:ring-red-500/20
          transition-all duration-200 ease-in-out
          opacity-0 group-hover:opacity-100 sm:opacity-100"
        aria-label={`Delete "${todo.text}"`}
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}