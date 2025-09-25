import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import UserManagement from '../UserManagement';
import { useMoneyStore } from '../../stores/moneyStore';
import type { Person, Transaction } from '../../types/money';

// Mock the store
vi.mock('../../stores/moneyStore');

const mockUseMoneyStore = vi.mocked(useMoneyStore);

// Mock data
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
    phone_number: null,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  },
  {
    id: '3',
    user_id: 'user1',
    name: 'Bob Johnson',
    phone_number: '+9876543210',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z'
  }
];

const mockTransactions: Transaction[] = [
  {
    id: 't1',
    user_id: 'user1',
    person_id: '1',
    amount: 100,
    transaction_type: 'credit',
    description: 'Test transaction',
    transaction_date: '2024-01-01T12:00:00Z',
    created_at: '2024-01-01T12:00:00Z',
    updated_at: '2024-01-01T12:00:00Z'
  }
];

const mockBalances = [
  {
    person_id: '1',
    person_name: 'John Doe',
    total_credit: 100,
    total_debit: 0,
    net_balance: 100,
    last_transaction_date: '2024-01-01T12:00:00Z',
    transaction_count: 1
  }
];

// Default mock store state
const defaultMockStore = {
  persons: mockPersons,
  transactions: mockTransactions,
  balances: mockBalances,
  loading: {
    transactions: false,
    persons: false,
    balances: false,
    creating: false,
    updating: false,
    deleting: false
  },
  errors: {
    transactions: null,
    persons: null,
    balances: null,
    general: null
  },
  fetchPersons: vi.fn(),
  createPerson: vi.fn(),
  updatePerson: vi.fn(),
  deletePerson: vi.fn(),
  fetchTransactions: vi.fn(),
  clearError: vi.fn(),
  getBalanceForPerson: vi.fn((id: string) => mockBalances.find(b => b.person_id === id))
};

