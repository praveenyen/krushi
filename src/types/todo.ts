// Priority levels for todos
export type TodoPriority = 'low' | 'medium' | 'high';

// Sort options for todos
export type TodoSortOption = 'createdAt' | 'priority' | 'alphabetical';

// Core Todo interface
export interface Todo {
  id: string;          // Unique identifier (UUID or timestamp)
  text: string;        // Todo item text
  completed: boolean;  // Completion status
  createdAt: Date;     // Creation timestamp
  priority: TodoPriority; // Priority level
}

// Component prop types
export interface TodoItemProps {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
}

export interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  sortBy: TodoSortOption;
  onSortChange: (sortBy: TodoSortOption) => void;
}

export interface TodoInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (text: string, priority: TodoPriority) => void;
}

export interface TodoStatsProps {
  todos: Todo[];
}

// State types for TodoApp component
export interface TodoAppState {
  todos: Todo[];
  inputValue: string;
}