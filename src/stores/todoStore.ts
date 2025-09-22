import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Todo, TodoPriority, TodoSortOption } from '../types/todo';
import { sortTodos } from '../utils/todoUtils';
import { todoService, type RealtimePayload, type TodoOperation } from '../services/todoService';
import { networkMonitor, type NetworkStatus } from '../utils/networkUtils';

interface TodoState {
  todos: Todo[];
  inputValue: string;
  sortBy: TodoSortOption;
  
  // Sync state properties
  syncing: boolean;
  syncError: string | null;
  lastSyncTime: Date | null;
  offlineQueue: TodoOperation[];
  

  
  // Network state
  networkStatus: NetworkStatus;
  autoSyncEnabled: boolean;
  
  // Actions
  setTodos: (todos: Todo[]) => void;
  setInputValue: (value: string) => void;
  setSortBy: (sortBy: TodoSortOption) => void;
  addTodo: (text: string, priority: TodoPriority) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  
  // Sync actions
  syncTodos: () => Promise<void>;
  syncTodo: (todo: Todo) => Promise<void>;
  handleRealtimeUpdate: (payload: RealtimePayload) => void;
  queueOperation: (operation: TodoOperation) => void;
  processSyncQueue: () => Promise<void>;
  

  
  // Network and sync management
  initializeNetworkMonitoring: () => void;
  handleNetworkStatusChange: (status: NetworkStatus) => void;
  resolveConflicts: (localTodos: Todo[], remoteTodos: Todo[]) => Todo[];
  setAutoSync: (enabled: boolean) => void;
  
  // Computed
  getSortedTodos: () => Todo[];
}

