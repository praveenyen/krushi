'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useMoneyStore } from '../stores/moneyStore';
import type { Transaction, Person, CreateTransactionData, TransactionType } from '../types/money';

interface TransactionFormProps {
  transaction?: Transaction;
  onSubmit: (data: CreateTransactionData) => void;
  onCancel: () => void;
  className?: string;
  preselectedPersonId?: string;
}

interface FormData {
  person_id: string;
  amount: string;
  transaction_type: TransactionType;
  description: string;
  transaction_date: string;
  parent_transaction_id: string;
}

interface FormErrors {
  person_id?: string;
  amount?: string;
  transaction_type?: string;
  description?: string;
  transaction_date?: string;
  general?: string;
}

interface PersonOption {
  id: string;
  name: string;
  phone_number: string | null;
  isNew?: boolean;
}

export function TransactionForm({ 
  transaction, 
  onSubmit, 
  onCancel, 
  className = '',
  preselectedPersonId
}: TransactionFormProps) {
  const { 
    persons, 
    transactions,
    loading, 
    createPerson,
    fetchPersons,
    fetchTransactions 
  } = useMoneyStore();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    person_id: transaction?.person_id || preselectedPersonId || '',
    amount: transaction?.amount?.toString() || '',
    transaction_type: transaction?.transaction_type || 'debit',
    description: transaction?.description || '',
    transaction_date: transaction?.transaction_date 
      ? new Date(transaction.transaction_date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    parent_transaction_id: transaction?.parent_transaction_id || ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Person selection and autocomplete state
  const [personSearch, setPersonSearch] = useState('');
  const [showPersonDropdown, setShowPersonDropdown] = useState(false);
  const [showNewPersonForm, setShowNewPersonForm] = useState(false);
  const [newPersonData, setNewPersonData] = useState({ name: '', phone_number: '' });

  // Load persons on mount
  useEffect(() => {
    if (persons.length === 0) {
      fetchPersons();
    }
  }, [persons.length, fetchPersons]);

  // Load transactions for parent transaction selection
  useEffect(() => {
    if (transactions.length === 0) {
      fetchTransactions();
    }
  }, [transactions.length, fetchTransactions]);

  // Load transactions on mount for parent transaction selection
  useEffect(() => {
    if (transactions.length === 0) {
      fetchTransactions();
    }
  }, [transactions.length, fetchTransactions]);

  // Set initial person search if editing transaction or preselected person
  useEffect(() => {
    if (transaction?.person) {
      setPersonSearch(transaction.person.name);
    } else if (preselectedPersonId) {
      const preselectedPerson = persons.find(p => p.id === preselectedPersonId);
      if (preselectedPerson) {
        setPersonSearch(preselectedPerson.name);
      }
    }
  }, [transaction, preselectedPersonId, persons]);

  // Filter persons based on search
  const filteredPersons = useMemo(() => {
    if (!personSearch.trim()) return persons;
    
    return persons.filter(person =>
      person.name.toLowerCase().includes(personSearch.toLowerCase()) ||
      (person.phone_number && person.phone_number.includes(personSearch))
    );
  }, [persons, personSearch]);

  // Get potential parent transactions for the selected person
  const parentTransactionOptions = useMemo(() => {
    if (!formData.person_id) return [];
    
    return transactions
      .filter(t => 
        t.person_id === formData.person_id && 
        t.id !== transaction?.id && // Exclude current transaction when editing
        !t.parent_transaction_id // Only show transactions that aren't already references to other transactions
      )
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
      .slice(0, 10); // Limit to recent 10 transactions
  }, [transactions, formData.person_id, transaction?.id]);

  // Validation functions
  const validateAmount = (amount: string): string | undefined => {
    if (!amount.trim()) return 'Amount is required';
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 'Amount must be a valid number';
    if (numAmount <= 0) return 'Amount must be greater than 0';
    if (numAmount > 999999.99) return 'Amount cannot exceed 999,999.99';
    
    // Check for valid decimal places (max 2)
    const decimalPlaces = (amount.split('.')[1] || '').length;
    if (decimalPlaces > 2) return 'Amount can have at most 2 decimal places';
    
    return undefined;
  };

  const validatePersonId = (personId: string): string | undefined => {
    if (!personId.trim()) return 'Please select a person';
    return undefined;
  };

  const validateDate = (date: string): string | undefined => {
    if (!date.trim()) return 'Date is required';
    
    const selectedDate = new Date(date);
    const now = new Date();
    
    if (selectedDate > now) return 'Transaction date cannot be in the future';
    
    // Check if date is too far in the past (more than 10 years)
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    
    if (selectedDate < tenYearsAgo) return 'Transaction date cannot be more than 10 years ago';
    
    return undefined;
  };

  const validateNewPerson = (data: { name: string; phone_number: string }) => {
    const errors: { name?: string; phone_number?: string } = {};
    
    if (!data.name.trim()) {
      errors.name = 'Name is required';
    } else if (data.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (data.name.trim().length > 100) {
      errors.name = 'Name cannot exceed 100 characters';
    }
    
    if (data.phone_number.trim()) {
      // Basic phone number validation
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(data.phone_number.replace(/[\s\-\(\)]/g, ''))) {
        errors.phone_number = 'Please enter a valid phone number';
      }
      
      // Check for duplicate phone numbers
      const existingPerson = persons.find(p => p.phone_number === data.phone_number.trim());
      if (existingPerson) {
        errors.phone_number = `Phone number already exists for ${existingPerson.name}`;
      }
    }
    
    return errors;
  };

  // Real-time validation
  const validateField = (field: keyof FormData, value: string) => {
    let error: string | undefined;
    
    switch (field) {
      case 'amount':
        error = validateAmount(value);
        break;
      case 'person_id':
        error = validatePersonId(value);
        break;
      case 'transaction_date':
        error = validateDate(value);
        break;
      default:
        break;
    }
    
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
    
    return !error;
  };

  // Handle form field changes
  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear previous error and validate
    if (errors[field]) {
      validateField(field, value);
    }
  };

  // Handle person selection
  const handlePersonSelect = (person: PersonOption) => {
    setFormData(prev => ({ ...prev, person_id: person.id }));
    setPersonSearch(person.name);
    setShowPersonDropdown(false);
    validateField('person_id', person.id);
  };

  // Handle new person creation
  const handleCreateNewPerson = async () => {
    const validationErrors = validateNewPerson(newPersonData);
    
    if (Object.keys(validationErrors).length > 0) {
      // Show validation errors for new person form
      return;
    }
    
    try {
      const createdPerson = await createPerson({
        name: newPersonData.name.trim(),
        phone_number: newPersonData.phone_number.trim() || null
      });
      
      // Select the newly created person
      handlePersonSelect(createdPerson);
      
      // Reset new person form
      setNewPersonData({ name: '', phone_number: '' });
      setShowNewPersonForm(false);
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        general: error instanceof Error ? error.message : 'Failed to create person'
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const amountError = validateAmount(formData.amount);
    const personError = validatePersonId(formData.person_id);
    const dateError = validateDate(formData.transaction_date);
    
    const newErrors: FormErrors = {};
    if (amountError) newErrors.amount = amountError;
    if (personError) newErrors.person_id = personError;
    if (dateError) newErrors.transaction_date = dateError;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const submitData: CreateTransactionData = {
        person_id: formData.person_id,
        amount: parseFloat(formData.amount),
        transaction_type: formData.transaction_type,
        description: formData.description.trim() || null,
        transaction_date: formData.transaction_date,
        parent_transaction_id: formData.parent_transaction_id || null
      };
      
      await onSubmit(submitData);
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to save transaction'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {transaction ? 'Edit Transaction' : 'New Transaction'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close form"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Person Selection */}
        <div className="relative">
          <label htmlFor="person" className="block text-sm font-medium text-gray-700 mb-1">
            Person *
          </label>
          <div className="relative">
            <input
              type="text"
              id="person"
              value={personSearch}
              onChange={(e) => {
                setPersonSearch(e.target.value);
                setShowPersonDropdown(true);
                if (formData.person_id) {
                  setFormData(prev => ({ ...prev, person_id: '' }));
                }
              }}
              onFocus={() => setShowPersonDropdown(true)}
              placeholder="Search or select a person..."
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.person_id ? 'border-red-300' : 'border-gray-300'
              }`}
              autoComplete="off"
            />
            
            {showPersonDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredPersons.length > 0 ? (
                  <>
                    {filteredPersons.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => handlePersonSelect(person)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                      >
                        <div className="font-medium">{person.name}</div>
                        {person.phone_number && (
                          <div className="text-sm text-gray-500">{person.phone_number}</div>
                        )}
                      </button>
                    ))}
                    <div className="border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewPersonForm(true);
                          setShowPersonDropdown(false);
                          setNewPersonData({ name: personSearch, phone_number: '' });
                        }}
                        className="w-full px-3 py-2 text-left text-blue-600 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                      >
                        + Add new person "{personSearch}"
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="px-3 py-2">
                    <div className="text-gray-500 mb-2">No persons found</div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewPersonForm(true);
                        setShowPersonDropdown(false);
                        setNewPersonData({ name: personSearch, phone_number: '' });
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      + Add new person "{personSearch}"
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {errors.person_id && (
            <p className="mt-1 text-sm text-red-600">{errors.person_id}</p>
          )}
        </div>

        {/* Amount Input */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">₹</span>
            <input
              type="number"
              id="amount"
              value={formData.amount}
              onChange={(e) => handleFieldChange('amount', e.target.value)}
              onBlur={(e) => validateField('amount', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              max="999999.99"
              className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.amount ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
          )}
        </div>

        {/* Transaction Type Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction Type *
          </label>
          <div className="flex rounded-md border border-gray-300 overflow-hidden">
            <button
              type="button"
              onClick={() => handleFieldChange('transaction_type', 'debit')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                formData.transaction_type === 'debit'
                  ? 'bg-red-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              I Owe (Debit)
            </button>
            <button
              type="button"
              onClick={() => handleFieldChange('transaction_type', 'credit')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                formData.transaction_type === 'credit'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              They Owe (Credit)
            </button>
          </div>
        </div>

        {/* Date/Time Picker */}
        <div>
          <label htmlFor="transaction_date" className="block text-sm font-medium text-gray-700 mb-1">
            Date & Time *
          </label>
          <input
            type="datetime-local"
            id="transaction_date"
            value={formData.transaction_date}
            onChange={(e) => handleFieldChange('transaction_date', e.target.value)}
            onBlur={(e) => validateField('transaction_date', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.transaction_date ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.transaction_date && (
            <p className="mt-1 text-sm text-red-600">{errors.transaction_date}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="Add a note about this transaction..."
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="mt-1 text-xs text-gray-500 text-right">
            {formData.description.length}/500
          </div>
        </div>

        {/* Parent Transaction Selection */}
        {formData.person_id && parentTransactionOptions.length > 0 && (
          <div>
            <label htmlFor="parent_transaction" className="block text-sm font-medium text-gray-700 mb-1">
              Reference Transaction (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Link this transaction to a previous one (e.g., when repaying a loan)
            </p>
            <select
              id="parent_transaction"
              value={formData.parent_transaction_id}
              onChange={(e) => handleFieldChange('parent_transaction_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No reference transaction</option>
              {parentTransactionOptions.map((transaction) => (
                <option key={transaction.id} value={transaction.id}>
                  {new Date(transaction.transaction_date).toLocaleDateString()} - 
                  {transaction.transaction_type === 'credit' ? '+' : '-'}₹{transaction.amount} 
                  {transaction.description && ` - ${transaction.description.slice(0, 30)}${transaction.description.length > 30 ? '...' : ''}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || loading.creating}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
          >
            {isSubmitting || loading.creating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              transaction ? 'Update Transaction' : 'Create Transaction'
            )}
          </button>
        </div>
      </form>

      {/* New Person Modal */}
      {showNewPersonForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add New Person</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="new-person-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  id="new-person-name"
                  value={newPersonData.name}
                  onChange={(e) => setNewPersonData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter person's name"
                />
              </div>
              
              <div>
                <label htmlFor="new-person-phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  id="new-person-phone"
                  value={newPersonData.phone_number}
                  onChange={(e) => setNewPersonData(prev => ({ ...prev, phone_number: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowNewPersonForm(false);
                  setNewPersonData({ name: '', phone_number: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewPerson}
                disabled={!newPersonData.name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Add Person
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionForm;