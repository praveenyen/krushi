import { describe, it, expect, vi, beforeEach } from 'vitest';
import { moneyService } from '../moneyService';
import { supabase } from '../supabase';
import type { User, AuthError } from '@supabase/supabase-js';

// Mock the supabase client
vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
    rpc: vi.fn(),
  },
}));

const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: {},
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2023-01-01T00:00:00Z',
} as User;

const mockAuthError: AuthError = {
  name: 'AuthError',
  message: 'Authentication failed',
};

describe('MoneyService Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTransactions', () => {
    it('should throw authentication error when user is not authenticated', async () => {
      const mockSupabase = vi.mocked(supabase);
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(moneyService.getTransactions()).rejects.toThrow(
        'User not authenticated. Please sign in to view transactions.'
      );
    });

    it('should throw authentication error when auth service returns error', async () => {
      const mockSupabase = vi.mocked(supabase);
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: mockAuthError,
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(moneyService.getTransactions()).rejects.toThrow(
        'Authentication failed: Authentication failed'
      );

      expect(consoleSpy).toHaveBeenCalledWith('Authentication error in getTransactions:', mockAuthError);
      consoleSpy.mockRestore();
    });

    it('should proceed with query when user is authenticated', async () => {
      const mockSupabase = vi.mocked(supabase);
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockQuery = {
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      } as any);

      const result = await moneyService.getTransactions();

      expect(result).toEqual([]);
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
    });
  });

  describe('createTransaction', () => {
    const validTransactionData = {
      person_id: 'person-123',
      amount: 100,
      transaction_type: 'credit' as const,
      description: 'Test transaction',
    };

    it('should throw authentication error when user is not authenticated', async () => {
      const mockSupabase = vi.mocked(supabase);
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(moneyService.createTransaction(validTransactionData)).rejects.toThrow(
        'User not authenticated. Please sign in to create transactions.'
      );
    });

    it('should throw authentication error when auth service returns error', async () => {
      const mockSupabase = vi.mocked(supabase);
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: mockAuthError,
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(moneyService.createTransaction(validTransactionData)).rejects.toThrow(
        'Authentication failed: Authentication failed'
      );

      expect(consoleSpy).toHaveBeenCalledWith('Authentication error in createTransaction:', mockAuthError);
      consoleSpy.mockRestore();
    });

    it('should include user_id when user is authenticated', async () => {
      const mockSupabase = vi.mocked(supabase);
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockTransaction = {
        id: 'transaction-123',
        ...validTransactionData,
        user_id: mockUser.id,
        transaction_date: expect.any(String),
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockTransaction, error: null }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await moneyService.createTransaction(validTransactionData);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          person_id: validTransactionData.person_id,
          amount: validTransactionData.amount,
          transaction_type: validTransactionData.transaction_type,
          description: validTransactionData.description,
        })
      );
      expect(result).toEqual(mockTransaction);
    });
  });

  describe('getPersons', () => {
    it('should throw authentication error when user is not authenticated', async () => {
      const mockSupabase = vi.mocked(supabase);
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(moneyService.getPersons()).rejects.toThrow(
        'User not authenticated. Please sign in to view persons.'
      );
    });

    it('should throw authentication error when auth service returns error', async () => {
      const mockSupabase = vi.mocked(supabase);
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: mockAuthError,
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(moneyService.getPersons()).rejects.toThrow(
        'Authentication failed: Authentication failed'
      );

      expect(consoleSpy).toHaveBeenCalledWith('Authentication error in getPersons:', mockAuthError);
      consoleSpy.mockRestore();
    });
  });

  describe('createPerson', () => {
    const validPersonData = {
      name: 'John Doe',
      phone_number: '+1234567890',
    };

    it('should throw authentication error when user is not authenticated', async () => {
      const mockSupabase = vi.mocked(supabase);
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(moneyService.createPerson(validPersonData)).rejects.toThrow(
        'User not authenticated. Please sign in to create persons.'
      );
    });

    it('should throw authentication error when auth service returns error', async () => {
      const mockSupabase = vi.mocked(supabase);
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: mockAuthError,
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(moneyService.createPerson(validPersonData)).rejects.toThrow(
        'Authentication failed: Authentication failed'
      );

      expect(consoleSpy).toHaveBeenCalledWith('Authentication error in createPerson:', mockAuthError);
      consoleSpy.mockRestore();
    });

    it('should include user_id when user is authenticated', async () => {
      const mockSupabase = vi.mocked(supabase);
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockPerson = {
        id: 'person-123',
        ...validPersonData,
        user_id: mockUser.id,
      };

      // Mock the duplicate check query
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockPerson, error: null }),
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        select: mockSelect,
      } as any).mockReturnValueOnce({
        insert: mockInsert,
      } as any);

      const result = await moneyService.createPerson(validPersonData);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          name: validPersonData.name,
          phone_number: validPersonData.phone_number,
        })
      );
      expect(result).toEqual(mockPerson);
    });
  });

  describe('getBalanceSummaries', () => {
    it('should throw authentication error when user is not authenticated', async () => {
      const mockSupabase = vi.mocked(supabase);
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Mock the RPC call to avoid fallback
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      await expect(moneyService.getBalanceSummaries()).rejects.toThrow(
        'User not authenticated. Please sign in to view balance summaries.'
      );
    });

    it('should throw authentication error when auth service returns error', async () => {
      const mockSupabase = vi.mocked(supabase);
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: mockAuthError,
      });

      // Mock the RPC call to avoid fallback
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(moneyService.getBalanceSummaries()).rejects.toThrow(
        'Authentication failed: Authentication failed'
      );

      expect(consoleSpy).toHaveBeenCalledWith('Authentication error in getBalanceSummaries:', mockAuthError);
      consoleSpy.mockRestore();
    });

    it('should proceed with RPC call when user is authenticated', async () => {
      const mockSupabase = vi.mocked(supabase);
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockBalanceSummaries = [
        {
          person_id: 'person-1',
          person_name: 'John Doe',
          total_credit: 100,
          total_debit: 50,
          net_balance: 50,
          last_transaction_date: '2023-01-01',
          transaction_count: 2,
        },
      ];

      mockSupabase.rpc.mockResolvedValue({ data: mockBalanceSummaries, error: null });

      const result = await moneyService.getBalanceSummaries();

      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_balance_summaries');
      expect(result).toEqual(mockBalanceSummaries);
    });
  });

  describe('Authentication error handling consistency', () => {
    const methods = [
      { name: 'getTransactions', args: [] },
      { name: 'createTransaction', args: [{ person_id: 'test', amount: 100, transaction_type: 'credit' as const }] },
      { name: 'getPersons', args: [] },
      { name: 'createPerson', args: [{ name: 'Test' }] },

    ];

    methods.forEach(({ name, args }) => {
      it(`should handle authentication consistently in ${name}`, async () => {
        const mockSupabase = vi.mocked(supabase);
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: mockAuthError,
        });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await expect((moneyService as any)[name](...args)).rejects.toThrow(
          'Authentication failed: Authentication failed'
        );

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Authentication error in'),
          mockAuthError
        );

        consoleSpy.mockRestore();
      });
    });

    // Separate test for getBalanceSummaries due to its fallback behavior
    it('should handle authentication consistently in getBalanceSummaries', async () => {
      const mockSupabase = vi.mocked(supabase);
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: mockAuthError,
      });

      // Mock the RPC call to avoid fallback
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(moneyService.getBalanceSummaries()).rejects.toThrow(
        'Authentication failed: Authentication failed'
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Authentication error in getBalanceSummaries:',
        mockAuthError
      );

      consoleSpy.mockRestore();
    });
  });
});