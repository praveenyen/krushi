import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTodoStore } from '../todoStore';
import { todoService } from '../../services/todoService';
import { networkMonitor } from '../../utils/networkUtils';
import type { Todo } from '../../types/todo';
import type { RealtimePayload } from '../../services/todoService';

// Mock the todoService
vi.mock('../../services/todoService', () => ({
  todoService: {
    isAvailable: vi.fn(),
    getTodos: vi.fn(),
    getTodosWithMetadata: vi.fn(),
    createTodo: vi.fn(),
    updateTodo: vi.fn(),
    deleteTodo: vi.fn(),
    batchSync: vi.fn(),
    checkConnectivity: vi.fn(),
  },
}));

// Mock the network utils
vi.mock('../../utils/networkUtils', () => ({
  networkMonitor: {
    getStatus: vi.fn(() => ({
      isOnline: true,
      lastOnlineTime: new Date(),
    })),
    subscribe: vi.fn(() => () => {}),
    isOnline: vi.fn(() => true),
  },
}));



describe('TodoStore with Supabase Sync', () => {
  beforeEach(() => {
    // Reset store state
    useTodoStore.setState({
      todos: [],
      inputValue: '',
      sortBy: 'createdAt',
      syncing: false,
      syncError: null,
      lastSyncTime: null,
      offlineQueue: [],
      networkStatus: {
        isOnline: true,
        lastOnlineTime: new Date(),
      },
      autoSyncEnabled: true,
    });
    
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Sync State Properties', () => {
    it('should initialize with correct sync state', () => {
      const state = useTodoStore.getState();
      
      expect(state.syncing).toBe(false);
      expect(state.syncError).toBe(null);
      expect(state.lastSyncTime).toBe(null);
      expect(state.offlineQueue).toEqual([]);
    });
  });

  describe('syncTodos', () => {
    it('should fetch todos from Supabase when user is authenticated', async () => {
      const mockTodos: Todo[] = [
        {
          id: '1',
          text: 'Test todo',
          completed: false,
          priority: 'medium',
          createdAt: new Date(),
        },
      ];

      vi.mocked(todoService.isAvailable).mockResolvedValue(true);
      vi.mocked(todoService.getTodosWithMetadata).mockResolvedValue(mockTodos);

      const { syncTodos } = useTodoStore.getState();
      await syncTodos();

      const state = useTodoStore.getState();
      expect(state.todos).toEqual(mockTodos);
      expect(state.syncing).toBe(false);
      expect(state.syncError).toBe(null);
      expect(state.lastSyncTime).toBeInstanceOf(Date);
    });

    it('should handle sync errors', async () => {
      vi.mocked(todoService.isAvailable).mockResolvedValue(true);
      vi.mocked(todoService.getTodosWithMetadata).mockRejectedValue(new Error('Network error'));

      const { syncTodos } = useTodoStore.getState();
      
      await expect(syncTodos()).rejects.toThrow('Network error');
      
      const state = useTodoStore.getState();
      expect(state.syncing).toBe(false);
      expect(state.syncError).toBe('Network error');
    });

    it('should handle unauthenticated user', async () => {
      vi.mocked(todoService.isAvailable).mockResolvedValue(false);

      const { syncTodos } = useTodoStore.getState();
      
      await expect(syncTodos()).rejects.toThrow('User not authenticated');
      
      const state = useTodoStore.getState();
      expect(state.syncing).toBe(false);
      expect(state.syncError).toBe('User not authenticated');
    });
  });

  describe('syncTodo', () => {
    const mockTodo: Todo = {
      id: '1',
      text: 'Test todo',
      completed: false,
      priority: 'medium',
      createdAt: new Date(),
    };

    it('should create new todo when user is authenticated', async () => {
      // Use a timestamp-based ID to simulate a new todo
      const newTodo = { ...mockTodo, id: Date.now().toString() };
      const createdTodo = { ...newTodo, id: 'server-id' };
      
      vi.mocked(todoService.isAvailable).mockResolvedValue(true);
      vi.mocked(todoService.createTodo).mockResolvedValue(createdTodo);

      // Set initial state with the todo
      useTodoStore.setState({ todos: [newTodo] });

      const { syncTodo } = useTodoStore.getState();
      await syncTodo(newTodo);

      const state = useTodoStore.getState();
      expect(state.todos[0]).toEqual(createdTodo);
      expect(state.syncing).toBe(false);
      expect(state.lastSyncTime).toBeInstanceOf(Date);
    });

    it('should update existing todo when user is authenticated', async () => {
      // Use a UUID-like ID to simulate an existing todo from server
      const existingTodo = { ...mockTodo, id: 'uuid-server-id' };
      const updatedTodo = { ...existingTodo, text: 'Updated text' };
      
      vi.mocked(todoService.isAvailable).mockResolvedValue(true);
      vi.mocked(todoService.updateTodo).mockResolvedValue(updatedTodo);

      // Set initial state with the todo
      useTodoStore.setState({ todos: [existingTodo] });

      const { syncTodo } = useTodoStore.getState();
      await syncTodo(updatedTodo);

      const state = useTodoStore.getState();
      expect(state.todos[0]).toEqual(updatedTodo);
      expect(state.syncing).toBe(false);
      expect(state.lastSyncTime).toBeInstanceOf(Date);
    });

    it('should queue operation when user is not authenticated', async () => {
      vi.mocked(todoService.isAvailable).mockResolvedValue(false);

      const { syncTodo } = useTodoStore.getState();
      await syncTodo(mockTodo);

      const state = useTodoStore.getState();
      expect(state.offlineQueue).toHaveLength(1);
      expect(state.offlineQueue[0].type).toBe('update');
      expect(state.offlineQueue[0].todo).toEqual(mockTodo);
    });
  });

  describe('handleRealtimeUpdate', () => {
    it('should handle INSERT events', () => {
      const payload: RealtimePayload = {
        eventType: 'INSERT',
        new: {
          id: '1',
          text: 'New todo',
          completed: false,
          priority: 'medium',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: 'user-1',
        },
        old: null,
        schema: 'public',
        table: 'todos',
        commit_timestamp: new Date().toISOString(),
      };

      const { handleRealtimeUpdate } = useTodoStore.getState();
      handleRealtimeUpdate(payload);

      const state = useTodoStore.getState();
      expect(state.todos).toHaveLength(1);
      expect(state.todos[0].text).toBe('New todo');
      expect(state.lastSyncTime).toBeInstanceOf(Date);
    });

    it('should handle UPDATE events', () => {
      const existingTodo: Todo = {
        id: '1',
        text: 'Original text',
        completed: false,
        priority: 'medium',
        createdAt: new Date(),
      };

      useTodoStore.setState({ todos: [existingTodo] });

      const payload: RealtimePayload = {
        eventType: 'UPDATE',
        new: {
          id: '1',
          text: 'Updated text',
          completed: true,
          priority: 'high',
          created_at: existingTodo.createdAt.toISOString(),
          updated_at: new Date().toISOString(),
          user_id: 'user-1',
        },
        old: null,
        schema: 'public',
        table: 'todos',
        commit_timestamp: new Date().toISOString(),
      };

      const { handleRealtimeUpdate } = useTodoStore.getState();
      handleRealtimeUpdate(payload);

      const state = useTodoStore.getState();
      expect(state.todos[0].text).toBe('Updated text');
      expect(state.todos[0].completed).toBe(true);
      expect(state.todos[0].priority).toBe('high');
    });

    it('should handle DELETE events', () => {
      const existingTodo: Todo = {
        id: '1',
        text: 'To be deleted',
        completed: false,
        priority: 'medium',
        createdAt: new Date(),
      };

      useTodoStore.setState({ todos: [existingTodo] });

      const payload: RealtimePayload = {
        eventType: 'DELETE',
        new: null,
        old: {
          id: '1',
          text: 'To be deleted',
          completed: false,
          priority: 'medium',
          created_at: existingTodo.createdAt.toISOString(),
          updated_at: new Date().toISOString(),
          user_id: 'user-1',
        },
        schema: 'public',
        table: 'todos',
        commit_timestamp: new Date().toISOString(),
      };

      const { handleRealtimeUpdate } = useTodoStore.getState();
      handleRealtimeUpdate(payload);

      const state = useTodoStore.getState();
      expect(state.todos).toHaveLength(0);
    });
  });

  describe('queueOperation', () => {
    it('should add operation to offline queue', () => {
      const operation = {
        type: 'create' as const,
        todo: {
          id: '1',
          text: 'Test todo',
          completed: false,
          priority: 'medium' as const,
          createdAt: new Date(),
        },
        timestamp: new Date(),
        retryCount: 0,
      };

      const { queueOperation } = useTodoStore.getState();
      queueOperation(operation);

      const state = useTodoStore.getState();
      expect(state.offlineQueue).toHaveLength(1);
      expect(state.offlineQueue[0]).toEqual(operation);
    });
  });

  describe('processSyncQueue', () => {
    it('should process queued operations when user is authenticated', async () => {
      const operation = {
        type: 'create' as const,
        todo: {
          id: '1',
          text: 'Test todo',
          completed: false,
          priority: 'medium' as const,
          createdAt: new Date(),
        },
        timestamp: new Date(),
        retryCount: 0,
      };

      useTodoStore.setState({ offlineQueue: [operation] });

      vi.mocked(todoService.isAvailable).mockResolvedValue(true);
      vi.mocked(todoService.getTodosWithMetadata).mockResolvedValue([]);
      vi.mocked(todoService.batchSync).mockResolvedValue();

      const { processSyncQueue } = useTodoStore.getState();
      await processSyncQueue();

      const state = useTodoStore.getState();
      expect(state.offlineQueue).toHaveLength(0);
      expect(state.syncing).toBe(false);
      expect(state.lastSyncTime).toBeInstanceOf(Date);
    });

    it('should handle sync queue errors', async () => {
      const operation = {
        type: 'create' as const,
        todo: {
          id: '1',
          text: 'Test todo',
          completed: false,
          priority: 'medium' as const,
          createdAt: new Date(),
        },
        timestamp: new Date(),
        retryCount: 0,
      };

      useTodoStore.setState({ offlineQueue: [operation] });

      vi.mocked(todoService.isAvailable).mockResolvedValue(true);
      vi.mocked(todoService.getTodosWithMetadata).mockResolvedValue([]);
      vi.mocked(todoService.batchSync).mockRejectedValue(new Error('Sync failed'));

      const { processSyncQueue } = useTodoStore.getState();
      
      await expect(processSyncQueue()).rejects.toThrow('Sync failed');

      const state = useTodoStore.getState();
      expect(state.offlineQueue[0].retryCount).toBe(1);
      expect(state.syncError).toBe('Sync failed');
    });
  });

  describe('Enhanced CRUD operations', () => {
    it('should sync todo after adding', async () => {
      vi.mocked(todoService.isAvailable).mockResolvedValue(true);
      vi.mocked(todoService.createTodo).mockResolvedValue({
        id: 'server-id',
        text: 'New todo',
        completed: false,
        priority: 'medium',
        createdAt: new Date(),
      });

      const { addTodo } = useTodoStore.getState();
      addTodo('New todo', 'medium');

      // Wait for async sync to complete with a longer timeout
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(todoService.createTodo).toHaveBeenCalled();
    });

    it('should sync todo after toggling', async () => {
      const existingTodo: Todo = {
        id: 'uuid-server-id',
        text: 'Test todo',
        completed: false,
        priority: 'medium',
        createdAt: new Date(),
      };

      useTodoStore.setState({ todos: [existingTodo] });

      vi.mocked(todoService.isAvailable).mockResolvedValue(true);
      vi.mocked(todoService.updateTodo).mockResolvedValue({
        ...existingTodo,
        completed: true,
      });

      const { toggleTodo } = useTodoStore.getState();
      toggleTodo('uuid-server-id');

      // Wait for async sync to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(todoService.updateTodo).toHaveBeenCalledWith('uuid-server-id', {
        text: 'Test todo',
        completed: true,
        priority: 'medium',
      });
    });

    it('should sync todo deletion', async () => {
      const existingTodo: Todo = {
        id: '1',
        text: 'Test todo',
        completed: false,
        priority: 'medium',
        createdAt: new Date(),
      };

      useTodoStore.setState({ todos: [existingTodo] });

      vi.mocked(todoService.deleteTodo).mockResolvedValue();

      const { deleteTodo } = useTodoStore.getState();
      deleteTodo('1');

      // Wait for async sync to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(todoService.deleteTodo).toHaveBeenCalledWith('1');
    });
  });

  describe('Enhanced Offline Queue and Sync Mechanism', () => {
    describe('Network Status Management', () => {
      it('should initialize network monitoring', () => {
        const { initializeNetworkMonitoring } = useTodoStore.getState();
        initializeNetworkMonitoring();
        
        expect(networkMonitor.subscribe).toHaveBeenCalled();
      });

      it('should handle network status changes', () => {
        const { handleNetworkStatusChange } = useTodoStore.getState();
        const newStatus = {
          isOnline: false,
          lastOnlineTime: new Date(),
        };
        
        handleNetworkStatusChange(newStatus);
        
        const state = useTodoStore.getState();
        expect(state.networkStatus).toEqual(newStatus);
      });

      it('should trigger auto-sync when coming back online', async () => {
        const operation = {
          type: 'create' as const,
          todo: {
            id: '1',
            text: 'Test todo',
            completed: false,
            priority: 'medium' as const,
            createdAt: new Date(),
          },
          timestamp: new Date(),
          retryCount: 0,
        };

        useTodoStore.setState({ 
          offlineQueue: [operation],
          networkStatus: { isOnline: false, lastOnlineTime: null }
        });

        vi.mocked(todoService.isAvailable).mockResolvedValue(true);
        vi.mocked(todoService.getTodosWithMetadata).mockResolvedValue([]);
        vi.mocked(todoService.batchSync).mockResolvedValue();

        const { handleNetworkStatusChange } = useTodoStore.getState();
        
        // Simulate coming back online
        handleNetworkStatusChange({
          isOnline: true,
          lastOnlineTime: new Date(),
        });

        // Wait for auto-sync to trigger
        await new Promise(resolve => setTimeout(resolve, 1100));

        expect(todoService.batchSync).toHaveBeenCalledWith([operation]);
      });
    });

    describe('Conflict Resolution', () => {
      it('should resolve conflicts using server timestamps (last-write-wins)', () => {
        const now = new Date();
        const earlier = new Date(now.getTime() - 60000); // 1 minute earlier
        
        const localTodos: Todo[] = [
          {
            id: '1',
            text: 'Local version',
            completed: false,
            priority: 'medium',
            createdAt: earlier,
            updated_at: now, // Local is newer
          },
          {
            id: '2',
            text: 'Local only',
            completed: true,
            priority: 'high',
            createdAt: now,
          },
        ];

        const remoteTodos: Todo[] = [
          {
            id: '1',
            text: 'Remote version',
            completed: true,
            priority: 'high',
            createdAt: earlier,
            updated_at: earlier, // Remote is older
          },
          {
            id: '3',
            text: 'Remote only',
            completed: false,
            priority: 'low',
            createdAt: now,
          },
        ];

        const { resolveConflicts } = useTodoStore.getState();
        const resolved = resolveConflicts(localTodos, remoteTodos);

        expect(resolved).toHaveLength(3);
        
        // Should keep local version of todo 1 (newer timestamp)
        const todo1 = resolved.find(t => t.id === '1');
        expect(todo1?.text).toBe('Local version');
        
        // Should keep local-only todo
        const todo2 = resolved.find(t => t.id === '2');
        expect(todo2?.text).toBe('Local only');
        
        // Should add remote-only todo
        const todo3 = resolved.find(t => t.id === '3');
        expect(todo3?.text).toBe('Remote only');
      });

      it('should prefer remote version when timestamps are equal', () => {
        const now = new Date();
        
        const localTodos: Todo[] = [
          {
            id: '1',
            text: 'Local version',
            completed: false,
            priority: 'medium',
            createdAt: now,
            updated_at: now,
          },
        ];

        const remoteTodos: Todo[] = [
          {
            id: '1',
            text: 'Remote version',
            completed: true,
            priority: 'high',
            createdAt: now,
            updated_at: now,
          },
        ];

        const { resolveConflicts } = useTodoStore.getState();
        const resolved = resolveConflicts(localTodos, remoteTodos);

        expect(resolved).toHaveLength(1);
        expect(resolved[0].text).toBe('Remote version');
      });

      it('should handle todos without updated_at timestamps', () => {
        const now = new Date();
        const earlier = new Date(now.getTime() - 60000);
        
        const localTodos: Todo[] = [
          {
            id: '1',
            text: 'Local version',
            completed: false,
            priority: 'medium',
            createdAt: now, // Newer creation date
          },
        ];

        const remoteTodos: Todo[] = [
          {
            id: '1',
            text: 'Remote version',
            completed: true,
            priority: 'high',
            createdAt: earlier, // Older creation date
          },
        ];

        const { resolveConflicts } = useTodoStore.getState();
        const resolved = resolveConflicts(localTodos, remoteTodos);

        expect(resolved).toHaveLength(1);
        expect(resolved[0].text).toBe('Local version'); // Should keep newer created todo
      });
    });

    describe('Enhanced Sync Queue Processing', () => {
      it('should filter irrelevant operations during sync', async () => {
        const now = new Date();
        const operation1 = {
          type: 'update' as const,
          todo: {
            id: '1',
            text: 'Update existing',
            completed: false,
            priority: 'medium' as const,
            createdAt: now,
          },
          timestamp: now,
          retryCount: 0,
        };

        const operation2 = {
          type: 'update' as const,
          todo: {
            id: '2',
            text: 'Update non-existent',
            completed: false,
            priority: 'medium' as const,
            createdAt: now,
          },
          timestamp: now,
          retryCount: 0,
        };

        const operation3 = {
          type: 'create' as const,
          todo: {
            id: '3',
            text: 'Create new',
            completed: false,
            priority: 'medium' as const,
            createdAt: now,
          },
          timestamp: now,
          retryCount: 0,
        };

        // Set up state with one existing todo and operations
        useTodoStore.setState({ 
          todos: [operation1.todo], // Only todo 1 exists locally
          offlineQueue: [operation1, operation2, operation3]
        });

        vi.mocked(todoService.isAvailable).mockResolvedValue(true);
        vi.mocked(todoService.getTodosWithMetadata).mockResolvedValue([operation1.todo]);
        vi.mocked(todoService.batchSync).mockResolvedValue();

        const { processSyncQueue } = useTodoStore.getState();
        await processSyncQueue();

        // Should only sync operation1 (update existing) and operation3 (create)
        // operation2 should be filtered out as todo 2 doesn't exist locally
        expect(todoService.batchSync).toHaveBeenCalledWith([operation1, operation3]);
      });

      it('should limit retry attempts and remove failed operations', async () => {
        const operation = {
          type: 'create' as const,
          todo: {
            id: '1',
            text: 'Test todo',
            completed: false,
            priority: 'medium' as const,
            createdAt: new Date(),
          },
          timestamp: new Date(),
          retryCount: 3, // Already at max retries
        };

        useTodoStore.setState({ offlineQueue: [operation] });

        vi.mocked(todoService.isAvailable).mockResolvedValue(true);
        vi.mocked(todoService.getTodosWithMetadata).mockResolvedValue([]);
        vi.mocked(todoService.batchSync).mockRejectedValue(new Error('Sync failed'));

        const { processSyncQueue } = useTodoStore.getState();
        
        await expect(processSyncQueue()).rejects.toThrow('Sync failed');

        const state = useTodoStore.getState();
        // Operation should be removed as it exceeded max retries (3 + 1 = 4 > 3)
        expect(state.offlineQueue).toHaveLength(0);
      });
    });

    describe('Auto-sync Configuration', () => {
      it('should enable/disable auto-sync', () => {
        const { setAutoSync } = useTodoStore.getState();
        
        setAutoSync(false);
        expect(useTodoStore.getState().autoSyncEnabled).toBe(false);
        
        setAutoSync(true);
        expect(useTodoStore.getState().autoSyncEnabled).toBe(true);
      });

      it('should not auto-sync when disabled', async () => {
        useTodoStore.setState({ 
          autoSyncEnabled: false,
          networkStatus: { isOnline: false, lastOnlineTime: null }
        });

        vi.mocked(todoService.isAvailable).mockResolvedValue(true);
        vi.mocked(todoService.getTodosWithMetadata).mockResolvedValue([]);

        const { handleNetworkStatusChange } = useTodoStore.getState();
        
        // Simulate coming back online
        handleNetworkStatusChange({
          isOnline: true,
          lastOnlineTime: new Date(),
        });

        // Wait for potential auto-sync
        await new Promise(resolve => setTimeout(resolve, 1100));

        // Should not have triggered sync
        expect(todoService.getTodosWithMetadata).not.toHaveBeenCalled();
      });
    });

    describe('Sync with Conflict Resolution Integration', () => {
      it('should sync todos with conflict resolution', async () => {
        const now = new Date();
        const earlier = new Date(now.getTime() - 60000);
        
        const localTodos: Todo[] = [
          {
            id: '1',
            text: 'Local version',
            completed: false,
            priority: 'medium',
            createdAt: earlier,
            updated_at: now, // Local is newer
          },
        ];

        const remoteTodos: Todo[] = [
          {
            id: '1',
            text: 'Remote version',
            completed: true,
            priority: 'high',
            createdAt: earlier,
            updated_at: earlier, // Remote is older
          },
          {
            id: '2',
            text: 'Remote only',
            completed: false,
            priority: 'low',
            createdAt: now,
          },
        ];

        useTodoStore.setState({ todos: localTodos });

        vi.mocked(todoService.isAvailable).mockResolvedValue(true);
        vi.mocked(todoService.getTodosWithMetadata).mockResolvedValue(remoteTodos);

        const { syncTodos } = useTodoStore.getState();
        await syncTodos();

        const state = useTodoStore.getState();
        expect(state.todos).toHaveLength(2);
        
        // Should keep local version (newer)
        const todo1 = state.todos.find(t => t.id === '1');
        expect(todo1?.text).toBe('Local version');
        
        // Should add remote-only todo
        const todo2 = state.todos.find(t => t.id === '2');
        expect(todo2?.text).toBe('Remote only');
      });
    });
  });


});