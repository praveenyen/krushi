"use client";

import React, { useEffect, useRef } from 'react';
import { loadTodos, saveTodos } from '../services/localStorage';
import { useTodoStore } from '../stores/todoStore';
import { useTimerStore } from '../stores/timerStore';
import TodoInput from './TodoInput';
import TodoStats from './TodoStats';
import TodoList from './TodoList';
import TimerOverlay from './TimerOverlay';
import TimerSettings from './TimerSettings';

/**
 * Main TodoApp container component that manages application state
 * and coordinates between child components
 */
export default function TodoApp() {
  // Ref to track active timer timeout
  const timerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Todo store
  const {
    todos,
    inputValue,
    sortBy,
    setTodos,
    setInputValue,
    setSortBy,
    addTodo,
    toggleTodo,
    deleteTodo,
    updateTodo,
    getSortedTodos,
  } = useTodoStore();

  // Timer store
  const {
    config,
    activeTimer,
    showTimerOverlay,
    completedTimerTodo,
    showTimerSettings,
    setShowTimerSettings,
    startTimer: startTimerStore,
    stopTimer: stopTimerStore,
    completeTimer,
    closeTimerOverlay,
  } = useTimerStore();

  // Load existing todos on component mount
  useEffect(() => {
    const savedTodos = loadTodos();
    if (savedTodos.length > 0) {
      setTodos(savedTodos);
    }
  }, [setTodos]);

  // Save todos to localStorage whenever todos change
  useEffect(() => {
    if (todos.length > 0) {
      const success = saveTodos(todos);
      if (!success) {
        console.warn('Failed to save todos to localStorage');
      }
    }
  }, [todos]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerTimeoutRef.current) {
        clearTimeout(timerTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Starts a pomodoro timer for a specific todo
   * @param id - ID of the todo to start timer for
   */
  const startTimer = (id: string) => {
    // Clear any existing timer
    if (timerTimeoutRef.current) {
      clearTimeout(timerTimeoutRef.current);
    }

    // Stop any existing timer first
    if (activeTimer) {
      updateTodo(activeTimer, {
        timerStatus: 'idle',
        timerStartTime: undefined,
        timerDuration: undefined,
      });
    }

    // Get the todo text before starting timer
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    // Start new timer
    updateTodo(id, {
      timerStatus: 'running',
      timerStartTime: new Date(),
      timerDuration: config.defaultDuration,
    });

    startTimerStore(id);

    // Set timer to complete after duration
    console.log(`Starting timer for ${config.defaultDuration} minutes (${config.defaultDuration * 60 * 1000}ms)`);
    timerTimeoutRef.current = setTimeout(() => {
      console.log(`Timer completed for todo: ${todo.text}`);
      handleTimerComplete(id, todo.text);
    }, config.defaultDuration * 60 * 1000);
  };

  /**
   * Stops the active timer
   * @param id - ID of the todo to stop timer for
   */
  const stopTimer = (id: string) => {
    // Clear the timeout
    if (timerTimeoutRef.current) {
      clearTimeout(timerTimeoutRef.current);
      timerTimeoutRef.current = null;
    }

    updateTodo(id, {
      timerStatus: 'idle',
      timerStartTime: undefined,
      timerDuration: undefined,
    });

    stopTimerStore();
  };

  /**
   * Handles timer completion
   * @param id - ID of the todo whose timer completed
   * @param text - Text of the todo
   */
  const handleTimerComplete = (id: string, text: string) => {
    console.log(`handleTimerComplete called for: ${text}`);
    // Clear the timeout ref
    timerTimeoutRef.current = null;
    
    updateTodo(id, {
      timerStatus: 'completed',
    });

    console.log('Calling completeTimer...');
    completeTimer(id, text);
  };

  /**
   * Handles closing timer overlay and resetting timer status
   */
  const handleCloseTimerOverlay = () => {
    if (completedTimerTodo) {
      updateTodo(completedTimerTodo.id, {
        timerStatus: 'idle',
        timerStartTime: undefined,
        timerDuration: undefined,
      });
    }
    closeTimerOverlay();
  };

  // Get sorted todos
  const sortedTodos = getSortedTodos();

  return (
    <article className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Split Layout Container */}
        <div className="flex flex-col lg:flex-row min-h-[600px]">
          
          {/* Left Half - App Header and Progress Overview */}
          <header className="w-full lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-600 flex flex-col justify-center items-center p-6 sm:p-8 lg:p-12">
            <div className="text-center space-y-6 max-w-md">
              {/* App Header */}
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                  Krushi
                </h1>
                <p className="text-blue-100 text-sm sm:text-base lg:text-lg leading-relaxed">
                  Harness the power of your daily effort. Focus on what truly matters: consistent progress.
                </p>
              </div>
              
              {/* Progress Overview */}
              <aside className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20" aria-label="Task Statistics">
                <TodoStats todos={todos} />
              </aside>
            </div>
          </header>

          {/* Right Half - Todo Input and List */}
          <section className="w-full lg:w-1/2 flex flex-col" aria-label="Task Management">
            {/* Todo Input Section */}
            <div className="bg-gray-50 dark:bg-gray-700 p-6 sm:p-8 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Add New Task
                </h2>
                <button
                  onClick={() => setShowTimerSettings(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                    hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  title="Timer Settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
              <TodoInput
                value={inputValue}
                onChange={setInputValue}
                onSubmit={addTodo}
              />
            </div>

            {/* Todo List Section */}
            <div className="flex-1 p-6 sm:p-8 min-h-[400px] overflow-y-auto">
              <TodoList
                todos={sortedTodos}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onStartTimer={startTimer}
                onStopTimer={stopTimer}
                sortBy={sortBy}
                onSortChange={setSortBy}
              />
            </div>
          </section>
        </div>
      </div>
      
      {/* Timer Completion Overlay */}
      {showTimerOverlay && completedTimerTodo && (
        <TimerOverlay
          todoText={completedTimerTodo.text}
          onClose={handleCloseTimerOverlay}
        />
      )}

      {/* Timer Settings Modal */}
      <TimerSettings
        isOpen={showTimerSettings}
        onClose={() => setShowTimerSettings(false)}
      />
    </article>
  );
}