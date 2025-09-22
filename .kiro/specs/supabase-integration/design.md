# Supabase Integration Design Document

## Overview

This design extends the existing todo application with Supabase integration to provide cloud-based authentication, data persistence, and settings synchronization. The integration will maintain the current Zustand-based architecture while adding Supabase services for authentication, real-time database operations, and user profile management.

## Architecture

The enhanced architecture introduces Supabase services while preserving the existing component structure:

```
Application Layer
├── Authentication Layer (Supabase Auth)
│   ├── AuthProvider (React Context)
│   ├── AuthGuard (Route Protection)
│   └── SignIn/SignOut Components
├── Data Layer
│   ├── Existing Zustand Stores (Enhanced)
│   │   ├── todoStore (+ Supabase sync)
│   │   ├── timerStore (+ Supabase sync)
│   │   └── themeStore (+ Supabase sync)
│   └── Supabase Services
│       ├── authService (Authentication)
│       ├── todoService (CRUD operations)
│       ├── userProfileService (Settings sync)
│       └── realtimeService (Live updates)
├── Existing UI Components (Unchanged)
└── Offline/Sync Layer
    ├── syncQueue (Offline operations)
    └── conflictResolver (Data conflicts)
```

## Components and Interfaces

### Authentication Components

#### AuthProvider
- **Purpose**: Manages authentication state and provides auth context
- **State**:
  - `user: User | null` - Current authenticated user
  - `session: Session | null` - Current session
  - `loading: boolean` - Authentication loading state
  - `error: string | null` - Authentication errors
- **Methods**:
  - `signInWithGoogle()` - Initiate Google OAuth
  - `signOut()` - Clear session and sign out
  - `refreshSession()` - Refresh expired session
- **Integration**: Wraps the entire app, provides auth context

#### AuthGuard
- **Purpose**: Protects routes and handles authentication flow
- **Props**: `children: ReactNode` - Protected content
- **Behavior**: 
  - Shows sign-in screen for unauthenticated users
  - Shows loading spinner during auth checks
  - Renders protected content for authenticated users

#### SignInPage
- **Purpose**: Authentication interface with Google sign-in
- **Features**:
  - Google OAuth button
  - Loading states
  - Error handling
  - Branding and welcome message

### Enhanced Store Interfaces

#### Enhanced TodoStore
```typescript
interface TodoStore extends ExistingTodoStore {
  // Sync state
  syncing: boolean;
  syncError: string | null;
  lastSyncTime: Date | null;
  offlineQueue: TodoOperation[];
  
  // Enhanced actions
  syncTodos: () => Promise<void>;
  syncTodo: (todo: Todo) => Promise<void>;
  handleRealtimeUpdate: (payload: RealtimePayload) => void;
  migrateFromLocalStorage: () => Promise<void>;
  
  // Offline support
  queueOperation: (operation: TodoOperation) => void;
  processSyncQueue: () => Promise<void>;
}
```

#### Enhanced TimerStore
```typescript
interface TimerStore extends ExistingTimerStore {
  // Sync state
  syncing: boolean;
  syncError: string | null;
  
  // Enhanced actions
  syncConfig: () => Promise<void>;
  updateConfigWithSync: (config: Partial<TimerConfig>) => Promise<void>;
}
```

#### New UserProfileStore
```typescript
interface UserProfileStore {
  profile: UserProfile | null;
  syncing: boolean;
  syncError: string | null;
  
  // Actions
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  syncTheme: (theme: Theme) => Promise<void>;
  syncTimerConfig: (config: TimerConfig) => Promise<void>;
}
```

### Service Layer

#### AuthService
```typescript
interface AuthService {
  signInWithGoogle(): Promise<AuthResponse>;
  signOut(): Promise<void>;
  getCurrentUser(): User | null;
  getCurrentSession(): Session | null;
  onAuthStateChange(callback: (event: AuthChangeEvent) => void): () => void;
  refreshSession(): Promise<Session>;
}
```

#### TodoService
```typescript
interface TodoService {
  // CRUD operations
  createTodo(todo: Omit<Todo, 'id'>): Promise<Todo>;
  getTodos(userId: string): Promise<Todo[]>;
  updateTodo(id: string, updates: Partial<Todo>): Promise<Todo>;
  deleteTodo(id: string): Promise<void>;
  
  // Batch operations
  batchSync(operations: TodoOperation[]): Promise<void>;
  
  // Real-time subscriptions
  subscribeToTodos(userId: string, callback: (payload: RealtimePayload) => void): () => void;
}
```

#### UserProfileService
```typescript
interface UserProfileService {
  getProfile(userId: string): Promise<UserProfile>;
  updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile>;
  createProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile>;
}
```

## Data Models

### Database Schema

#### todos table
```sql
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_todos_user_id ON todos(user_id),
  INDEX idx_todos_created_at ON todos(created_at),
  INDEX idx_todos_priority ON todos(priority)
);
```

