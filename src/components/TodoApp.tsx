"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Todo, TodoPriority, TodoSortOption } from '../types/todo';
import { loadTodos, saveTodos } from '../services/localStorage';
import { sortTodos } from '../utils/todoUtils';
import TodoInput from './TodoInput';
import TodoStats from './TodoStats';
import TodoList from './TodoList';

/**
 * Main TodoApp container component that manages application state
 * and coordinates between child components
 */
export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [sortBy, setSortBy] = useState<TodoSortOption>('createdAt');

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
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Split Layout Container */}
        <div className="flex flex-col lg:flex-row min-h-[600px]">
          
          {/* Left Half - App Header and Progress Overview */}
          <div className="w-full lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-600 flex flex-col justify-center items-center p-6 sm:p-8 lg:p-12">
            <div className="text-center space-y-6 max-w-md">
              {/* App Header */}
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                  Todo App
                </h1>
                <p className="text-blue-100 text-sm sm:text-base lg:text-lg leading-relaxed">
                  Organize your tasks with style and efficiency. Stay focused and get things done.
                </p>
              </div>
              
              {/* Progress Overview */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <TodoStats todos={todos} />
              </div>
            </div>
          </div>

          {/* Right Half - Todo Input and List */}
          <div className="w-full lg:w-1/2 flex flex-col">
            {/* Todo Input Section */}
            <div className="bg-gray-50 dark:bg-gray-700 p-6 sm:p-8 border-b border-gray-200 dark:border-gray-600">
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
                sortBy={sortBy}
                onSortChange={setSortBy}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}