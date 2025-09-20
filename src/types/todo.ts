// Core Todo interface
export interface Todo {
  id: string;          // Unique identifier (UUID or timestamp)
  text: string;        // Todo item text
  completed: boolean;  // Completion status
  createdAt: Date;     // Creation timestamp
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
}

export interface TodoInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (text: string) => void;
}

export interface TodoStatsProps {
  todos: Todo[];
}

// State types for TodoApp component
export interface TodoAppState {
  todos: Todo[];
  inputValue: string;
}