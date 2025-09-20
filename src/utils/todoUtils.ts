import { Todo, TodoSortOption, TodoPriority } from '../types/todo';

/**
 * Priority order for sorting (high to low)
 */
const PRIORITY_ORDER: Record<TodoPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Sorts todos based on the specified sort option
 * @param todos - Array of todos to sort
 * @param sortBy - Sort option
 * @returns Sorted array of todos
 */
export const sortTodos = (todos: Todo[], sortBy: TodoSortOption): Todo[] => {
  const todosCopy = [...todos];
  
  switch (sortBy) {
    case 'priority':
      return todosCopy.sort((a, b) => {
        // First sort by priority (high to low)
        const priorityDiff = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // If same priority, sort by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
    case 'alphabetical':
      return todosCopy.sort((a, b) => {
        // Sort alphabetically by text
        const textComparison = a.text.toLowerCase().localeCompare(b.text.toLowerCase());
        if (textComparison !== 0) return textComparison;
        
        // If same text, sort by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
    case 'createdAt':
    default:
      return todosCopy.sort((a, b) => {
        // Sort by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }
};

/**
 * Gets the default priority for new todos
 * @returns Default priority level
 */
export const getDefaultPriority = (): TodoPriority => 'medium';

/**
 * Gets priority color classes for styling
 * @param priority - Priority level
 * @returns Object with color classes
 */
export const getPriorityColors = (priority: TodoPriority) => {
  switch (priority) {
    case 'high':
      return {
        bg: 'bg-red-100 dark:bg-red-900/20',
        border: 'border-red-300 dark:border-red-700',
        text: 'text-red-700 dark:text-red-400',
        dot: 'bg-red-500',
      };
    case 'medium':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/20',
        border: 'border-yellow-300 dark:border-yellow-700',
        text: 'text-yellow-700 dark:text-yellow-400',
        dot: 'bg-yellow-500',
      };
    case 'low':
      return {
        bg: 'bg-green-100 dark:bg-green-900/20',
        border: 'border-green-300 dark:border-green-700',
        text: 'text-green-700 dark:text-green-400',
        dot: 'bg-green-500',
      };
  }
};

/**
 * Gets priority label for display
 * @param priority - Priority level
 * @returns Display label
 */
export const getPriorityLabel = (priority: TodoPriority): string => {
  switch (priority) {
    case 'high':
      return 'High Priority';
    case 'medium':
      return 'Medium Priority';
    case 'low':
      return 'Low Priority';
  }
};