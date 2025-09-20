import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TodoItem from '../TodoItem';
import { Todo } from '../../types/todo';
import { beforeEach } from 'node:test';

describe('TodoItem', () => {
  const mockTodo: Todo = {
    id: '1',
    text: 'Test todo item',
    completed: false,
    createdAt: new Date('2023-01-01'),
  };

  const mockCompletedTodo: Todo = {
    id: '2',
    text: 'Completed todo item',
    completed: true,
    createdAt: new Date('2023-01-01'),
  };

  const mockOnToggle = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders todo item with text', () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Test todo item')).toBeInTheDocument();
  });

  it('renders checkbox in unchecked state for incomplete todo', () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('renders checkbox in checked state for completed todo', () => {
    render(
      <TodoItem
        todo={mockCompletedTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('applies strikethrough styling to completed todo text', () => {
    render(
      <TodoItem
        todo={mockCompletedTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    const todoText = screen.getByText('Completed todo item');
    expect(todoText).toHaveClass('line-through', 'text-gray-500');
  });

  it('does not apply strikethrough styling to incomplete todo text', () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    const todoText = screen.getByText('Test todo item');
    expect(todoText).not.toHaveClass('line-through');
    expect(todoText).not.toHaveClass('text-gray-500');
  });

  it('calls onToggle when checkbox is clicked', () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility labels for checkbox', () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    const checkbox = screen.getByLabelText('Mark "Test todo item" as complete');
    expect(checkbox).toBeInTheDocument();
  });

  it('has proper accessibility labels for completed todo checkbox', () => {
    render(
      <TodoItem
        todo={mockCompletedTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    const checkbox = screen.getByLabelText('Mark "Completed todo item" as incomplete');
    expect(checkbox).toBeInTheDocument();
  });

  it('has proper accessibility label for delete button', () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByLabelText('Delete "Test todo item"');
    expect(deleteButton).toBeInTheDocument();
  });

  it('renders delete button with correct accessibility label', () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    expect(deleteButton).toHaveAttribute('aria-label', 'Delete "Test todo item"');
  });
});