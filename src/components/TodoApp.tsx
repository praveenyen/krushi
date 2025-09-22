"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Todo, TodoPriority, TodoSortOption } from '../types/todo';
import { loadTodos, saveTodos } from '../services/localStorage';
import { sortTodos } from '../utils/todoUtils';
import { useTimer } from '../contexts/TimerContext';
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
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [sortBy, setSortBy] = useState<TodoSortOption>('createdAt');
  const [showTimerOverlay, setShowTimerOverlay] = useState(false);
  const [completedTimerTodo, setCompletedTimerTodo] = useState<Todo | null>(null);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  
  const { config, setActiveTimer } = useTimer();

  // Load existing todos on component mount
  useEffect(() => {
    loadTodosFromStorage();
  }, []);

  /**
   * Loads todos from localStorage and updates state
   */
  const loadTodosFromStorage = () => {
    const savedTodos = loadTodos();
    setTodos(savedTodos);
  };

  /**
   * Saves todos to localStorage
   * @param todosToSave - Array of todos to save
   */
  const saveTodosToStorage = (todosToSave: Todo[]) => {
    const success = saveTodos(todosToSave);
    if (!success) {
      console.warn('Failed to save todos to localStorage');
    }
  };

  /**
   * Creates a new todo item and adds it to the list
   * @param text - Text content for the new todo
   * @param priority - Priority level for the new todo
   */
  const addTodo = (text: string, priority: TodoPriority) => {
    const newTodo: Todo = {
      id: Date.now().toString(), // Simple timestamp-based ID
      text: text.trim(),
      completed: false,
      createdAt: new Date(),
      priority: priority
    };

    const updatedTodos = [...todos, newTodo];
    setTodos(updatedTodos);
    saveTodosToStorage(updatedTodos);
    
    // Clear input field after successful todo creation
    setInputValue('');
  };

  /**
   * Toggles the completion status of a todo item
   * @param id - ID of the todo to toggle
   */
  const toggleTodo = (id: string) => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    
    setTodos(updatedTodos);
    saveTodosToStorage(updatedTodos);
  };

  /**
   * Removes a todo item from the list
   * @param id - ID of the todo to delete
   */
  const deleteTodo = (id: string) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    setTodos(updatedTodos);
    saveTodosToStorage(updatedTodos);
  };

  /**
   * Handles input value changes
   * @param value - New input value
   */
  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  /**
   * Starts a pomodoro timer for a specific todo
   * @param id - ID of the todo to start timer for
   */
  const startTimer = (id: string) => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? {
        ...todo,
        timerStatus: 'running' as const,
        timerStartTime: new Date(),
        timerDuration: config.defaultDuration
      } : {
        ...todo,
        timerStatus: todo.timerStatus === 'running' ? 'idle' as const : todo.timerStatus
      }
    );
    
    setTodos(updatedTodos);
    saveTodosToStorage(updatedTodos);
    setActiveTimer(id);
    
    // Set timer to complete after duration
    setTimeout(() => {
      completeTimer(id);
    }, config.defaultDuration * 60 * 1000);
  };

  /**
   * Stops the active timer
   * @param id - ID of the todo to stop timer for
   */
  const stopTimer = (id: string) => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? {
        ...todo,
        timerStatus: 'idle' as const,
        timerStartTime: undefined,
        timerDuration: undefined
      } : todo
    );
    
    setTodos(updatedTodos);
    saveTodosToStorage(updatedTodos);
    setActiveTimer(null);
  };

  /**
   * Completes the timer and shows overlay
   * @param id - ID of the todo whose timer completed
   */
  const completeTimer = (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    const updatedTodos = todos.map(t =>
      t.id === id ? {
        ...t,
        timerStatus: 'completed' as const
      } : t
    );
    
    setTodos(updatedTodos);
    saveTodosToStorage(updatedTodos);
    setActiveTimer(null);
    setCompletedTimerTodo(todo);
    setShowTimerOverlay(true);
  };

  /**
   * Closes the timer completion overlay
   */
  const closeTimerOverlay = () => {
    setShowTimerOverlay(false);
    setCompletedTimerTodo(null);
    
    // Reset timer status to idle
    if (completedTimerTodo) {
      const updatedTodos = todos.map(todo =>
        todo.id === completedTimerTodo.id ? {
          ...todo,
          timerStatus: 'idle' as const,
          timerStartTime: undefined,
          timerDuration: undefined
        } : todo
      );
      
      setTodos(updatedTodos);
      saveTodosToStorage(updatedTodos);
    }
  };

  /**
   * Computed property for sorted todos
   * Only sorts pending todos, completed todos remain at bottom
   */
  const sortedTodos = useMemo(() => {
    const pendingTodos = todos.filter(todo => !todo.completed);
    const completedTodos = todos.filter(todo => todo.completed);
    
    const sortedPending = sortTodos(pendingTodos, sortBy);
    
    return [...sortedPending, ...completedTodos];
  }, [todos, sortBy]);

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
                onChange={handleInputChange}
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
          onClose={closeTimerOverlay}
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