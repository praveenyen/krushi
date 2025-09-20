"use client";

import React, { useState, useEffect } from 'react';
import { Todo } from '../types/todo';
import { loadTodos, saveTodos } from '../services/localStorage';
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
   */
  const addTodo = (text: string) => {
    const newTodo: Todo = {
      id: Date.now().toString(), // Simple timestamp-based ID
      text: text.trim(),
      completed: false,
      createdAt: new Date()
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

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 sm:px-8 sm:py-10">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
              Todo App
            </h1>
            <p className="text-blue-100 text-sm sm:text-base lg:text-lg">
              Organize your tasks with style and efficiency
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
          {/* Todo Input */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 sm:p-6">
            <TodoInput
              value={inputValue}
              onChange={handleInputChange}
              onSubmit={addTodo}
            />
          </div>

          {/* Todo Statistics */}
          <TodoStats todos={todos} />

          {/* Todo List */}
          <div className="min-h-[200px]">
            <TodoList
              todos={todos}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
            />
          </div>
        </div>
      </div>
    </div>
  );
}