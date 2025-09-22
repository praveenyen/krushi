import { supabase } from './supabase';
import type { Database } from '../types/supabase';
import type { Todo } from '../types/todo';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Database row type for todos
type TodoRow = Database['public']['Tables']['todos']['Row'];
type TodoInsert = Database['public']['Tables']['todos']['Insert'];
type TodoUpdate = Database['public']['Tables']['todos']['Update'];

// Realtime payload type
export type RealtimePayload = RealtimePostgresChangesPayload<TodoRow>;

// Batch operation interface for offline sync
export interface TodoOperation {
  type: 'create' | 'update' | 'delete';
  todo: Todo;
  timestamp: Date;
  retryCount: number;
}

// Convert database row to Todo interface
function dbRowToTodo(row: TodoRow): Todo & { updated_at?: Date } {
  return {
    id: row.id,
    text: row.text,
    completed: row.completed,
    priority: row.priority,
    createdAt: new Date(row.created_at),
    updated_at: row.updated_at ? new Date(row.updated_at) : undefined,
    // Note: Timer-related fields are not stored in database yet
    // They will be added in future tasks
  };
}

// Convert Todo to database insert format
function todoToDbInsert(todo: Omit<Todo, 'id'>, userId: string): TodoInsert {
  return {
    user_id: userId,
    text: todo.text,
    completed: todo.completed,
    priority: todo.priority,
    created_at: todo.createdAt.toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// Convert Todo updates to database update format
function todoToDbUpdate(updates: Partial<Todo>): TodoUpdate {
  const dbUpdate: TodoUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (updates.text !== undefined) dbUpdate.text = updates.text;
  if (updates.completed !== undefined) dbUpdate.completed = updates.completed;
  if (updates.priority !== undefined) dbUpdate.priority = updates.priority;

  return dbUpdate;
}

export class TodoService {
  /**
   * Create a new todo in Supabase
   */
  async createTodo(todo: Omit<Todo, 'id'>): Promise<Todo> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const todoInsert = todoToDbInsert(todo, user.id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('todos')
      .insert(todoInsert)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create todo: ${error.message}`);
    }

    return dbRowToTodo(data);
  }

  /**
   * Get all todos for the authenticated user
   */
  async getTodos(userId?: string): Promise<Todo[]> {
    return this.getTodosWithMetadata(userId);
  }

  /**
   * Update an existing todo
   */
  async updateTodo(id: string, updates: Partial<Todo>): Promise<Todo> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const dbUpdate = todoToDbUpdate(updates);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('todos')
      .update(dbUpdate)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only update their own todos
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update todo: ${error.message}`);
    }

    if (!data) {
      throw new Error('Todo not found or access denied');
    }

    return dbRowToTodo(data);
  }

  /**
   * Delete a todo
   */
  async deleteTodo(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Ensure user can only delete their own todos

    if (error) {
      throw new Error(`Failed to delete todo: ${error.message}`);
    }
  }

  /**
   * Batch sync operations for offline queue processing
   */
  async batchSync(operations: TodoOperation[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const results = await Promise.allSettled(
      operations.map(async (operation) => {
        switch (operation.type) {
          case 'create':
            return this.createTodo({
              text: operation.todo.text,
              completed: operation.todo.completed,
              priority: operation.todo.priority,
              createdAt: operation.todo.createdAt,
            });

          case 'update':
            return this.updateTodo(operation.todo.id, {
              text: operation.todo.text,
              completed: operation.todo.completed,
              priority: operation.todo.priority,
            });

          case 'delete':
            return this.deleteTodo(operation.todo.id);

          default:
            throw new Error(`Unknown operation type: ${(operation as { type: string }).type}`);
        }
      })
    );

    // Check for any failures
    const failures = results
      .map((result, index) => ({ result, operation: operations[index] }))
      .filter(({ result }) => result.status === 'rejected');

    if (failures.length > 0) {
      const errorMessages = failures.map(({ result, operation }) =>
        `${operation.type} operation failed: ${(result as PromiseRejectedResult).reason}`
      );
      throw new Error(`Batch sync partially failed: ${errorMessages.join(', ')}`);
    }
  }

  /**
   * Subscribe to real-time todo changes
   */
  subscribeToTodos(
    userId: string,
    callback: (payload: RealtimePayload) => void
  ): () => void {
    const channel = supabase
      .channel('todos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Get a single todo by ID
   */
  async getTodo(id: string): Promise<Todo | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to fetch todo: ${error.message}`);
    }

    return dbRowToTodo(data);
  }

  /**
   * Check if the service is available (user is authenticated)
   */
  async isAvailable(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return !!user;
    } catch {
      return false;
    }
  }

  /**
   * Get todos with conflict detection metadata
   */
  async getTodosWithMetadata(userId?: string): Promise<(Todo & { updated_at?: Date })[]> {
    let targetUserId = userId;

    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      targetUserId = user.id;
    }

    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch todos: ${error.message}`);
    }

    return data.map(dbRowToTodo);
  }

  /**
   * Check network connectivity to Supabase
   */
  async checkConnectivity(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('todos')
        .select('count')
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const todoService = new TodoService();