import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TodoList from '../TodoList';
import { Todo } from '../../types/todo';

// Mock TodoItem component to isolate TodoList testing
vi.mock('../TodoItem', () => ({
  default: ({ todo, onToggle, onDelete }: any) => (
    <div data-testid={`todo-item-${todo.id}`}>
      <span>{todo.text}</span>
      <button onClick={onToggle} data-testid={`toggle-${todo.id}`}>
        Toggle
      </button>
      <button onClick={onDelete} data-testid={`delete-${todo.id}`}>
        Delete
      </button>
    </div>
  ),
}));

describe('TodoList', () => {
  const mockOnToggle = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockTodo = (id: string, text: string, completed = false): Todo => ({
    id,
    text,
    completed,
    createdAt: new Date(),
  });

  describe('Empty state', () => {
    it('should display empty state message when no todos exist', () => {
      render(
        <TodoList
          todos={[]}
          onToggle={mockOnToggle}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('No todos yet!')).toBeInTheDocument();
      expect(screen.getByText(/Start organizing your tasks by adding your first todo above/)).toBeInTheDocument();
    });

    it('should not render any TodoItem components when empty', () => {
      render(
        <TodoList
          todos={[]}
          onToggle={mockOnToggle}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByTestId(/^todo-item-/)).not.toBeInTheDocument();
    });
  });

  describe('Rendering todos', () => {
    it('should render all todos when provided', () => {
      const todos = [
        createMockTodo('1', 'First todo'),
        createMockTodo('2', 'Second todo'),
        createMockTodo('3', 'Third todo'),
      ];

      render(
        <TodoList
          todos={todos}
          onToggle={mockOnToggle}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByTestId('todo-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('todo-item-2')).toBeInTheDocument();
      expect(screen.getByTestId('todo-item-3')).toBeInTheDocument();
      expect(screen.getByText('First todo')).toBeInTheDocument();
      expect(screen.getByText('Second todo')).toBeInTheDocument();
      expect(screen.getByText('Third todo')).toBeInTheDocument();
    });

    it('should render single todo correctly', () => {
      const todos = [createMockTodo('1', 'Single todo')];

      render(
        <TodoList
          todos={todos}
          onToggle={mockOnToggle}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByTestId('todo-item-1')).toBeInTheDocument();
      expect(screen.getByText('Single todo')).toBeInTheDocument();
      expect(screen.queryByText('No todos yet!')).not.toBeInTheDocument();
    });
  });

  describe('Event propagation', () => {
    it('should call onToggle with correct id when TodoItem toggle is clicked', () => {
      const todos = [
        createMockTodo('1', 'First todo'),
        createMockTodo('2', 'Second todo'),
      ];

      render(
        <TodoList
          todos={todos}
          onToggle={mockOnToggle}
          onDelete={mockOnDelete}
        />
      );

      const toggleButton1 = screen.getByTestId('toggle-1');
      const toggleButton2 = screen.getByTestId('toggle-2');

      toggleButton1.click();
      expect(mockOnToggle).toHaveBeenCalledWith('1');
      expect(mockOnToggle).toHaveBeenCalledTimes(1);

      toggleButton2.click();
      expect(mockOnToggle).toHaveBeenCalledWith('2');
      expect(mockOnToggle).toHaveBeenCalledTimes(2);
    });

    it('should call onDelete with correct id when TodoItem delete is clicked', () => {
      const todos = [
        createMockTodo('1', 'First todo'),
        createMockTodo('2', 'Second todo'),
      ];

      render(
        <TodoList
          todos={todos}
          onToggle={mockOnToggle}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton1 = screen.getByTestId('delete-1');
      const deleteButton2 = screen.getByTestId('delete-2');

      deleteButton1.click();
      expect(mockOnDelete).toHaveBeenCalledWith('1');
      expect(mockOnDelete).toHaveBeenCalledTimes(1);

      deleteButton2.click();
      expect(mockOnDelete).toHaveBeenCalledWith('2');
      expect(mockOnDelete).toHaveBeenCalledTimes(2);
    });

    it('should pass correct props to each TodoItem', () => {
      const todos = [
        createMockTodo('1', 'First todo', false),
        createMockTodo('2', 'Second todo', true),
      ];

      render(
        <TodoList
          todos={todos}
          onToggle={mockOnToggle}
          onDelete={mockOnDelete}
        />
      );

      // Verify that each TodoItem receives the correct todo object
      expect(screen.getByText('First todo')).toBeInTheDocument();
      expect(screen.getByText('Second todo')).toBeInTheDocument();
      
      // Verify that toggle and delete buttons are present for each item
      expect(screen.getByTestId('toggle-1')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-2')).toBeInTheDocument();
      expect(screen.getByTestId('delete-1')).toBeInTheDocument();
      expect(screen.getByTestId('delete-2')).toBeInTheDocument();
    });

    it('should not call handlers when no interaction occurs', () => {
      const todos = [createMockTodo('1', 'Test todo')];

      render(
        <TodoList
          todos={todos}
          onToggle={mockOnToggle}
          onDelete={mockOnDelete}
        />
      );

      expect(mockOnToggle).not.toHaveBeenCalled();
      expect(mockOnDelete).not.toHaveBeenCalled();
    });
  });

  describe('Key prop handling', () => {
    it('should use todo.id as key for each TodoItem', () => {
      const todos = [
        createMockTodo('unique-1', 'First todo'),
        createMockTodo('unique-2', 'Second todo'),
      ];

      const { rerender } = render(
        <TodoList
          todos={todos}
          onToggle={mockOnToggle}
          onDelete={mockOnDelete}
        />
      );

      // Verify initial render
      expect(screen.getByTestId('todo-item-unique-1')).toBeInTheDocument();
      expect(screen.getByTestId('todo-item-unique-2')).toBeInTheDocument();

      // Reorder todos to test key stability
      const reorderedTodos = [todos[1], todos[0]];
      rerender(
        <TodoList
          todos={reorderedTodos}
          onToggle={mockOnToggle}
          onDelete={mockOnDelete}
        />
      );

      // Items should still be present with same test ids
      expect(screen.getByTestId('todo-item-unique-1')).toBeInTheDocument();
      expect(screen.getByTestId('todo-item-unique-2')).toBeInTheDocument();
    });
  });
});