#### user_profiles table
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT CHECK (theme IN ('light', 'dark', 'system')) DEFAULT 'system',
  timer_config JSONB DEFAULT '{"defaultDuration": 5}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### TypeScript Interfaces

#### Enhanced Todo Interface
```typescript
interface Todo {
  id: string;
  user_id?: string;        // Added for Supabase
  text: string;
  completed: boolean;
  priority: TodoPriority;
  created_at: Date;
  updated_at?: Date;       // Added for Supabase
  timerStatus?: TimerStatus;
  timerStartTime?: Date;
  timerDuration?: number;
  
  // Sync metadata
  _localId?: string;       // For offline operations
  _pendingSync?: boolean;  // Indicates pending sync
}
```

#### UserProfile Interface
```typescript
interface UserProfile {
  id: string;
  theme: Theme;
  timer_config: TimerConfig;
  created_at: Date;
  updated_at: Date;
}
```

#### Sync Operation Interface
```typescript
interface TodoOperation {
  type: 'create' | 'update' | 'delete';
  todo: Todo;
  timestamp: Date;
  retryCount: number;
}
```

## Authentication Flow

### Sign-In Process
1. User clicks "Sign in with Google"
2. Redirect to Supabase Auth with Google provider
3. Google OAuth flow completes
4. Supabase creates/updates user record
5. Session established, user redirected to app
6. AuthProvider updates context with user/session
7. Trigger data migration from localStorage (if needed)
8. Load user profile and sync settings

### Session Management
- Automatic session refresh before expiration
- Persistent sessions across browser restarts
- Graceful handling of expired sessions
- Sign-out clears all local state and redirects

## Data Synchronization Strategy

### Real-time Updates
- Subscribe to todo changes using Supabase Realtime
- Handle incoming changes by updating local store
- Conflict resolution using server-side timestamps
- Optimistic updates with rollback on failure

### Offline Support
- Queue operations when offline using local storage
- Detect online/offline status
- Process sync queue when connection restored
- Handle conflicts with last-write-wins strategy

### Migration Strategy
1. **First Sign-in**: Migrate existing localStorage todos to Supabase
2. **Conflict Resolution**: Merge local and remote todos by timestamp
3. **Data Cleanup**: Clear localStorage after successful migration
4. **Fallback**: Keep local data if migration fails

## Error Handling

### Authentication Errors
- **OAuth Failures**: Show retry button with error message
- **Session Expiry**: Automatic refresh with fallback to re-authentication
- **Network Issues**: Offline mode with sync when reconnected

### Database Errors
- **Connection Issues**: Queue operations for later sync
- **Validation Errors**: Show user-friendly messages
- **Conflict Errors**: Use server data as source of truth
- **Rate Limiting**: Implement exponential backoff

### Sync Errors
- **Partial Sync Failures**: Retry failed operations individually
- **Data Corruption**: Validate data integrity before sync
- **Version Conflicts**: Use timestamp-based resolution

## Security Considerations

### Row Level Security (RLS)
```sql
-- Todos table RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own todos" ON todos
  FOR ALL USING (auth.uid() = user_id);

-- User profiles table RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);
```

### Data Validation
- Server-side validation for all todo operations
- Input sanitization for text fields
- Type checking for priority and status fields
- Rate limiting for API operations

### Privacy
- No PII stored beyond what Google OAuth provides
- User data isolated by user_id
- Secure session management
- Optional data export/deletion

## Performance Optimizations

### Database Optimizations
- Indexes on frequently queried columns
- Pagination for large todo lists
- Efficient real-time subscriptions
- Connection pooling

### Client-side Optimizations
- Optimistic updates for better UX
- Debounced sync operations
- Lazy loading of non-critical data
- Efficient re-rendering with Zustand

### Caching Strategy
- Local storage for offline access
- In-memory caching for frequently accessed data
- Stale-while-revalidate for user profiles
- Cache invalidation on real-time updates

## Testing Strategy

### Unit Tests
- **Service Layer**: Mock Supabase client for isolated testing
- **Store Logic**: Test sync operations and state management
- **Authentication**: Test auth flows with mocked providers
- **Offline Logic**: Test queue operations and conflict resolution

### Integration Tests
- **Auth Flow**: End-to-end authentication testing
- **Data Sync**: Test real-time updates and offline sync
- **Migration**: Test localStorage to Supabase migration
- **Error Scenarios**: Test network failures and recovery

### Manual Testing Scenarios
1. **Multi-device Sync**: Changes appear across devices
2. **Offline Usage**: App works without internet
3. **Migration**: Existing users don't lose data
4. **Performance**: App remains responsive during sync
5. **Error Recovery**: Graceful handling of failures

## Migration and Deployment

### Environment Setup
- Supabase project configuration
- Environment variables for API keys
- Database schema deployment
- RLS policy setup

### Feature Flags
- Gradual rollout of Supabase features
- Fallback to localStorage if Supabase unavailable
- A/B testing for migration strategies

### Monitoring
- Authentication success/failure rates
- Sync operation performance
- Error tracking and alerting
- User adoption metrics