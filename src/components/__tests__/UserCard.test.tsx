import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import UserCard from '../UserCard';
import type { Person, Transaction } from '../../types/money';

describe('UserCard', () => {
  const mockUser: Person = {
    id: '1',
    user_id: 'user1',
    name: 'John Doe',
    phone_number: '+1234567890',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  const mockUserWithoutPhone: Person = {
    id: '2',
    user_id: 'user1',
    name: 'Jane Smith',
    phone_number: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  const mockTransaction: Transaction = {
    id: 'trans1',
    user_id: 'user1',
    person_id: '1',
    amount: 50.00,
    transaction_type: 'credit',
    description: 'Test transaction',
    transaction_date: '2024-01-15T10:30:00Z',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  };

  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Set a consistent date for testing
    vi.setSystemTime(new Date('2024-01-20T12:00:00Z'));
  });

  describe('Basic Rendering', () => {
    it('renders user information correctly', () => {
      render(
        <UserCard 
          user={mockUser} 
          balance={100.50} 
          onClick={mockOnClick} 
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
      expect(screen.getByText('JD')).toBeInTheDocument(); // Initials
    });

    it('renders user without phone number', () => {
      render(
        <UserCard 
          user={mockUserWithoutPhone} 
          balance={50.00} 
          onClick={mockOnClick} 
        />
      );

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText(/\+/)).not.toBeInTheDocument(); // No phone number
      expect(screen.getByText('JS')).toBeInTheDocument(); // Initials
    });

    it('applies custom className', () => {
      const { container } = render(
        <UserCard 
          user={mockUser} 
          balance={100.50} 
          onClick={mockOnClick} 
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Balance Display and Color Coding', () => {
    it('displays positive balance with green styling', () => {
      render(
        <UserCard 
          user={mockUser} 
          balance={100.50} 
          onClick={mockOnClick} 
        />
      );

      // Check the main balance display (desktop)
      const balanceElements = screen.getAllByText('$100.50');
      expect(balanceElements[0]).toHaveClass('text-green-600');
      
      const owesYouElements = screen.getAllByText('owes you');
      expect(owesYouElements).toHaveLength(2); // Desktop and mobile
      
      // Check for green border and avatar
      const card = screen.getByRole('button');
      expect(card).toHaveClass('border-l-green-500');
      
      const avatar = screen.getByText('JD');
      expect(avatar).toHaveClass('bg-green-500');
    });

    it('displays negative balance with red styling', () => {
      render(
        <UserCard 
          user={mockUser} 
          balance={-75.25} 
          onClick={mockOnClick} 
        />
      );

      // Check the main balance display (desktop)
      const balanceElements = screen.getAllByText('$75.25');
      expect(balanceElements[0]).toHaveClass('text-red-600');
      
      const youOweElements = screen.getAllByText('you owe');
      expect(youOweElements).toHaveLength(2); // Desktop and mobile
      
      // Check for red border and avatar
      const card = screen.getByRole('button');
      expect(card).toHaveClass('border-l-red-500');
      
      const avatar = screen.getByText('JD');
      expect(avatar).toHaveClass('bg-red-500');
    });

    it('displays zero balance with gray styling', () => {
      render(
        <UserCard 
          user={mockUser} 
          balance={0} 
          onClick={mockOnClick} 
        />
      );

      // Check the main balance display (desktop)
      const balanceElements = screen.getAllByText('$0.00');
      expect(balanceElements[0]).toHaveClass('text-gray-500');
      
      const settledElements = screen.getAllByText('settled');
      expect(settledElements).toHaveLength(2); // Desktop and mobile
      
      // Check for gray border and avatar
      const card = screen.getByRole('button');
      expect(card).toHaveClass('border-l-gray-300');
      
      const avatar = screen.getByText('JD');
      expect(avatar).toHaveClass('bg-gray-400');
    });

    it('formats large balances correctly', () => {
      render(
        <UserCard 
          user={mockUser} 
          balance={1234567.89} 
          onClick={mockOnClick} 
        />
      );

      // Should have the formatted amount in both desktop and mobile layouts
      const balanceElements = screen.getAllByText('$1,234,567.89');
      expect(balanceElements).toHaveLength(2);
    });

    it('formats small balances correctly', () => {
      render(
        <UserCard 
          user={mockUser} 
          balance={0.01} 
          onClick={mockOnClick} 
        />
      );

      // Should have the formatted amount in both desktop and mobile layouts
      const balanceElements = screen.getAllByText('$0.01');
      expect(balanceElements).toHaveLength(2);
    });
  });

  describe('User Initials Generation', () => {
    it('generates initials for single name', () => {
      const singleNameUser: Person = {
        ...mockUser,
        name: 'Madonna'
      };

      render(
        <UserCard 
          user={singleNameUser} 
          balance={100} 
          onClick={mockOnClick} 
        />
      );

      expect(screen.getByText('M')).toBeInTheDocument();
    });

    it('generates initials for two names', () => {
      render(
        <UserCard 
          user={mockUser} 
          balance={100} 
          onClick={mockOnClick} 
        />
      );

      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('generates initials for multiple names (takes first two)', () => {
      const multiNameUser: Person = {
        ...mockUser,
        name: 'John Michael Smith Doe'
      };

      render(
        <UserCard 
          user={multiNameUser} 
          balance={100} 
          onClick={mockOnClick} 
        />
      );

      expect(screen.getByText('JM')).toBeInTheDocument();
    });

    it('handles lowercase names correctly', () => {
      const lowercaseUser: Person = {
        ...mockUser,
        name: 'john doe'
      };

      render(
        <UserCard 
          user={lowercaseUser} 
          balance={100} 
          onClick={mockOnClick} 
        />
      );

      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });

  describe('Last Transaction Display', () => {
    it('displays last transaction date when provided', () => {
      render(
        <UserCard 
          user={mockUser} 
          balance={100} 
          lastTransaction={mockTransaction}
          onClick={mockOnClick} 
        />
      );

      expect(screen.getByText(/Last transaction:/)).toBeInTheDocument();
    });

    it('does not display last transaction when not provided', () => {
      render(
        <UserCard 
          user={mockUser} 
          balance={100} 
          onClick={mockOnClick} 
        />
      );

      expect(screen.queryByText(/Last transaction:/)).not.toBeInTheDocument();
    });

    it('formats recent dates correctly', () => {
      const todayTransaction = {
        ...mockTransaction,
        transaction_date: '2024-01-20T10:00:00Z' // Same day as system time
      };

      render(
        <UserCard 
          user={mockUser} 
          balance={100} 
          lastTransaction={todayTransaction}
          onClick={mockOnClick} 
        />
      );

      expect(screen.getByText(/Today/)).toBeInTheDocument();
    });

    it('formats yesterday dates correctly', () => {
      const yesterdayTransaction = {
        ...mockTransaction,
        transaction_date: '2024-01-19T10:00:00Z' // Yesterday
      };

      render(
        <UserCard 
          user={mockUser} 
          balance={100} 
          lastTransaction={yesterdayTransaction}
          onClick={mockOnClick} 
        />
      );

      expect(screen.getByText(/Yesterday/)).toBeInTheDocument();
    });

    it('formats days ago correctly', () => {
      const daysAgoTransaction = {
        ...mockTransaction,
        transaction_date: '2024-01-15T10:00:00Z' // 5 days ago
      };

      render(
        <UserCard 
          user={mockUser} 
          balance={100} 
          lastTransaction={daysAgoTransaction}
          onClick={mockOnClick} 
        />
      );

      expect(screen.getByText(/5 days ago/)).toBeInTheDocument();
    });

    it('formats weeks ago correctly', () => {
      const weeksAgoTransaction = {
        ...mockTransaction,
        transaction_date: '2024-01-06T10:00:00Z' // 2 weeks ago
      };

      render(
        <UserCard 
          user={mockUser} 
          balance={100} 
          lastTransaction={weeksAgoTransaction}
          onClick={mockOnClick} 
        />
      );

      expect(screen.getByText(/2 weeks ago/)).toBeInTheDocument();
    });

    it('formats months ago correctly', () => {
      const monthsAgoTransaction = {
        ...mockTransaction,
        transaction_date: '2023-11-20T10:00:00Z' // 2 months ago
      };

      render(
        <UserCard 
          user={mockUser} 
          balance={100} 
          lastTransaction={monthsAgoTransaction}
          onClick={mockOnClick} 
        />
      );

      expect(screen.getByText(/2 months ago/)).toBeInTheDocument();
    });

    it('formats old dates with full date', () => {
      const oldTransaction = {
        ...mockTransaction,
        transaction_date: '2022-01-20T10:00:00Z' // 2 years ago
      };

      render(
        <UserCard 
          user={mockUser} 
          balance={100} 
          lastTransaction={oldTransaction}
          onClick={mockOnClick} 
        />
      );

      expect(screen.getByText(/Jan 20, 2022/)).toBeInTheDocument();
    });
  });

  describe('Click Interactions', () => {
    it('calls onClick when card is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <UserCard 
          user={mockUser} 
          balance={100} 
          onClick={mockOnClick} 
        />
      );

      const card = screen.getByRole('button');
      await user.click(card);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick when Enter key is pressed', () => {
      render(
        <UserCard 
          user={mockUser} 
          balance={100} 
          onClick={mockOnClick} 
        />
      );

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick when Space key is pressed', () => {
      render(
        <UserCard 
          user={mockUser} 
          balance={100} 
          onClick={mockOnClick} 
        />
      );

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: ' ' });

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick for other keys', () => {
      render(
        <UserCard 
          user={mockUser} 
          balance={100} 
          onClick={mockOnClick} 
        />
      );

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Tab' });

      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA label with balance information', () => {
      render(
        <UserCard 
          user={mockUser} 
          balance={100.50} 
          onClick={mockOnClick} 
        />
      );

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute(
        'aria-label', 
        'View details for John Doe. Balance: $100.50 owes you'
      );
    });

    it('has proper ARIA label for negative balance', () => {
      render(
        <UserCard 
          user={mockUser} 
          balance={-50.25} 
          onClick={mockOnClick} 
        />
      );

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute(
        'aria-label', 
        'View details for John Doe. Balance: $50.25 you owe'
      );
    });

    it('has proper ARIA label for zero balance', () => {
      render(
        <UserCard 
          user={mockUser} 
          balance={0} 
          onClick={mockOnClick} 
        />
      );

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute(
        'aria-label', 
        'View details for John Doe. Balance: $0.00 settled'
      );
    });

    it('is focusable with tabIndex', () => {
      render(
        <UserCard 
          user={mockUser} 
          balance={100} 
          onClick={mockOnClick} 
        />
      );

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Responsive Design', () => {
    it('renders mobile-specific layout elements', () => {
      render(
        <UserCard 
          user={mockUser} 
          balance={100.50} 
          onClick={mockOnClick} 
        />
      );

      // Check for mobile-specific classes
      const mobileSection = document.querySelector('.sm\\:hidden');
      expect(mobileSection).toBeInTheDocument();
    });

    it('handles long names with truncation', () => {
      const longNameUser: Person = {
        ...mockUser,
        name: 'This is a very long name that should be truncated in the UI'
      };

      render(
        <UserCard 
          user={longNameUser} 
          balance={100} 
          onClick={mockOnClick} 
        />
      );

      const nameElement = screen.getByText(longNameUser.name);
      expect(nameElement).toHaveClass('truncate');
    });

    it('handles long phone numbers with truncation', () => {
      const longPhoneUser: Person = {
        ...mockUser,
        phone_number: '+1234567890123456789012345'
      };

      render(
        <UserCard 
          user={longPhoneUser} 
          balance={100} 
          onClick={mockOnClick} 
        />
      );

      const phoneElement = screen.getByText(longPhoneUser.phone_number!);
      expect(phoneElement).toHaveClass('truncate');
    });
  });

  describe('Visual Indicators', () => {
    it('shows up arrow icon for positive balance', () => {
      render(
        <UserCard 
          user={mockUser} 
          balance={100} 
          onClick={mockOnClick} 
        />
      );

      const upArrow = document.querySelector('svg.text-green-500');
      expect(upArrow).toBeInTheDocument();
    });

    it('shows down arrow icon for negative balance', () => {
      render(
        <UserCard 
          user={mockUser} 
          balance={-100} 
          onClick={mockOnClick} 
        />
      );

      const downArrow = document.querySelector('svg.text-red-500');
      expect(downArrow).toBeInTheDocument();
    });

    it('shows circle icon for zero balance', () => {
      render(
        <UserCard 
          user={mockUser} 
          balance={0} 
          onClick={mockOnClick} 
        />
      );

      const circle = document.querySelector('svg.text-gray-400');
      expect(circle).toBeInTheDocument();
    });
  });

  describe('Hover and Focus States', () => {
    it('has hover transition classes', () => {
      render(
        <UserCard 
          user={mockUser} 
          balance={100} 
          onClick={mockOnClick} 
        />
      );

      const card = screen.getByRole('button');
      expect(card).toHaveClass('transition-all', 'duration-200');
      expect(card).toHaveClass('hover:shadow-md', 'hover:border-gray-300', 'hover:-translate-y-0.5');
    });

    it('has focus ring classes', () => {
      render(
        <UserCard 
          user={mockUser} 
          balance={100} 
          onClick={mockOnClick} 
        />
      );

      const card = screen.getByRole('button');
      expect(card).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500', 'focus:ring-offset-2');
    });
  });
});