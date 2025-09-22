import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TodoService, todoService, type TodoOperation } from '../todoService';
import type { Todo } from '../../types/todo';

// Mock the supabase import
vi.mock('../supabase', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
  };
  
  return {
    supabase: mockSupabase,
  };
});

// Import the mocked supabase for test setup
import { supabase } from '../supabase';
const mockSupabase = supabase as {
  auth: { getUser: ReturnType<typeof vi.fn> };
  from: ReturnType<typeof vi.fn>;
  channel: ReturnType<typeof vi.fn>;
  removeChannel: ReturnType<typeof vi.fn>;
};

// Mock data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

const mockTodo: Todo = {
  id: 'todo-123',
  text: 'Test todo',
  completed: false,
  priority: 'medium' as TodoPriority,
  createdAt: new Date('2023-01-01T00:00:00Z'),
  updated_at: new Date('2023-01-01T00:00:00Z'),
};

const mockDbRow = {
  id: 'todo-123',
  user_id: 'user-123',
  text: 'Test todo',
  completed: false,
  priority: 'medium',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

describe('TodoService', () => {
  let service: TodoService;

  beforeEach(() => {
    service = new TodoService();
    vi.clearAllMocks();
    
    // Default mock for authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createTodo', () => {
    it('should create a todo successfully', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockDbRow,
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const todoData = {
        text: 'Test todo',
        completed: false,
        priority: 'medium' as TodoPriority,
        createdAt: new Date('2023-01-01T00:00:00Z'),
      };

      const result = await service.createTodo(todoData);

      expect(mockSupabase.from).toHaveBeenCalledWith('todos');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        text: 'Test todo',
        completed: false,
        priority: 'medium',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: expect.any(String),
      });
      expect(result).toEqual(mockTodo);
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const todoData = {
        text: 'Test todo',
        completed: false,
        priority: 'medium' as TodoPriority,
        createdAt: new Date(),
      };

      await expect(service.createTodo(todoData)).rejects.toThrow('User not authenticated');
    });

    it('should throw error when database operation fails', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const todoData = {
        text: 'Test todo',
        completed: false,
        priority: 'medium' as TodoPriority,
        createdAt: new Date(),
      };

      await expect(service.createTodo(todoData)).rejects.toThrow('Failed to create todo: Database error');
    });
  });

  describe('getTodos', () => {
    it('should fetch todos for authenticated user', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [mockDbRow],
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await service.getTodos();

      expect(mockSupabase.from).toHaveBeenCalledWith('todos');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(result).toEqual([mockTodo]);
    });

    it('should fetch todos for specific user ID', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [mockDbRow],
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await service.getTodos('user-456');

      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-456');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual([mockTodo]);
    });

    it('should throw error when user is not authenticated and no userId provided', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(service.getTodos()).rejects.toThrow('User not authenticated');
    });

    it('should throw error when database operation fails', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      await expect(service.getTodos()).rejects.toThrow('Failed to fetch todos: Database error');
    });
  });

  describe('updateTodo', () => {
    it('should update a todo successfully', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...mockDbRow, text: 'Updated todo' },
                error: null,
              }),
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      });

      const updates = { text: 'Updated todo' };
      const result = await service.updateTodo('todo-123', updates);

      expect(mockSupabase.from).toHaveBeenCalledWith('todos');
      expect(mockUpdate).toHaveBeenCalledWith({
        text: 'Updated todo',
        updated_at: expect.any(String),
      });
      expect(result.text).toBe('Updated todo');
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(service.updateTodo('todo-123', { text: 'Updated' }))
        .rejects.toThrow('User not authenticated');
    });

    it('should throw error when todo is not found', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      });

      await expect(service.updateTodo('todo-123', { text: 'Updated' }))
        .rejects.toThrow('Todo not found or access denied');
    });
  });

  describe('deleteTodo', () => {
    it('should delete a todo successfully', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        delete: mockDelete,
      });

      await service.deleteTodo('todo-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('todos');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(service.deleteTodo('todo-123')).rejects.toThrow('User not authenticated');
    });

    it('should throw error when database operation fails', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'Database error' },
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        delete: mockDelete,
      });

      await expect(service.deleteTodo('todo-123')).rejects.toThrow('Failed to delete todo: Database error');
    });
  });

  describe('batchSync', () => {
    it('should process batch operations successfully', async () => {
      const operations: TodoOperation[] = [
        {
          type: 'create',
          todo: mockTodo,
          timestamp: new Date(),
          retryCount: 0,
        },
        {
          type: 'update',
          todo: { ...mockTodo, text: 'Updated' },
          timestamp: new Date(),
          retryCount: 0,
        },
        {
          type: 'delete',
          todo: mockTodo,
          timestamp: new Date(),
          retryCount: 0,
        },
      ];

      // Mock successful operations
      vi.spyOn(service, 'createTodo').mockResolvedValue(mockTodo);
      vi.spyOn(service, 'updateTodo').mockResolvedValue({ ...mockTodo, text: 'Updated' });
      vi.spyOn(service, 'deleteTodo').mockResolvedValue();

      await service.batchSync(operations);

      expect(service.createTodo).toHaveBeenCalledWith({
        text: mockTodo.text,
        completed: mockTodo.completed,
        priority: mockTodo.priority,
        createdAt: mockTodo.createdAt,
      });
      expect(service.updateTodo).toHaveBeenCalledWith(mockTodo.id, {
        text: 'Updated',
        completed: mockTodo.completed,
        priority: mockTodo.priority,
      });
      expect(service.deleteTodo).toHaveBeenCalledWith(mockTodo.id);
    });

    it('should throw error when some operations fail', async () => {
      const operations: TodoOperation[] = [
        {
          type: 'create',
          todo: mockTodo,
          timestamp: new Date(),
          retryCount: 0,
        },
      ];

      vi.spyOn(service, 'createTodo').mockRejectedValue(new Error('Create failed'));

      await expect(service.batchSync(operations)).rejects.toThrow('Batch sync partially failed');
    });

    it('should throw error for unknown operation type', async () => {
      const operations = [
        {
          type: 'unknown' as 'create' | 'update' | 'delete',
          todo: mockTodo,
          timestamp: new Date(),
          retryCount: 0,
        },
      ];

      await expect(service.batchSync(operations)).rejects.toThrow('Batch sync partially failed');
    });
  });

  describe('subscribeToTodos', () => {
    it('should set up real-time subscription', () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };

      mockSupabase.channel.mockReturnValue(mockChannel);

      const callback = vi.fn();
      const unsubscribe = service.subscribeToTodos('user-123', callback);

      expect(mockSupabase.channel).toHaveBeenCalledWith('todos-changes');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: 'user_id=eq.user-123',
        },
        callback
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();

      // Test unsubscribe
      unsubscribe();
      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });
  });

  describe('getTodo', () => {
    it('should fetch a single todo by ID', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockDbRow,
        error: null,
      });
      const mockEq2 = vi.fn().mockReturnValue({
        single: mockSingle,
      });
      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await service.getTodo('todo-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('todos');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq1).toHaveBeenCalledWith('id', 'todo-123');
      expect(mockEq2).toHaveBeenCalledWith('user_id', 'user-123');
      expect(result).toEqual(mockTodo);
    });

    it('should return null when todo is not found', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });
      const mockEq2 = vi.fn().mockReturnValue({
        single: mockSingle,
      });
      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await service.getTodo('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('isAvailable', () => {
    it('should return true when user is authenticated', async () => {
      const result = await service.isAvailable();
      expect(result).toBe(true);
    });

    it('should return false when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await service.isAvailable();
      expect(result).toBe(false);
    });

    it('should return false when auth check throws error', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Auth error'));

      const result = await service.isAvailable();
      expect(result).toBe(false);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(todoService).toBeInstanceOf(TodoService);
    });
  });
});