describe('UserManagement', () => {
  beforeEach(() => {
    mockUseMoneyStore.mockReturnValue(defaultMockStore as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the component with title and add button', () => {
      render(<UserManagement />);
      
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add Person' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search by name or phone number...')).toBeInTheDocument();
    });

    it('calls fetchPersons on mount', () => {
      render(<UserManagement />);
      
      expect(defaultMockStore.fetchPersons).toHaveBeenCalledOnce();
    });

    it('displays persons list correctly', () => {
      render(<UserManagement />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('shows loading state when persons are loading', () => {
      mockUseMoneyStore.mockReturnValue({
        ...defaultMockStore,
        loading: { ...defaultMockStore.loading, persons: true }
      } as any);

      render(<UserManagement />);
      
      expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    });

    it('shows empty state when no persons exist', () => {
      mockUseMoneyStore.mockReturnValue({
        ...defaultMockStore,
        persons: []
      } as any);

      render(<UserManagement />);
      
      expect(screen.getByText('No persons added yet.')).toBeInTheDocument();
    });

    it('displays error messages', () => {
      const errorMessage = 'Failed to load persons';
      mockUseMoneyStore.mockReturnValue({
        ...defaultMockStore,
        errors: { ...defaultMockStore.errors, persons: errorMessage }
      } as any);

      render(<UserManagement />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('filters persons by name', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);
      
      const searchInput = screen.getByPlaceholderText('Search by name or phone number...');
      await user.type(searchInput, 'Doe');
      
      // Wait for the filtering to take effect
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
    });

    it('filters persons by phone number', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);
      
      const searchInput = screen.getByPlaceholderText('Search by name or phone number...');
      await user.type(searchInput, '1234567890');
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
    });

    it('shows no results message when search yields no matches', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);
      
      const searchInput = screen.getByPlaceholderText('Search by name or phone number...');
      await user.type(searchInput, 'nonexistent');
      
      expect(screen.getByText('No persons found matching your search.')).toBeInTheDocument();
    });

    it('is case insensitive', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);
      
      const searchInput = screen.getByPlaceholderText('Search by name or phone number...');
      await user.type(searchInput, 'john');
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Add Person Modal', () => {
    it('opens add person modal when add button is clicked', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);
      
      const addButton = screen.getByRole('button', { name: 'Add Person' });
      await user.click(addButton);
      
      expect(screen.getByText('Add New Person')).toBeInTheDocument();
      expect(screen.getByLabelText('Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
    });

    it('validates required name field', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);
      
      const addButton = screen.getByRole('button', { name: 'Add Person' });
      await user.click(addButton);
      
      const createButton = screen.getByRole('button', { name: 'Create' });
      await user.click(createButton);
      
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });

    it('validates name length', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);
      
      const addButton = screen.getByRole('button', { name: 'Add Person' });
      await user.click(addButton);
      
      const nameInput = screen.getByLabelText('Name *');
      await user.type(nameInput, 'A');
      
      const createButton = screen.getByRole('button', { name: 'Create' });
      await user.click(createButton);
      
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    });

    it('validates phone number format', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);
      
      const addButton = screen.getByRole('button', { name: 'Add Person' });
      await user.click(addButton);
      
      const nameInput = screen.getByLabelText('Name *');
      const phoneInput = screen.getByLabelText('Phone Number');
      
      await user.type(nameInput, 'Test User');
      await user.type(phoneInput, 'invalid-phone');
      
      const createButton = screen.getByRole('button', { name: 'Create' });
      await user.click(createButton);
      
      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
    });

    it('accepts valid phone number formats', async () => {
      const user = userEvent.setup();
      const mockCreatePerson = vi.fn().mockResolvedValue({});
      
      mockUseMoneyStore.mockReturnValue({
        ...defaultMockStore,
        createPerson: mockCreatePerson
      } as any);

      render(<UserManagement />);
      
      const addButton = screen.getByRole('button', { name: 'Add Person' });
      await user.click(addButton);
      
      const nameInput = screen.getByLabelText('Name *');
      const phoneInput = screen.getByLabelText('Phone Number');
      
      await user.type(nameInput, 'Test User');
      await user.type(phoneInput, '+1234567890');
      
      const createButton = screen.getByRole('button', { name: 'Create' });
      await user.click(createButton);
      
      await waitFor(() => {
        expect(mockCreatePerson).toHaveBeenCalledWith({
          name: 'Test User',
          phone_number: '+1234567890'
        });
      });
    });

    it('creates person with valid data', async () => {
      const user = userEvent.setup();
      const mockCreatePerson = vi.fn().mockResolvedValue({});
      
      mockUseMoneyStore.mockReturnValue({
        ...defaultMockStore,
        createPerson: mockCreatePerson
      } as any);

      render(<UserManagement />);
      
      const addButton = screen.getByRole('button', { name: 'Add Person' });
      await user.click(addButton);
      
      const nameInput = screen.getByLabelText('Name *');
      await user.type(nameInput, 'New Person');
      
      const createButton = screen.getByRole('button', { name: 'Create' });
      await user.click(createButton);
      
      await waitFor(() => {
        expect(mockCreatePerson).toHaveBeenCalledWith({
          name: 'New Person',
          phone_number: null
        });
      });
    });

    it('closes modal on cancel', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);
      
      const addButton = screen.getByRole('button', { name: 'Add Person' });
      await user.click(addButton);
      
      expect(screen.getByText('Add New Person')).toBeInTheDocument();
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);
      
      expect(screen.queryByText('Add New Person')).not.toBeInTheDocument();
    });

    it('closes modal on X button click', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);
      
      const addButton = screen.getByRole('button', { name: 'Add Person' });
      await user.click(addButton);
      
      expect(screen.getByText('Add New Person')).toBeInTheDocument();
      
      const closeButton = screen.getByRole('button', { name: '' }); // X button has no text
      await user.click(closeButton);
      
      expect(screen.queryByText('Add New Person')).not.toBeInTheDocument();
    });
  });

  describe('Edit Person Modal', () => {
    it('opens edit modal with person data pre-filled', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);
      
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]); // Edit John Doe
      
      expect(screen.getByText('Edit Person')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
    });

    it('updates person with modified data', async () => {
      const user = userEvent.setup();
      const mockUpdatePerson = vi.fn().mockResolvedValue({});
      
      mockUseMoneyStore.mockReturnValue({
        ...defaultMockStore,
        updatePerson: mockUpdatePerson
      } as any);

      render(<UserManagement />);
      
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      
      const nameInput = screen.getByDisplayValue('John Doe');
      await user.clear(nameInput);
      await user.type(nameInput, 'John Updated');
      
      const updateButton = screen.getByRole('button', { name: 'Update' });
      await user.click(updateButton);
      
      await waitFor(() => {
        expect(mockUpdatePerson).toHaveBeenCalledWith('1', {
          name: 'John Updated',
          phone_number: '+1234567890'
        });
      });
    });
  });

  describe('Person Detail View', () => {
    it('opens detail view when person name is clicked', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);
      
      const personName = screen.getByText('John Doe');
      await user.click(personName);
      
      expect(screen.getByText('Transaction History')).toBeInTheDocument();
      expect(defaultMockStore.fetchTransactions).toHaveBeenCalledWith({ person_id: '1' });
    });

    it('displays person information in detail view', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);
      
      const personName = screen.getByText('John Doe');
      await user.click(personName);
      
      // Should show person name and phone in the detail view
      const detailViews = screen.getAllByText('John Doe');
      expect(detailViews.length).toBeGreaterThan(1); // One in list, one in detail view
      
      const phoneNumbers = screen.getAllByText('+1234567890');
      expect(phoneNumbers.length).toBeGreaterThan(1); // One in list, one in detail view
    });

    it('displays balance information', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);
      
      const personName = screen.getByText('John Doe');
      await user.click(personName);
      
      expect(screen.getByText('Balance:')).toBeInTheDocument();
      expect(screen.getByText('$100.00')).toBeInTheDocument();
    });

    it('shows edit button in detail view', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);
      
      const personName = screen.getByText('John Doe');
      await user.click(personName);
      
      const editButtons = screen.getAllByText('Edit');
      expect(editButtons.length).toBeGreaterThan(1); // One in list, one in detail view
    });

    it('closes detail view when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);
      
      const personName = screen.getByText('John Doe');
      await user.click(personName);
      
      expect(screen.getByText('Transaction History')).toBeInTheDocument();
      
      // Find close button in detail view (there might be multiple X buttons)
      const detailView = screen.getByText('Transaction History').closest('div[class*="fixed"]');
      const closeButton = within(detailView!).getByRole('button', { name: '' });
      await user.click(closeButton);
      
      expect(screen.queryByText('Transaction History')).not.toBeInTheDocument();
    });
  });

  describe('Delete Person', () => {
    it('shows delete confirmation modal', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);
      
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);
      
      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete this person/)).toBeInTheDocument();
    });

    it('cancels delete when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);
      
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);
      
      expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
    });

    it('deletes person when confirmed', async () => {
      const user = userEvent.setup();
      const mockDeletePerson = vi.fn().mockResolvedValue(undefined);
      
      mockUseMoneyStore.mockReturnValue({
        ...defaultMockStore,
        deletePerson: mockDeletePerson
      } as any);

      render(<UserManagement />);
      
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);
      
      // Find the confirm delete button in the modal (different from list delete buttons)
      const confirmButtons = screen.getAllByRole('button', { name: 'Delete' });
      const confirmButton = confirmButtons[confirmButtons.length - 1]; // Last one should be the modal button
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(mockDeletePerson).toHaveBeenCalledWith('1');
      });
    });

    it('shows loading state during delete', () => {
      mockUseMoneyStore.mockReturnValue({
        ...defaultMockStore,
        loading: { ...defaultMockStore.loading, deleting: true }
      } as any);

      render(<UserManagement />);
      
      // Check if delete buttons are disabled during loading
      const deleteButtons = screen.getAllByText('Delete');
      deleteButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Loading States', () => {
    it('disables add button when creating', () => {
      mockUseMoneyStore.mockReturnValue({
        ...defaultMockStore,
        loading: { ...defaultMockStore.loading, creating: true }
      } as any);

      render(<UserManagement />);
      
      const addButton = screen.getByRole('button', { name: 'Add Person' });
      expect(addButton).toBeDisabled();
    });

    it('disables edit buttons when updating', () => {
      mockUseMoneyStore.mockReturnValue({
        ...defaultMockStore,
        loading: { ...defaultMockStore.loading, updating: true }
      } as any);

      render(<UserManagement />);
      
      const editButtons = screen.getAllByText('Edit');
      editButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('disables delete buttons when deleting', () => {
      mockUseMoneyStore.mockReturnValue({
        ...defaultMockStore,
        loading: { ...defaultMockStore.loading, deleting: true }
      } as any);

      render(<UserManagement />);
      
      const deleteButtons = screen.getAllByText('Delete');
      deleteButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles create person errors', async () => {
      const user = userEvent.setup();
      const mockCreatePerson = vi.fn().mockRejectedValue(new Error('Create failed'));
      
      mockUseMoneyStore.mockReturnValue({
        ...defaultMockStore,
        createPerson: mockCreatePerson
      } as any);

      render(<UserManagement />);
      
      const addButton = screen.getByRole('button', { name: 'Add Person' });
      await user.click(addButton);
      
      const nameInput = screen.getByLabelText('Name *');
      await user.type(nameInput, 'Test User');
      
      const createButton = screen.getByRole('button', { name: 'Create' });
      await user.click(createButton);
      
      await waitFor(() => {
        expect(mockCreatePerson).toHaveBeenCalled();
      });
      
      // Modal should remain open on error
      expect(screen.getByText('Add New Person')).toBeInTheDocument();
    });

    it('handles update person errors', async () => {
      const user = userEvent.setup();
      const mockUpdatePerson = vi.fn().mockRejectedValue(new Error('Update failed'));
      
      mockUseMoneyStore.mockReturnValue({
        ...defaultMockStore,
        updatePerson: mockUpdatePerson
      } as any);

      render(<UserManagement />);
      
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      
      const updateButton = screen.getByRole('button', { name: 'Update' });
      await user.click(updateButton);
      
      await waitFor(() => {
        expect(mockUpdatePerson).toHaveBeenCalled();
      });
      
      // Modal should remain open on error
      expect(screen.getByText('Edit Person')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);
      
      const addButton = screen.getByRole('button', { name: 'Add Person' });
      await user.click(addButton);
      
      expect(screen.getByLabelText('Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
    });

    it('has proper button roles and names', () => {
      render(<UserManagement />);
      
      expect(screen.getByRole('button', { name: 'Add Person' })).toBeInTheDocument();
      
      const editButtons = screen.getAllByRole('button', { name: 'Edit' });
      expect(editButtons.length).toBeGreaterThan(0);
      
      const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);
      
      const addButton = screen.getByRole('button', { name: 'Add Person' });
      
      // Tab to the add button and press Enter
      await user.tab();
      expect(addButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(screen.getByText('Add New Person')).toBeInTheDocument();
    });
  });
});