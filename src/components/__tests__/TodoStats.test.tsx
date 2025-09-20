import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TodoStats } from '../TodoStats';
import { Todo } from '../../types/todo';

describe('TodoStats', () => {
    const createMockTodo = (id: string, text: string, completed: boolean): Todo => ({
        id,
        text,
        completed,
        createdAt: new Date(),
    });

    it('displays correct counts for empty todo list', () => {
        render(<TodoStats todos={[]} />);

        // Check that all three counts show 0
        const zeroElements = screen.getAllByText('0');
        expect(zeroElements).toHaveLength(3);

        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('Remaining')).toBeInTheDocument();
    });

    it('displays correct counts for todos with no completed items', () => {
        const todos = [
            createMockTodo('1', 'Task 1', false),
            createMockTodo('2', 'Task 2', false),
            createMockTodo('3', 'Task 3', false),
        ];

        render(<TodoStats todos={todos} />);

        // Check total count
        const totalElements = screen.getAllByText('3');
        expect(totalElements).toHaveLength(2); // Total and Remaining should both be 3

        // Check completed count
        expect(screen.getByText('0')).toBeInTheDocument();

        // Verify labels are present
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('Remaining')).toBeInTheDocument();
    });

    it('displays correct counts for todos with all completed items', () => {
        const todos = [
            createMockTodo('1', 'Task 1', true),
            createMockTodo('2', 'Task 2', true),
        ];

        render(<TodoStats todos={todos} />);

        // Check that both total and completed show 2
        const twoElements = screen.getAllByText('2');
        expect(twoElements).toHaveLength(2); // Total and Completed should both be 2

        // Check remaining count
        expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('displays correct counts for mixed completed and incomplete todos', () => {
        const todos = [
            createMockTodo('1', 'Task 1', true),
            createMockTodo('2', 'Task 2', false),
            createMockTodo('3', 'Task 3', true),
            createMockTodo('4', 'Task 4', false),
            createMockTodo('5', 'Task 5', false),
        ];

        render(<TodoStats todos={todos} />);

        // Total: 5, Completed: 2, Remaining: 3
        expect(screen.getByText('5')).toBeInTheDocument(); // Total
        expect(screen.getByText('2')).toBeInTheDocument(); // Completed
        expect(screen.getByText('3')).toBeInTheDocument(); // Remaining
    });

    it('calculates counts correctly when todos prop changes', () => {
        const initialTodos = [
            createMockTodo('1', 'Task 1', false),
        ];

        const { rerender } = render(<TodoStats todos={initialTodos} />);

        // Initial state: 1 total, 0 completed, 1 remaining
        const oneElements = screen.getAllByText('1');
        expect(oneElements).toHaveLength(2); // Total and Remaining should both be 1
        expect(screen.getByText('0')).toBeInTheDocument();

        // Update with more todos
        const updatedTodos = [
            createMockTodo('1', 'Task 1', true),
            createMockTodo('2', 'Task 2', false),
            createMockTodo('3', 'Task 3', true),
        ];

        rerender(<TodoStats todos={updatedTodos} />);

        // Updated state: 3 total, 2 completed, 1 remaining
        expect(screen.getByText('3')).toBeInTheDocument(); // Total
        expect(screen.getByText('2')).toBeInTheDocument(); // Completed
        expect(screen.getByText('1')).toBeInTheDocument(); // Remaining
    });

    it('renders with proper structure and styling classes', () => {
        const todos = [createMockTodo('1', 'Task 1', false)];

        const { container } = render(<TodoStats todos={todos} />);

        // Check for main container with gradient background
        expect(container.querySelector('.bg-gradient-to-r')).toBeInTheDocument();

        // Check for grid layout
        expect(container.querySelector('.grid-cols-1')).toBeInTheDocument();

        // Check for individual stat cards
        const statCards = container.querySelectorAll('.bg-white.rounded-xl');
        expect(statCards).toHaveLength(3);
    });

    it('displays the correct title', () => {
        render(<TodoStats todos={[]} />);

        expect(screen.getByText('Progress Overview')).toBeInTheDocument();
    });

    it('handles single todo correctly', () => {
        const todos = [createMockTodo('1', 'Single task', false)];

        render(<TodoStats todos={todos} />);

        // Both total and remaining should be 1
        const oneElements = screen.getAllByText('1');
        expect(oneElements).toHaveLength(2); // Total and Remaining
        expect(screen.getByText('0')).toBeInTheDocument(); // Completed
    });

    it('handles large numbers of todos correctly', () => {
        const todos = Array.from({ length: 100 }, (_, i) =>
            createMockTodo(`${i}`, `Task ${i}`, i % 3 === 0) // Every 3rd todo is completed
        );

        render(<TodoStats todos={todos} />);

        const completedCount = Math.floor(100 / 3) + (100 % 3 > 0 ? 1 : 0); // 34 completed
        const remainingCount = 100 - completedCount; // 66 remaining

        expect(screen.getByText('100')).toBeInTheDocument(); // Total
        expect(screen.getByText(completedCount.toString())).toBeInTheDocument(); // Completed
        expect(screen.getByText(remainingCount.toString())).toBeInTheDocument(); // Remaining
    });
});