export const useTodoStore = create<TodoState>()(
  persist(
    (set, get) => ({
      todos: [],
      inputValue: '',
      sortBy: 'createdAt',
      
      // Sync state initialization
      syncing: false,
      syncError: null,
      lastSyncTime: null,
      offlineQueue: [],
      

      
      // Network state initialization
      networkStatus: networkMonitor.getStatus(),
      autoSyncEnabled: true,
      
      setTodos: (todos) => set({ todos }),
      
      setInputValue: (inputValue) => set({ inputValue }),
      
      setSortBy: (sortBy) => set({ sortBy }),
      
      // Sync todos from Supabase with conflict resolution
      syncTodos: async () => {
        try {
          set({ syncing: true, syncError: null });
          
          const isAvailable = await todoService.isAvailable();
          if (!isAvailable) {
            throw new Error('User not authenticated');
          }
          
          const remoteTodos = await todoService.getTodosWithMetadata();
          const localTodos = get().todos;
          
          // Resolve conflicts between local and remote todos
          const resolvedTodos = get().resolveConflicts(localTodos, remoteTodos || []);
          
          set({ 
            todos: resolvedTodos,
            syncing: false,
            lastSyncTime: new Date(),
            syncError: null
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to sync todos';
          set({ 
            syncing: false, 
            syncError: errorMessage 
          });
          throw error;
        }
      },
      
      // Sync individual todo operation
      syncTodo: async (todo: Todo) => {
        try {
          set({ syncing: true, syncError: null });
          
          const isAvailable = await todoService.isAvailable();
          if (!isAvailable) {
            // Queue operation for later sync
            get().queueOperation({
              type: 'update',
              todo,
              timestamp: new Date(),
              retryCount: 0
            });
            set({ syncing: false });
            return;
          }
          
          // Determine if this is a new todo (timestamp-based ID) or existing (UUID from server)
          const isNewTodo = todo.id.match(/^\d+$/); // Timestamp-based IDs are numeric strings
          
          if (isNewTodo) {
            // Create new todo
            const createdTodo = await todoService.createTodo({
              text: todo.text,
              completed: todo.completed,
              priority: todo.priority,
              createdAt: todo.createdAt
            });
            
            set((state) => ({
              todos: state.todos.map(t => t.id === todo.id ? createdTodo : t),
              syncing: false,
              lastSyncTime: new Date(),
              syncError: null
            }));
          } else {
            // Update existing todo
            const updatedTodo = await todoService.updateTodo(todo.id, {
              text: todo.text,
              completed: todo.completed,
              priority: todo.priority
            });
            
            set((state) => ({
              todos: state.todos.map(t => t.id === todo.id ? updatedTodo : t),
              syncing: false,
              lastSyncTime: new Date(),
              syncError: null
            }));
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to sync todo';
          
          // Queue operation for retry
          get().queueOperation({
            type: 'update',
            todo,
            timestamp: new Date(),
            retryCount: 0
          });
          
          set({ 
            syncing: false, 
            syncError: errorMessage 
          });
          throw error;
        }
      },
      
      // Handle real-time updates from Supabase
      handleRealtimeUpdate: (payload: RealtimePayload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        switch (eventType) {
          case 'INSERT':
            if (newRecord) {
              const newTodo: Todo = {
                id: newRecord.id,
                text: newRecord.text,
                completed: newRecord.completed,
                priority: newRecord.priority,
                createdAt: new Date(newRecord.created_at)
              };
              
              set((state) => {
                // Avoid duplicates
                const exists = state.todos.some(t => t.id === newTodo.id);
                if (exists) return state;
                
                return {
                  todos: [...state.todos, newTodo],
                  lastSyncTime: new Date()
                };
              });
            }
            break;
            
          case 'UPDATE':
            if (newRecord) {
              const updatedTodo: Todo = {
                id: newRecord.id,
                text: newRecord.text,
                completed: newRecord.completed,
                priority: newRecord.priority,
                createdAt: new Date(newRecord.created_at)
              };
              
              set((state) => ({
                todos: state.todos.map(t => 
                  t.id === updatedTodo.id ? updatedTodo : t
                ),
                lastSyncTime: new Date()
              }));
            }
            break;
            
          case 'DELETE':
            if (oldRecord) {
              set((state) => ({
                todos: state.todos.filter(t => t.id !== oldRecord.id),
                lastSyncTime: new Date()
              }));
            }
            break;
        }
      },
      
      // Queue operation for offline sync
      queueOperation: (operation: TodoOperation) => {
        set((state) => ({
          offlineQueue: [...state.offlineQueue, operation]
        }));
      },
      
      // Process queued operations with enhanced conflict resolution
      processSyncQueue: async () => {
        const { offlineQueue } = get();
        
        if (offlineQueue.length === 0) return;
        
        try {
          set({ syncing: true, syncError: null });
          
          const isAvailable = await todoService.isAvailable();
          if (!isAvailable) {
            throw new Error('User not authenticated');
          }
          
          // Get current remote state for conflict resolution
          const remoteTodos = await todoService.getTodos();
          const localTodos = get().todos;
          
          // Resolve conflicts before processing queue
          const resolvedTodos = get().resolveConflicts(localTodos, remoteTodos || []);
          
          // Update local state with resolved todos
          set({ todos: resolvedTodos });
          
          // Filter queue to only include operations that are still relevant
          const relevantQueue = offlineQueue.filter(op => {
            // Remove operations for todos that no longer exist locally
            if (op.type === 'update' || op.type === 'delete') {
              return resolvedTodos.some(todo => todo.id === op.todo.id);
            }
            return true; // Keep create operations
          });
          
          if (relevantQueue.length > 0) {
            await todoService.batchSync(relevantQueue);
          }
          
          // Clear queue on success
          set({ 
            offlineQueue: [],
            syncing: false,
            lastSyncTime: new Date(),
            syncError: null
          });
          
          // Refresh todos to get final state after sync
          await get().syncTodos();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to process sync queue';
          
          // Increment retry count for failed operations, but cap at max retries
          const MAX_RETRIES = 3;
          const updatedQueue = offlineQueue
            .map(op => ({
              ...op,
              retryCount: op.retryCount + 1
            }))
            .filter(op => op.retryCount <= MAX_RETRIES); // Remove operations that have exceeded max retries
          
          set({ 
            offlineQueue: updatedQueue,
            syncing: false, 
            syncError: errorMessage 
          });
          throw error;
        }
      },
      
      // Initialize network monitoring and auto-sync
      initializeNetworkMonitoring: () => {
        // Subscribe to network status changes
        networkMonitor.subscribe((status) => {
          get().handleNetworkStatusChange(status);
        });
        
        // Set initial network status
        set({ networkStatus: networkMonitor.getStatus() });
      },
      
      // Handle network status changes and trigger auto-sync
      handleNetworkStatusChange: (status: NetworkStatus) => {
        const previousStatus = get().networkStatus;
        set({ networkStatus: status });
        
        // If we just came back online and auto-sync is enabled
        if (!previousStatus.isOnline && status.isOnline && get().autoSyncEnabled) {
          // Delay sync slightly to allow network to stabilize
          setTimeout(() => {
            const { offlineQueue } = get();
            if (offlineQueue.length > 0) {
              get().processSyncQueue().catch((error) => {
                console.warn('Auto-sync failed after coming online:', error);
              });
            } else {
              // Even if no queue, sync to get latest remote changes
              get().syncTodos().catch((error) => {
                console.warn('Auto-sync failed after coming online:', error);
              });
            }
          }, 1000); // 1 second delay
        }
      },
      
      // Resolve conflicts between local and remote todos using server timestamps
      resolveConflicts: (localTodos: Todo[], remoteTodos: Todo[]) => {
        // Handle null/undefined inputs
        const safeLLocalTodos = localTodos || [];
        const safeRemoteTodos = remoteTodos || [];
        
        const resolvedTodos: Todo[] = [];
        const remoteMap = new Map(safeRemoteTodos.map(todo => [todo.id, todo]));
        const localMap = new Map(safeLLocalTodos.map(todo => [todo.id, todo]));
        
        // Process all unique todo IDs
        const allIds = new Set([
          ...safeLLocalTodos.map(t => t.id),
          ...safeRemoteTodos.map(t => t.id)
        ]);
        
        for (const id of allIds) {
          const localTodo = localMap.get(id);
          const remoteTodo = remoteMap.get(id);
          
          if (localTodo && remoteTodo) {
            // Both exist - resolve conflict using server timestamp (last-write-wins)
            // Remote todos from server have updated_at, local todos might not
            const remoteUpdatedAt = (remoteTodo as Todo & { updated_at?: string }).updated_at 
              ? new Date((remoteTodo as Todo & { updated_at: string }).updated_at) 
              : remoteTodo.createdAt;
            
            const localUpdatedAt = (localTodo as Todo & { updated_at?: string }).updated_at 
              ? new Date((localTodo as Todo & { updated_at: string }).updated_at) 
              : localTodo.createdAt;
            
            // Use remote version if it's newer, otherwise keep local
            if (remoteUpdatedAt >= localUpdatedAt) {
              resolvedTodos.push(remoteTodo);
            } else {
              resolvedTodos.push(localTodo);
            }
          } else if (remoteTodo) {
            // Only exists remotely - add it
            resolvedTodos.push(remoteTodo);
          } else if (localTodo) {
            // Only exists locally - keep it (will be synced later)
            resolvedTodos.push(localTodo);
          }
        }
        
        return resolvedTodos;
      },
      

      
      // Enable/disable auto-sync
      setAutoSync: (enabled: boolean) => {
        set({ autoSyncEnabled: enabled });
      },
      
      addTodo: (text, priority) => {
        const newTodo: Todo = {
          id: Date.now().toString(),
          text: text.trim(),
          completed: false,
          createdAt: new Date(),
          priority,
        };
        
        set((state) => ({
          todos: [...state.todos, newTodo],
          inputValue: '', // Clear input after adding
        }));
        
        // Attempt to sync with Supabase
        get().syncTodo(newTodo).catch(() => {
          // Error handling is done in syncTodo method
          // Todo is already added to local state for offline support
        });
      },
      
      toggleTodo: (id) => {
        let updatedTodo: Todo | undefined;
        
        set((state) => {
          const newTodos = state.todos.map((todo) => {
            if (todo.id === id) {
              updatedTodo = { ...todo, completed: !todo.completed };
              return updatedTodo;
            }
            return todo;
          });
          
          return { todos: newTodos };
        });
        
        // Attempt to sync with Supabase
        if (updatedTodo) {
          get().syncTodo(updatedTodo).catch(() => {
            // Error handling is done in syncTodo method
            // Todo is already updated in local state for offline support
          });
        }
      },
      
      deleteTodo: (id) => {
        const todoToDelete = get().todos.find(todo => todo.id === id);
        
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
        }));
        
        // Attempt to sync deletion with Supabase
        if (todoToDelete) {
          todoService.deleteTodo(id).catch(() => {
            // Queue deletion for later sync
            get().queueOperation({
              type: 'delete',
              todo: todoToDelete,
              timestamp: new Date(),
              retryCount: 0
            });
          });
        }
      },
      
      updateTodo: (id, updates) => {
        let updatedTodo: Todo | undefined;
        
        set((state) => {
          const newTodos = state.todos.map((todo) => {
            if (todo.id === id) {
              updatedTodo = { ...todo, ...updates };
              return updatedTodo;
            }
            return todo;
          });
          
          return { todos: newTodos };
        });
        
        // Attempt to sync with Supabase
        if (updatedTodo) {
          get().syncTodo(updatedTodo).catch(() => {
            // Error handling is done in syncTodo method
            // Todo is already updated in local state for offline support
          });
        }
      },
      
      getSortedTodos: () => {
        const { todos, sortBy } = get();
        const pendingTodos = todos.filter((todo) => !todo.completed);
        const completedTodos = todos.filter((todo) => todo.completed);
        
        const sortedPending = sortTodos(pendingTodos, sortBy);
        
        return [...sortedPending, ...completedTodos];
      },
    }),
    {
      name: 'todo-storage',
      partialize: (state) => ({ 
        todos: state.todos,
        sortBy: state.sortBy,
        offlineQueue: state.offlineQueue,
        lastSyncTime: state.lastSyncTime,
        autoSyncEnabled: state.autoSyncEnabled
      }),
    }
  )
);

// Initialize network monitoring when the module loads
if (typeof window !== 'undefined') {
  // Only initialize in browser environment
  useTodoStore.getState().initializeNetworkMonitoring();
}