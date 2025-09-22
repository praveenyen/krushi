import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Todo, TodoPriority, TodoSortOption } from '../types/todo';
import { sortTodos } from '../utils/todoUtils';

interface TodoState {
  todos: Todo[];
  inputValue: string;
  sortBy: TodoSortOption;
  
  // Actions
  setTodos: (todos: Todo[]) => void;
  setInputValue: (value: string) => void;
  setSortBy: (sortBy: TodoSortOption) => void;
  addTodo: (text: string, priority: TodoPriority) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  
  // Computed
  getSortedTodos: () => Todo[];
}

export const useTodoStore = create<TodoState>()(
  persist(
    (set, get) => ({
      todos: [],
      inputValue: '',
      sortBy: 'createdAt',
      
      setTodos: (todos) => set({ todos }),
      
      setInputValue: (inputValue) => set({ inputValue }),
      
      setSortBy: (sortBy) => set({ sortBy }),
      
      addTodo: (text, priority) => {
        const newTodo: Todo = {
          id: Date.now().toString(),
          text: text.trim(),
          completed: false,
          createdAt: new Date(),
          priority,
        };
        
        set((state) => ({
          todos: [...state.todos, newTodo],
          inputValue: '', // Clear input after adding
        }));
      },
      
      toggleTodo: (id) => {
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
          ),
        }));
      },
      
      deleteTodo: (id) => {
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
        }));
      },
      
      updateTodo: (id, updates) => {
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, ...updates } : todo
          ),
        }));
      },
      
      getSortedTodos: () => {
        const { todos, sortBy } = get();
        const pendingTodos = todos.filter((todo) => !todo.completed);
        const completedTodos = todos.filter((todo) => todo.completed);
        
        const sortedPending = sortTodos(pendingTodos, sortBy);
        
        return [...sortedPending, ...completedTodos];
      },
    }),
    {
      name: 'todo-storage',
      partialize: (state) => ({ 
        todos: state.todos,
        sortBy: state.sortBy 
      }),
    }
  )
);