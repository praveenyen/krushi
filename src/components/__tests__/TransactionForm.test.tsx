import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import TransactionForm from '../TransactionForm';
import type { Person, Transaction, CreateTransactionData } from '../../types/money';

// Mock the money store
vi.mock('../../stores/moneyStore', () => ({
  useMoneyStore: vi.fn()
}));

const { useMoneyStore } = await import('../../stores/moneyStore');

const mockUseMoneyStore = vi.mocked(useMoneyStore);

describe('TransactionForm', () => {
  const mockPersons: Person[] = [
    {
      id: '1',
      user_id: 'user1',
      name: 'John Doe',
      phone_number: '+1234567890',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      user_id: 'user1',
      name: 'Jane Smith',
      phone_number: '+0987654321',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  const mockTransaction: Transaction = {
    id: 'trans1',
    user_id: 'user1',
    person_id: '1',
    amount: 100.50,
    transaction_type: 'credit',
    description: 'Test transaction',
    transaction_date: '2024-01-15T10:30:00Z',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    person: mockPersons[0]
  };

  const mockStoreState = {
    persons: mockPersons,
    loading: {
      transactions: false,
      persons: false,
      balances: false,
      creating: false,
      updating: false,
      deleting: false
    },
    createPerson: vi.fn(),
    fetchPersons: vi.fn()
  };

  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMoneyStore.mockReturnValue(mockStoreState as any);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Form Rendering', () => {
    it('renders new transaction form correctly', () => {
      render(
        <TransactionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(screen.getByText('New Transaction')).toBeInTheDocument();
      expect(screen.getByLabelText(/person/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByText('I Owe (Debit)')).toBeInTheDocument();
      expect(screen.getByText('They Owe (Credit)')).toBeInTheDocument();
      expect(screen.getByLabelText(/date & time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create transaction/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('renders edit transaction form with pre-filled data', () => {
      render(
        <TransactionForm 
          transaction={mockTransaction}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );

      expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('100.5')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test transaction')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update transaction/i })).toBeInTheDocument();
    });

    it('sets default date to current date for new transactions', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      vi.setSystemTime(now);

      render(
        <TransactionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const dateInput = screen.getByLabelText(/date & time/i) as HTMLInputElement;
      expect(dateInput.value).toBe('2024-01-15T12:00');
    });
  });

  describe('Person Selection', () => {
    it('shows person dropdown when input is focused', async () => {
      const user = userEvent.setup();
      
      render(
        <TransactionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const personInput = screen.getByLabelText(/person/i);
      await user.click(personInput);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
    });

    it('filters persons based on search input', async () => {
      const user = userEvent.setup();
      
      render(
        <TransactionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const personInput = screen.getByLabelText(/person/i);
      await user.type(personInput, 'John');

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('selects person from dropdown', async () => {
      const user = userEvent.setup();
      
      render(
        <TransactionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const personInput = screen.getByLabelText(/person/i);
      await user.click(personInput);
      await user.click(screen.getByText('John Doe'));

      expect(personInput).toHaveValue('John Doe');
    });

    it('shows add new person option when no matches found', async () => {
      const user = userEvent.setup();
      
      render(
        <TransactionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const personInput = screen.getByLabelText(/person/i);
      await user.type(personInput, 'New Person');

      expect(screen.getByText('No persons found')).toBeInTheDocument();
      expect(screen.getByText('+ Add new person "New Person"')).toBeInTheDocument();
    });

    it('opens new person modal when add new person is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TransactionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const personInput = screen.getByLabelText(/person/i);
      await user.type(personInput, 'New Person');
      await user.click(screen.getByText('+ Add new person "New Person"'));

      expect(screen.getByText('Add New Person')).toBeInTheDocument();
      // Use more specific selector for the modal input
      expect(screen.getByLabelText(/name \*/i)).toHaveValue('New Person');
    });

    it('creates new person and selects them', async () => {
      const user = userEvent.setup();
      const mockCreatePerson = vi.fn().mockResolvedValue({
        id: '3',
        name: 'New Person',
        phone_number: '+1111111111'
      });
      
      mockUseMoneyStore.mockReturnValue({
        ...mockStoreState,
        createPerson: mockCreatePerson
      } as any);

      render(
        <TransactionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const personInput = screen.getByLabelText(/person/i);
      await user.type(personInput, 'New Person');
      await user.click(screen.getByText('+ Add new person "New Person"'));

      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.type(phoneInput, '+1111111111');
      
      await user.click(screen.getByRole('button', { name: /add person/i }));

      await waitFor(() => {
        expect(mockCreatePerson).toHaveBeenCalledWith({
          name: 'New Person',
          phone_number: '+1111111111'
        });
      });
    });
  });

  describe('Form Validation', () => {
    it('validates required fields on submit', async () => {
      const user = userEvent.setup();
      
      render(
        <TransactionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      await user.click(screen.getByRole('button', { name: /create transaction/i }));

      expect(screen.getByText('Please select a person')).toBeInTheDocument();
      expect(screen.getByText('Amount is required')).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('validates amount field with real-time feedback', async () => {
      const user = userEvent.setup();
      
      render(
        <TransactionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const amountInput = screen.getByLabelText(/amount/i);
      
      // Test empty amount first (should show "Amount is required")
      await user.click(amountInput);
      await user.tab(); // Trigger blur event

      await waitFor(() => {
        expect(screen.getByText('Amount is required')).toBeInTheDocument();
      });

      // Test negative amount
      await user.clear(amountInput);
      await user.type(amountInput, '-10');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument();
      });

      // Test amount too large
      await user.clear(amountInput);
      await user.type(amountInput, '1000000');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Amount cannot exceed 999,999.99')).toBeInTheDocument();
      });

      // Test too many decimal places
      await user.clear(amountInput);
      await user.type(amountInput, '10.123');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Amount can have at most 2 decimal places')).toBeInTheDocument();
      });
    });

    it('validates date field', async () => {
      const user = userEvent.setup();
      
      render(
        <TransactionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const dateInput = screen.getByLabelText(/date & time/i);
      
      // Test future date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const futureDateString = futureDate.toISOString().slice(0, 16);
      
      await user.clear(dateInput);
      await user.type(dateInput, futureDateString);
      await user.tab();

      expect(screen.getByText('Transaction date cannot be in the future')).toBeInTheDocument();

      // Test date too far in past
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 11);
      const oldDateString = oldDate.toISOString().slice(0, 16);
      
      await user.clear(dateInput);
      await user.type(dateInput, oldDateString);
      await user.tab();

      expect(screen.getByText('Transaction date cannot be more than 10 years ago')).toBeInTheDocument();
    });

    it('validates description length', async () => {
      const user = userEvent.setup();
      
      render(
        <TransactionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const descriptionInput = screen.getByLabelText(/description/i);
      const longText = 'a'.repeat(501);
      
      await user.type(descriptionInput, longText);

      // Should be truncated to 500 characters
      expect(descriptionInput).toHaveValue('a'.repeat(500));
      expect(screen.getByText('500/500')).toBeInTheDocument();
    });
  });

  describe('Transaction Type Toggle', () => {
    it('toggles between debit and credit', async () => {
      const user = userEvent.setup();
      
      render(
        <TransactionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const debitButton = screen.getByText('I Owe (Debit)');
      const creditButton = screen.getByText('They Owe (Credit)');

      // Default should be debit
      expect(debitButton).toHaveClass('bg-red-500');
      expect(creditButton).toHaveClass('bg-white');

      // Click credit
      await user.click(creditButton);
      
      expect(creditButton).toHaveClass('bg-green-500');
      expect(debitButton).toHaveClass('bg-white');

      // Click debit again
      await user.click(debitButton);
      
      expect(debitButton).toHaveClass('bg-red-500');
      expect(creditButton).toHaveClass('bg-white');
    });
  });

  describe('Form Submission', () => {
    it('submits valid form data', async () => {
      const user = userEvent.setup();
      
      render(
        <TransactionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Fill out form
      const personInput = screen.getByLabelText(/person/i);
      await user.click(personInput);
      await user.click(screen.getByText('John Doe'));

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '50.25');

      await user.click(screen.getByText('They Owe (Credit)'));

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'Test description');

      // Submit form
      await user.click(screen.getByRole('button', { name: /create transaction/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          person_id: '1',
          amount: 50.25,
          transaction_type: 'credit',
          description: 'Test description',
          transaction_date: expect.any(String)
        });
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      let resolveSubmit: (value: any) => void;
      const submitPromise = new Promise(resolve => {
        resolveSubmit = resolve;
      });
      
      const mockSlowSubmit = vi.fn(() => submitPromise);
      
      render(
        <TransactionForm onSubmit={mockSlowSubmit} onCancel={mockOnCancel} />
      );

      // Fill minimum required fields
      const personInput = screen.getByLabelText(/person/i);
      await user.click(personInput);
      await user.click(screen.getByText('John Doe'));

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '50');

      // Submit form
      await user.click(screen.getByRole('button', { name: /create transaction/i }));

      // Should show loading state
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();

      // Resolve the promise
      act(() => {
        resolveSubmit!(undefined);
      });
    });

    it('handles submission errors', async () => {
      const user = userEvent.setup();
      const mockFailingSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'));
      
      render(
        <TransactionForm onSubmit={mockFailingSubmit} onCancel={mockOnCancel} />
      );

      // Fill minimum required fields
      const personInput = screen.getByLabelText(/person/i);
      await user.click(personInput);
      await user.click(screen.getByText('John Doe'));

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '50');

      // Submit form
      await user.click(screen.getByRole('button', { name: /create transaction/i }));

      await waitFor(() => {
        expect(screen.getByText('Submission failed')).toBeInTheDocument();
      });
    });
  });

  describe('Form Actions', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TransactionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('calls onCancel when close button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TransactionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      await user.click(screen.getByLabelText('Close form'));

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and ARIA attributes', () => {
      render(
        <TransactionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(screen.getByLabelText(/person/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date & time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Close form')).toBeInTheDocument();
    });

    it('shows validation errors with proper ARIA attributes', async () => {
      const user = userEvent.setup();
      
      render(
        <TransactionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      await user.click(screen.getByRole('button', { name: /create transaction/i }));

      const personInput = screen.getByLabelText(/person/i);
      const amountInput = screen.getByLabelText(/amount/i);

      expect(personInput).toHaveClass('border-red-300');
      expect(amountInput).toHaveClass('border-red-300');
    });
  });

  describe('Responsive Design', () => {
    it('applies custom className', () => {
      const { container } = render(
        <TransactionForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});