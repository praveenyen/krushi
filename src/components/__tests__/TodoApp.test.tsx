import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TodoApp from '../TodoApp';
import * as localStorageService from '../../services/localStorage';

// Mock the localStorage service
vi.mock('../../services/localStorage', () => ({
  loadTodos: vi.fn(),
  saveTodos: vi.fn(),
}));

const mockLoadTodos = vi.mocked(localStorageService.loadTodos);
const mockSaveTodos = vi.mocked(localStorageService.saveTodos);

describe('TodoApp', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    mockLoadTodos.mockReturnValue([]);
    mockSaveTodos.mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the main todo app interface', () => {
      render(<TodoApp />);
      
      expect(screen.getByText('Todo App')).toBeInTheDocument();
      expect(screen.getByText('Organize your tasks with style and efficiency')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('What needs to be done?')).toBeInTheDocument();
      expect(screen.getByText('Add')).toBeInTheDocument();
      expect(screen.getByText('Progress Overview')).toBeInTheDocument();
    });

    it('displays empty state when no todos exist', () => {
      render(<TodoApp />);
      
      expect(screen.getByText('No todos yet!')).toBeInTheDocument();
      expect(screen.getByText(/Start organizing your tasks by adding your first todo above/)).toBeInTheDocument();
    });
  });

  describe('Loading Todos from Storage', () => {
    it('loads existing todos on component mount', () => {
      const mockTodos = [
        {
          id: '1',
          text: 'Test todo',
          completed: false,
          createdAt: new Date('2023-01-01')
        }
      ];
      
      mockLoadTodos.mockReturnValue(mockTodos);
      
      render(<TodoApp />);
      
      expect(mockLoadTodos).toHaveBeenCalledOnce();
      expect(screen.getByText('Test todo')).toBeInTheDocument();
    });

    it('handles empty localStorage gracefully', () => {
      mockLoadTodos.mockReturnValue([]);
      
      render(<TodoApp />);
      
      expect(mockLoadTodos).toHaveBeenCalledOnce();
      expect(screen.getByText('No todos yet!')).toBeInTheDocument();
    });
  });

  describe('Adding Todos', () => {
    it('adds a new todo when form is submitted', async () => {
      render(<TodoApp />);
      
      const input = screen.getByPlaceholderText('What needs to be done?');
      const addButton = screen.getByText('Add');
      
      fireEvent.change(input, { target: { value: 'New todo item' } });
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('New todo item')).toBeInTheDocument();
      });
      
      expect(mockSaveTodos).toHaveBeenCalledWith([
        expect.objectContaining({
          text: 'New todo item',
          completed: false,
          id: expect.any(String),
          createdAt: expect.any(Date)
        })
      ]);
    });

    it('adds a new todo when Enter key is pressed', async () => {
      render(<TodoApp />);
      
      const input = screen.getByPlaceholderText('What needs to be done?');
      
      fireEvent.change(input, { target: { value: 'Todo via Enter' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText('Todo via Enter')).toBeInTheDocument();
      });
      
      expect(mockSaveTodos).toHaveBeenCalled();
    });

    it('clears input field after adding todo', async () => {
      render(<TodoApp />);
      
      const input = screen.getByPlaceholderText('What needs to be done?') as HTMLInputElement;
      const addButton = screen.getByText('Add');
      
      fireEvent.change(input, { target: { value: 'Test todo' } });
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('trims whitespace from todo text', async () => {
      render(<TodoApp />);
      
      const input = screen.getByPlaceholderText('What needs to be done?');
      const addButton = screen.getByText('Add');
      
      fireEvent.change(input, { target: { value: '  Trimmed todo  ' } });
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('Trimmed todo')).toBeInTheDocument();
      });
      
      expect(mockSaveTodos).toHaveBeenCalledWith([
        expect.objectContaining({
          text: 'Trimmed todo'
        })
      ]);
    });
  });

  describe('Toggling Todos', () => {
    it('toggles todo completion status', async () => {
      const mockTodos = [
        {
          id: '1',
          text: 'Test todo',
          completed: false,
          createdAt: new Date('2023-01-01')
        }
      ];
      
      mockLoadTodos.mockReturnValue(mockTodos);
      
      render(<TodoApp />);
      
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      
      await waitFor(() => {
        expect(mockSaveTodos).toHaveBeenCalledWith([
          expect.objectContaining({
            id: '1',
            text: 'Test todo',
            completed: true
          })
        ]);
      });
    });

    it('toggles completed todo back to incomplete', async () => {
      const mockTodos = [
        {
          id: '1',
          text: 'Completed todo',
          completed: true,
          createdAt: new Date('2023-01-01')
        }
      ];
      
      mockLoadTodos.mockReturnValue(mockTodos);
      
      render(<TodoApp />);
      
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      
      await waitFor(() => {
        expect(mockSaveTodos).toHaveBeenCalledWith([
          expect.objectContaining({
            id: '1',
            text: 'Completed todo',
            completed: false
          })
        ]);
      });
    });
  });

  describe('Deleting Todos', () => {
    it('deletes a todo when delete button is clicked', async () => {
      const mockTodos = [
        {
          id: '1',
          text: 'Todo to delete',
          completed: false,
          createdAt: new Date('2023-01-01')
        },
        {
          id: '2',
          text: 'Todo to keep',
          completed: false,
          createdAt: new Date('2023-01-02')
        }
      ];
      
      mockLoadTodos.mockReturnValue(mockTodos);
      
      render(<TodoApp />);
      
      const deleteButtons = screen.getAllByLabelText(/delete ".*"/i);
      fireEvent.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(screen.queryByText('Todo to delete')).not.toBeInTheDocument();
        expect(screen.getByText('Todo to keep')).toBeInTheDocument();
      });
      
      expect(mockSaveTodos).toHaveBeenCalledWith([
        expect.objectContaining({
          id: '2',
          text: 'Todo to keep'
        })
      ]);
    });

    it('shows empty state after deleting all todos', async () => {
      const mockTodos = [
        {
          id: '1',
          text: 'Only todo',
          completed: false,
          createdAt: new Date('2023-01-01')
        }
      ];
      
      mockLoadTodos.mockReturnValue(mockTodos);
      
      render(<TodoApp />);
      
      const deleteButton = screen.getByLabelText(/delete ".*"/i);
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('No todos yet!')).toBeInTheDocument();
      });
    });
  });

  describe('State Management and Persistence', () => {
    it('updates statistics when todos change', async () => {
      render(<TodoApp />);
      
      // Add first todo
      const input = screen.getByPlaceholderText('What needs to be done?');
      const addButton = screen.getByText('Add');
      
      fireEvent.change(input, { target: { value: 'First todo' } });
      fireEvent.click(addButton);
      
      await waitFor(() => {
        // Check that total count shows 1
        const totalStats = screen.getByText('Total Tasks').parentElement;
        expect(totalStats?.querySelector('.text-2xl')).toHaveTextContent('1');
      });
      
      // Add second todo
      fireEvent.change(input, { target: { value: 'Second todo' } });
      fireEvent.click(addButton);
      
      await waitFor(() => {
        // Check that total count shows 2
        const totalStats = screen.getByText('Total Tasks').parentElement;
        expect(totalStats?.querySelector('.text-2xl')).toHaveTextContent('2');
      });
    });

    it('persists todos to localStorage on every change', async () => {
      render(<TodoApp />);
      
      const input = screen.getByPlaceholderText('What needs to be done?');
      const addButton = screen.getByText('Add');
      
      // Add todo
      fireEvent.change(input, { target: { value: 'Persistent todo' } });
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(mockSaveTodos).toHaveBeenCalledTimes(1);
      });
      
      // Toggle todo
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      
      await waitFor(() => {
        expect(mockSaveTodos).toHaveBeenCalledTimes(2);
      });
      
      // Delete todo
      const deleteButton = screen.getByLabelText(/delete ".*"/i);
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(mockSaveTodos).toHaveBeenCalledTimes(3);
      });
    });

    it('handles localStorage save failures gracefully', async () => {
      mockSaveTodos.mockReturnValue(false);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      render(<TodoApp />);
      
      const input = screen.getByPlaceholderText('What needs to be done?');
      const addButton = screen.getByText('Add');
      
      fireEvent.change(input, { target: { value: 'Test todo' } });
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to save todos to localStorage');
      });
      
      // Todo should still be added to state even if save fails
      expect(screen.getByText('Test todo')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Input Value Management', () => {
    it('updates input value when typing', () => {
      render(<TodoApp />);
      
      const input = screen.getByPlaceholderText('What needs to be done?') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: 'Typing test' } });
      
      expect(input.value).toBe('Typing test');
    });

    it('maintains input value until form submission', () => {
      render(<TodoApp />);
      
      const input = screen.getByPlaceholderText('What needs to be done?') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: 'Persistent input' } });
      
      // Input should maintain value
      expect(input.value).toBe('Persistent input');
      
      // Value should clear only after submission
      const addButton = screen.getByText('Add');
      fireEvent.click(addButton);
      
      expect(input.value).toBe('');
    });
  });
});