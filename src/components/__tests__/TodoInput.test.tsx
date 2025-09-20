import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TodoInput from '../TodoInput';

describe('TodoInput', () => {
  const mockOnChange = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    value: '',
    onChange: mockOnChange,
    onSubmit: mockOnSubmit,
  };

  it('renders input field and add button', () => {
    render(<TodoInput {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('What needs to be done?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add todo' })).toBeInTheDocument();
  });

  it('displays the current value in the input field', () => {
    render(<TodoInput {...defaultProps} value="Test todo" />);
    
    const input = screen.getByPlaceholderText('What needs to be done?');
    expect(input).toHaveValue('Test todo');
  });

  it('calls onChange when input value changes', () => {
    render(<TodoInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('What needs to be done?');
    fireEvent.change(input, { target: { value: 'New todo' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('New todo');
  });

  it('calls onSubmit when form is submitted with valid text', () => {
    render(<TodoInput {...defaultProps} value="Valid todo" />);
    
    const form = screen.getByRole('button', { name: 'Add todo' }).closest('form');
    fireEvent.submit(form!);
    
    expect(mockOnSubmit).toHaveBeenCalledWith('Valid todo');
  });

  it('calls onSubmit when add button is clicked with valid text', () => {
    render(<TodoInput {...defaultProps} value="Valid todo" />);
    
    const addButton = screen.getByRole('button', { name: 'Add todo' });
    fireEvent.click(addButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith('Valid todo');
  });

  it('calls onSubmit when Enter key is pressed with valid text', () => {
    render(<TodoInput {...defaultProps} value="Valid todo" />);
    
    const input = screen.getByPlaceholderText('What needs to be done?');
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(mockOnSubmit).toHaveBeenCalledWith('Valid todo');
  });

  it('prevents submission when input is empty', () => {
    render(<TodoInput {...defaultProps} value="" />);
    
    const addButton = screen.getByRole('button', { name: 'Add todo' });
    fireEvent.click(addButton);
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Todo text cannot be empty')).toBeInTheDocument();
  });

  it('prevents submission when input contains only whitespace', () => {
    render(<TodoInput {...defaultProps} value="   " />);
    
    const addButton = screen.getByRole('button', { name: 'Add todo' });
    fireEvent.click(addButton);
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Todo text cannot be empty')).toBeInTheDocument();
  });

  it('trims whitespace from input before submission', () => {
    render(<TodoInput {...defaultProps} value="  Valid todo  " />);
    
    const addButton = screen.getByRole('button', { name: 'Add todo' });
    fireEvent.click(addButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith('Valid todo');
  });

  it('shows error message when trying to submit empty input', () => {
    render(<TodoInput {...defaultProps} value="" />);
    
    const addButton = screen.getByRole('button', { name: 'Add todo' });
    fireEvent.click(addButton);
    
    const errorMessage = screen.getByText('Todo text cannot be empty');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveAttribute('role', 'alert');
  });

  it('clears error message when user starts typing valid text', () => {
    render(<TodoInput {...defaultProps} value="" />);
    
    // Trigger error first
    const addButton = screen.getByRole('button', { name: 'Add todo' });
    fireEvent.click(addButton);
    expect(screen.getByText('Todo text cannot be empty')).toBeInTheDocument();
    
    // Start typing valid text
    const input = screen.getByPlaceholderText('What needs to be done?');
    fireEvent.change(input, { target: { value: 'Valid text' } });
    
    expect(screen.queryByText('Todo text cannot be empty')).not.toBeInTheDocument();
  });

  it('does not clear error when typing only whitespace', () => {
    render(<TodoInput {...defaultProps} value="" />);
    
    // Trigger error first
    const addButton = screen.getByRole('button', { name: 'Add todo' });
    fireEvent.click(addButton);
    expect(screen.getByText('Todo text cannot be empty')).toBeInTheDocument();
    
    // Type only whitespace
    const input = screen.getByPlaceholderText('What needs to be done?');
    fireEvent.change(input, { target: { value: '   ' } });
    
    expect(screen.getByText('Todo text cannot be empty')).toBeInTheDocument();
  });

  it('applies error styling to input when there is an error', () => {
    render(<TodoInput {...defaultProps} value="" />);
    
    const input = screen.getByPlaceholderText('What needs to be done?');
    const addButton = screen.getByRole('button', { name: 'Add todo' });
    
    // Initially no error styling
    expect(input).not.toHaveClass('border-red-500');
    
    // Trigger error
    fireEvent.click(addButton);
    
    // Should have error styling
    expect(input).toHaveClass('border-red-500');
  });

  it('has proper accessibility attributes', () => {
    render(<TodoInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('What needs to be done?');
    const addButton = screen.getByRole('button', { name: 'Add todo' });
    
    expect(input).toHaveAttribute('aria-label', 'New todo text');
    expect(addButton).toHaveAttribute('aria-label', 'Add todo');
  });

  it('associates error message with input for accessibility', () => {
    render(<TodoInput {...defaultProps} value="" />);
    
    const addButton = screen.getByRole('button', { name: 'Add todo' });
    fireEvent.click(addButton);
    
    const input = screen.getByPlaceholderText('What needs to be done?');
    const errorMessage = screen.getByText('Todo text cannot be empty');
    
    expect(input).toHaveAttribute('aria-describedby', 'todo-input-error');
    expect(errorMessage).toHaveAttribute('id', 'todo-input-error');
  });
});