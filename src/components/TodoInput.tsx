"use client";

import React, { useState } from 'react';
import { TodoInputProps } from '../types/todo';

export default function TodoInput({ value, onChange, onSubmit }: TodoInputProps) {
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Input validation - prevent empty todos
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      setError('Todo text cannot be empty');
      return;
    }

    // Clear any previous error
    setError('');
    
    // Submit the todo
    onSubmit(trimmedValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Clear error when user starts typing
    if (error && newValue.trim()) {
      setError('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter key support for form submission
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="What needs to be done?"
            className={`w-full px-4 py-3 sm:py-4 text-base sm:text-lg border-2 rounded-xl 
              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
              placeholder-gray-500 dark:placeholder-gray-400
              focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500
              hover:border-gray-400 dark:hover:border-gray-500
              transition-all duration-200 ease-in-out
              ${error 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                : 'border-gray-300 dark:border-gray-600'
              }`}
            aria-label="New todo text"
            aria-describedby={error ? 'todo-input-error' : undefined}
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 sm:py-4 sm:px-8 bg-gradient-to-r from-blue-600 to-blue-700 
            hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900
            text-white font-semibold rounded-xl shadow-lg hover:shadow-xl
            focus:outline-none focus:ring-4 focus:ring-blue-500/30
            transform hover:scale-105 active:scale-95
            transition-all duration-200 ease-in-out"
          aria-label="Add todo"
        >
          <span className="hidden sm:inline">Add Todo</span>
          <span className="sm:hidden">Add</span>
        </button>
      </form>
      
      {/* Error message display */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p 
            id="todo-input-error" 
            className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2"
            role="alert"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        </div>
      )}
    </div>
  );
}