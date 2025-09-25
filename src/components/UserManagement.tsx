'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useMoneyStore } from '../stores/moneyStore';
import type { Person, CreatePersonData, UpdatePersonData } from '../types/money';

interface UserManagementProps {
  className?: string;
}

interface PersonFormData {
  name: string;
  phone_number: string | null;
}

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  person?: Person | null;
  onSubmit: (data: PersonFormData) => Promise<void>;
  loading: boolean;
}

// Phone number validation regex (supports various formats)
const PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/;

const PersonModal: React.FC<PersonModalProps> = ({
  isOpen,
  onClose,
  person,
  onSubmit,
  loading
}) => {
  const [formData, setFormData] = useState<PersonFormData>({
    name: '',
    phone_number: ''
  });
  const [errors, setErrors] = useState<Partial<PersonFormData>>({});

  // Reset form when modal opens/closes or person changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: person?.name || '',
        phone_number: person?.phone_number || ''
      });
      setErrors({});
    }
  }, [isOpen, person]);

  const validateForm = (): boolean => {
    const newErrors: Partial<PersonFormData> = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Validate phone number (optional but must be valid if provided)
    if (formData.phone_number && formData.phone_number.trim()) {
      const cleanPhone = formData.phone_number.replace(/[\s\-\(\)]/g, '');
      if (!PHONE_REGEX.test(cleanPhone)) {
        newErrors.phone_number = 'Please enter a valid phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const submitData = {
        name: formData.name.trim(),
        phone_number: formData.phone_number ? formData.phone_number.trim() || null : null
      };
      
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Form submission error:', error);
    }
  };

  const handleInputChange = (field: keyof PersonFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {person ? 'Edit Person' : 'Add New Person'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter person's name"
                disabled={loading}
                autoFocus
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone_number"
                value={formData.phone_number || ''}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.phone_number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter phone number (optional)"
                disabled={loading}
              />
              {errors.phone_number && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone_number}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Saving...' : person ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

interface UserDetailViewProps {
  person: Person;
  onClose: () => void;
  onEdit: (person: Person) => void;
}

const UserDetailView: React.FC<UserDetailViewProps> = ({ person, onClose, onEdit }) => {
  const { 
    transactions, 
    balances, 
    fetchTransactions, 
    loading,
    getBalanceForPerson 
  } = useMoneyStore();

  const [localLoading, setLocalLoading] = useState(false);

  // Fetch transactions for this person when component mounts
  useEffect(() => {
    const loadTransactions = async () => {
      setLocalLoading(true);
      try {
        await fetchTransactions({ person_id: person.id });
      } catch (error) {
        console.error('Failed to fetch person transactions:', error);
      } finally {
        setLocalLoading(false);
      }
    };

    loadTransactions();
  }, [person.id, fetchTransactions]);

  const personTransactions = useMemo(() => {
    return transactions.filter(t => t.person_id === person.id);
  }, [transactions, person.id]);

  const personBalance = getBalanceForPerson(person.id);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {person.name}
              </h2>
              {person.phone_number && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {person.phone_number}
                </p>
              )}
              {personBalance && (
                <div className="mt-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Balance: </span>
                  <span className={`font-semibold ${
                    personBalance.net_balance > 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : personBalance.net_balance < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {formatCurrency(personBalance.net_balance)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(person)}
                className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
              >
                Edit
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Transaction History
          </h3>

          {localLoading || loading.transactions ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" role="status" aria-label="Loading transactions"></div>
            </div>
          ) : personTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No transactions found for this person.
            </div>
          ) : (
            <div className="space-y-3">
              {personTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.transaction_type === 'credit'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {transaction.transaction_type === 'credit' ? 'Credit' : 'Debit'}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(transaction.transaction_date)}
                      </span>
                    </div>
                    {transaction.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {transaction.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-semibold ${
                      transaction.transaction_type === 'credit'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {transaction.transaction_type === 'credit' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const UserManagement: React.FC<UserManagementProps> = ({ className = '' }) => {
  const {
    persons,
    loading,
    errors,
    fetchPersons,
    createPerson,
    updatePerson,
    deletePerson,
    clearError
  } = useMoneyStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Load persons on component mount
  useEffect(() => {
    fetchPersons();
  }, [fetchPersons]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      clearError('persons');
      clearError('general');
    };
  }, [clearError]);

  // Filter persons based on search term
  const filteredPersons = useMemo(() => {
    if (!searchTerm.trim()) return persons;
    
    const search = searchTerm.toLowerCase();
    return persons.filter(person => 
      person.name.toLowerCase().includes(search) ||
      (person.phone_number && person.phone_number.toLowerCase().includes(search))
    );
  }, [persons, searchTerm]);

  const handleAddPerson = () => {
    setSelectedPerson(null);
    setShowModal(true);
  };

  const handleEditPerson = (person: Person) => {
    setSelectedPerson(person);
    setShowModal(true);
    setShowDetailView(false);
  };

  const handleViewPerson = (person: Person) => {
    setSelectedPerson(person);
    setShowDetailView(true);
  };

  const handleDeletePerson = async (personId: string) => {
    try {
      await deletePerson(personId);
      setDeleteConfirm(null);
    } catch (error) {
      // Error is handled by the store
      console.error('Delete failed:', error);
    }
  };

  const handleModalSubmit = async (data: PersonFormData) => {
    try {
      if (selectedPerson) {
        // Update existing person
        const updateData: UpdatePersonData = {
          name: data.name,
          phone_number: data.phone_number || null
        };
        await updatePerson(selectedPerson.id, updateData);
      } else {
        // Create new person
        const createData: CreatePersonData = {
          name: data.name,
          phone_number: data.phone_number || null
        };
        await createPerson(createData);
      }
    } catch (error) {
      // Error is handled by the store and will be displayed
      throw error;
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPerson(null);
  };

  const handleCloseDetailView = () => {
    setShowDetailView(false);
    setSelectedPerson(null);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            User Management
          </h2>
          <button
            onClick={handleAddPerson}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading.creating}
          >
            Add Person
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by name or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Error Display */}
        {(errors.persons || errors.general) && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.persons || errors.general}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading.persons ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" role="status" aria-label="Loading"></div>
          </div>
        ) : (
          <>
            {/* Person List */}
            {filteredPersons.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No persons found matching your search.' : 'No persons added yet.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPersons.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => handleViewPerson(person)}
                    >
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {person.name}
                      </h3>
                      {person.phone_number && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {person.phone_number}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Added {new Date(person.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPerson(person);
                        }}
                        className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                        disabled={loading.updating}
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(person.id);
                        }}
                        className="px-3 py-1 text-sm font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
                        disabled={loading.deleting}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Person Modal */}
      <PersonModal
        isOpen={showModal}
        onClose={handleCloseModal}
        person={selectedPerson}
        onSubmit={handleModalSubmit}
        loading={loading.creating || loading.updating}
      />

      {/* User Detail View */}
      {showDetailView && selectedPerson && (
        <UserDetailView
          person={selectedPerson}
          onClose={handleCloseDetailView}
          onEdit={handleEditPerson}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Confirm Delete
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this person? This action cannot be undone.
                Note: You can only delete persons who have no transaction history.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700"
                  disabled={loading.deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeletePerson(deleteConfirm)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading.deleting}
                >
                  {loading.deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;