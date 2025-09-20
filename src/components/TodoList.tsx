import React from 'react';
import { TodoListProps } from '../types/todo';
import TodoItem from './TodoItem';

export default function TodoList({ todos, onToggle, onDelete }: TodoListProps) {
  // Handle empty state when no todos exist
  if (todos.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16">
        <div className="max-w-sm mx-auto">
          {/* Empty state illustration */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No todos yet!
          </h3>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 leading-relaxed">
            Start organizing your tasks by adding your first todo above. 
            Stay productive and achieve your goals!
          </p>
        </div>
      </div>
    );
  }

  // Separate completed and incomplete todos
  const incompleteTodos = todos.filter(todo => !todo.completed);
  const completedTodos = todos.filter(todo => todo.completed);

  return (
    <div className="space-y-6">
      {/* Active Todos Section */}
      {incompleteTodos.length > 0 && (
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            Active Tasks ({incompleteTodos.length})
          </h3>
          <div className="space-y-3">
            {incompleteTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={() => onToggle(todo.id)}
                onDelete={() => onDelete(todo.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Todos Section */}
      {completedTodos.length > 0 && (
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-600 dark:text-gray-400 mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            Completed ({completedTodos.length})
          </h3>
          <div className="space-y-3">
            {completedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={() => onToggle(todo.id)}
                onDelete={() => onDelete(todo.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}