/**
 * Manual demonstration of localStorage migration functionality
 * This file can be used to manually test the migration logic
 */

import { loadTodos, clearTodos } from '../localStorage'

// Demo function to show migration in action
export function demonstrateMigration() {
  console.log('=== localStorage Migration Demo ===\n')

  // Clear any existing data
  clearTodos()
  console.log('1. Cleared existing localStorage data')

  // Simulate legacy data (without priority field)
  const legacyData = [
    {
      id: '1',
      text: 'Legacy todo from old version',
      completed: false,
      createdAt: '2023-01-01T00:00:00.000Z',
    },
    {
      id: '2', 
      text: 'Another legacy todo',
      completed: true,
      createdAt: '2023-01-02T00:00:00.000Z',
    },
  ]

  // Directly set legacy data in localStorage (simulating old app version)
  localStorage.setItem('todos', JSON.stringify(legacyData))
  console.log('2. Set legacy data in localStorage (without priority field):')
  console.log(JSON.stringify(legacyData, null, 2))

  // Load todos - this should trigger migration
  console.log('\n3. Loading todos (migration should occur)...')
  const migratedTodos = loadTodos()

  console.log('4. Migration complete! Loaded todos:')
  console.log(JSON.stringify(migratedTodos.map(todo => ({
    ...todo,
    createdAt: todo.createdAt.toISOString() // Convert Date back to string for display
  })), null, 2))

  // Verify the data was saved back to localStorage
  const savedData = localStorage.getItem('todos')
  console.log('\n5. Data saved back to localStorage:')
  console.log(savedData)

  // Test with mixed data
  console.log('\n=== Mixed Data Test ===')
  const mixedData = [
    {
      id: '1',
      text: 'New todo with priority',
      completed: false,
      createdAt: '2023-01-01T00:00:00.000Z',
      priority: 'high',
    },
    {
      id: '2',
      text: 'Legacy todo without priority',
      completed: false,
      createdAt: '2023-01-02T00:00:00.000Z',
    },
    {
      id: '3',
      text: 'Todo with invalid priority',
      completed: false,
      createdAt: '2023-01-03T00:00:00.000Z',
      priority: 'urgent', // Invalid priority
    },
  ]

  localStorage.setItem('todos', JSON.stringify(mixedData))
  console.log('6. Set mixed data (some with priority, some without, some invalid):')
  console.log(JSON.stringify(mixedData, null, 2))

  console.log('\n7. Loading mixed data (migration should occur for items without/invalid priority)...')
  const mixedResult = loadTodos()

  console.log('8. Mixed data migration complete:')
  console.log(JSON.stringify(mixedResult.map(todo => ({
    ...todo,
    createdAt: todo.createdAt.toISOString()
  })), null, 2))

  // Clean up
  clearTodos()
  console.log('\n9. Demo complete - localStorage cleared')
}

// Uncomment the line below to run the demo
// demonstrateMigration()