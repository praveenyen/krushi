# Todo App Design Document

## Overview

The todo app will be built as a React component integrated into the existing Next.js application. It will feature a clean, modern interface with real-time updates and localStorage persistence. The app will be self-contained and can be easily integrated into the existing page structure.

## Architecture

The application follows a component-based architecture with a split layout design:

```
TodoApp (Main Container - Split Layout)
├── Left Half
│   ├── App Header (Title and description)
│   └── TodoStats (Progress overview)
└── Right Half
    ├── TodoInput (Add new todos with priority)
    └── TodoList (List container with sorting)
        └── TodoItem (Individual todo items with priority indicators)
└── LocalStorage Service (Data persistence)
└── Sorting Utilities (Todo sorting logic)
```

## Components and Interfaces

### TodoApp Component
- **Purpose**: Main container component with split layout and state management
- **Layout**: Two equal halves (50/50 split)
- **State**: 
  - `todos: Todo[]` - Array of todo items
  - `inputValue: string` - Current input field value
  - `sortBy: SortBy` - Current sorting method ('timestamp' | 'priority' | 'alphabetical')
- **Methods**:
  - `addTodo(text: string, priority: Priority)` - Creates new todo item with priority
  - `toggleTodo(id: string)` - Toggles completion status
  - `deleteTodo(id: string)` - Removes todo item
  - `setSortBy(sortBy: SortBy)` - Updates sorting method
  - `loadTodos()` - Loads todos from localStorage
  - `saveTodos(todos: Todo[])` - Saves todos to localStorage
- **Computed Properties**:
  - `sortedTodos` - Todos sorted according to current sortBy setting

### TodoInput Component
- **Purpose**: Input field with priority selection and add button
- **Props**: 
  - `value: string` - Current input value
  - `onChange: (value: string) => void` - Input change handler
  - `onSubmit: (text: string, priority: Priority) => void` - Form submission handler
- **State**:
  - `priority: Priority` - Currently selected priority (defaults to 'medium')
- **Features**: 
  - Enter key support, input validation
  - Priority selection buttons with visual indicators
  - Priority reset to default after submission

### TodoStats Component
- **Purpose**: Displays todo statistics
- **Props**: `todos: Todo[]` - Array of todos for calculation
- **Displays**: Total count, completed count, remaining count

### TodoList Component
- **Purpose**: Container for todo items with sorting controls
- **Props**: 
  - `todos: Todo[]` - Array of sorted todos to display
  - `onToggle: (id: string) => void` - Toggle handler
  - `onDelete: (id: string) => void` - Delete handler
  - `onSort: (sortBy: SortBy) => void` - Sort method change handler
  - `sortBy: SortBy` - Current sorting method
- **Features**:
  - Sorting control buttons (Recent, Priority, A-Z)
  - Separate sections for active and completed todos
  - Visual indicators for current sort method

### TodoItem Component
- **Purpose**: Individual todo item with priority indicators
- **Props**:
  - `todo: Todo` - Todo item data (including priority)
  - `onToggle: () => void` - Toggle completion handler
  - `onDelete: () => void` - Delete handler
- **Features**: 
  - Checkbox, text display, delete button, completed styling
  - Priority indicator dot (colored circle)
  - Priority badge with text label
  - Color coding: High (red), Medium (yellow), Low (green)

## Data Models

### Todo Interface
```typescript
interface Todo {
  id: string;                           // Unique identifier (UUID or timestamp)
  text: string;                         // Todo item text
  completed: boolean;                   // Completion status
  createdAt: string;                    // Creation timestamp (ISO string)
  priority: 'low' | 'medium' | 'high';  // Priority level
}

type SortBy = 'timestamp' | 'priority' | 'alphabetical';
type Priority = 'low' | 'medium' | 'high';
```

### LocalStorage Schema
- **Key**: `todos`
- **Value**: JSON stringified array of Todo objects
- **Fallback**: Empty array if no data exists or parsing fails
- **Migration**: Existing todos without priority field get default 'medium' priority

### Sorting Logic

#### Sort Methods
1. **Timestamp** (default): Sort by `createdAt` descending (newest first)
2. **Priority**: Sort by priority level (high → medium → low), then by timestamp
3. **Alphabetical**: Sort by `text` ascending (A-Z)

#### Sort Behavior
- Only pending (incomplete) todos are sorted
- Completed todos always appear at the bottom in their original order
- Sort state is maintained in component state (not persisted)
- Priority order: High (3) > Medium (2) > Low (1)

## Error Handling

### LocalStorage Operations
- **Read Errors**: If localStorage is unavailable or data is corrupted, fall back to empty array
- **Write Errors**: If localStorage write fails, continue with in-memory state but show warning
- **JSON Parsing**: Wrap JSON operations in try-catch blocks

### Input Validation
- **Empty Input**: Prevent creation of todos with empty or whitespace-only text
- **Text Length**: Optional maximum length validation (e.g., 500 characters)

### State Management
- **ID Conflicts**: Use timestamp-based IDs to prevent conflicts
- **State Consistency**: Ensure localStorage is updated after every state change

## Testing Strategy

### Unit Tests
- **Todo Operations**: Test add, toggle, delete functionality
- **LocalStorage Service**: Test save/load operations with mocked localStorage
- **Input Validation**: Test edge cases for todo creation
- **State Management**: Test state updates and persistence

### Integration Tests
- **Component Interaction**: Test communication between parent and child components
- **LocalStorage Integration**: Test full persistence workflow
- **User Workflows**: Test complete user scenarios (add → complete → delete)

### Manual Testing Scenarios
1. **Basic CRUD Operations**: Add, complete, delete todos
2. **Persistence**: Refresh page and verify todos remain
3. **Edge Cases**: Empty input, very long text, rapid clicking
4. **Browser Compatibility**: Test localStorage across different browsers

## Styling Approach

### CSS Framework
- Use Tailwind CSS (already configured in the project)
- Responsive design for mobile and desktop
- Clean, modern interface with good contrast

### Visual Design
- **Layout**: Split layout with two equal halves (50/50)
  - Left: App header and progress overview (centered)
  - Right: Todo input and list (functional area)
- **Colors**: Use existing theme colors, subtle backgrounds
- **Priority Colors**: 
  - High: Red (#EF4444 / #DC2626)
  - Medium: Yellow (#EAB308 / #CA8A04)  
  - Low: Green (#22C55E / #16A34A)
- **Typography**: Clear, readable fonts with appropriate sizing
- **Interactive Elements**: Hover states, focus indicators
- **Completed Items**: Strikethrough text, muted colors
- **Sorting Controls**: Button group with active state indicators

### Accessibility
- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Ensure sufficient contrast ratios
- **Focus Management**: Clear focus indicators