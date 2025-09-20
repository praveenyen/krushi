import { Todo } from '../types/todo';

const TODOS_STORAGE_KEY = 'todos';

/**
 * Saves todos array to localStorage
 * @param todos - Array of Todo items to save
 * @returns boolean indicating success/failure
 */
export function saveTodos(todos: Todo[]): boolean {
  try {
    const todosJson = JSON.stringify(todos);
    localStorage.setItem(TODOS_STORAGE_KEY, todosJson);
    return true;
  } catch (error) {
    console.error('Failed to save todos to localStorage:', error);
    return false;
  }
}

/**
 * Loads todos array from localStorage
 * @returns Array of Todo items (empty array if no data or error)
 */
export function loadTodos(): Todo[] {
  try {
    const todosJson = localStorage.getItem(TODOS_STORAGE_KEY);
    
    if (!todosJson) {
      return [];
    }

    const parsedTodos = JSON.parse(todosJson);
    
    // Validate that the parsed data is an array
    if (!Array.isArray(parsedTodos)) {
      console.warn('Invalid todos data in localStorage, returning empty array');
      return [];
    }

    // Convert createdAt strings back to Date objects and validate todo structure
    return parsedTodos.map((todo: any) => {
      if (!isValidTodo(todo)) {
        console.warn('Invalid todo item found, skipping:', todo);
        return null;
      }
      
      return {
        ...todo,
        createdAt: new Date(todo.createdAt)
      };
    }).filter(Boolean) as Todo[];
    
  } catch (error) {
    console.error('Failed to load todos from localStorage:', error);
    return [];
  }
}

/**
 * Clears all todos from localStorage
 * @returns boolean indicating success/failure
 */
export function clearTodos(): boolean {
  try {
    localStorage.removeItem(TODOS_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear todos from localStorage:', error);
    return false;
  }
}

/**
 * Checks if localStorage is available
 * @returns boolean indicating localStorage availability
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validates if an object has the correct Todo structure
 * @param todo - Object to validate
 * @returns boolean indicating if object is a valid Todo
 */
function isValidTodo(todo: any): boolean {
  return (
    todo &&
    typeof todo === 'object' &&
    typeof todo.id === 'string' &&
    typeof todo.text === 'string' &&
    typeof todo.completed === 'boolean' &&
    (todo.createdAt instanceof Date || typeof todo.createdAt === 'string')
  );
}