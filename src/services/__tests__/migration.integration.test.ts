import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { saveTodos, loadTodos, clearTodos } from '../localStorage'
import { Todo } from '../../types/todo'

describe('localStorage migration integration tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    clearTodos()
  })

  afterEach(() => {
    // Clean up after each test
    clearTodos()
  })

  it('should migrate legacy todos without priority field in real localStorage', () => {
    // Simulate legacy data by directly setting localStorage with todos without priority
    const legacyTodos = [
      {
        id: '1',
        text: 'Legacy todo 1',
        completed: false,
        createdAt: '2023-01-01T00:00:00.000Z',
      },
      {
        id: '2',
        text: 'Legacy todo 2',
        completed: true,
        createdAt: '2023-01-02T00:00:00.000Z',
      },
    ]

    // Directly set legacy data in localStorage
    localStorage.setItem('todos', JSON.stringify(legacyTodos))

    // Load todos - this should trigger migration
    const loadedTodos = loadTodos()

    // Verify migration was successful
    expect(loadedTodos).toHaveLength(2)
    expect(loadedTodos[0].priority).toBe('medium')
    expect(loadedTodos[1].priority).toBe('medium')
    expect(loadedTodos[0].text).toBe('Legacy todo 1')
    expect(loadedTodos[1].text).toBe('Legacy todo 2')

    // Verify the migrated data was saved back to localStorage
    const savedData = localStorage.getItem('todos')
    expect(savedData).toBeTruthy()
    
    const parsedSavedData = JSON.parse(savedData!)
    expect(parsedSavedData[0].priority).toBe('medium')
    expect(parsedSavedData[1].priority).toBe('medium')
  })

  it('should handle mixed legacy and new data correctly', () => {
    // Simulate mixed data - some with priority, some without
    const mixedTodos = [
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
        text: 'Another new todo',
        completed: true,
        createdAt: '2023-01-03T00:00:00.000Z',
        priority: 'low',
      },
    ]

    localStorage.setItem('todos', JSON.stringify(mixedTodos))

    const loadedTodos = loadTodos()

    expect(loadedTodos).toHaveLength(3)
    expect(loadedTodos[0].priority).toBe('high') // unchanged
    expect(loadedTodos[1].priority).toBe('medium') // migrated
    expect(loadedTodos[2].priority).toBe('low') // unchanged
  })

  it('should not affect todos that already have valid priority fields', () => {
    // Create todos with valid priority fields
    const validTodos: Todo[] = [
      {
        id: '1',
        text: 'High priority todo',
        completed: false,
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        priority: 'high',
      },
      {
        id: '2',
        text: 'Low priority todo',
        completed: true,
        createdAt: new Date('2023-01-02T00:00:00.000Z'),
        priority: 'low',
      },
    ]

    // Save using the service (this will stringify dates properly)
    saveTodos(validTodos)

    // Load back - no migration should occur
    const loadedTodos = loadTodos()

    expect(loadedTodos).toHaveLength(2)
    expect(loadedTodos[0].priority).toBe('high')
    expect(loadedTodos[1].priority).toBe('low')
    expect(loadedTodos[0].text).toBe('High priority todo')
    expect(loadedTodos[1].text).toBe('Low priority todo')
  })

  it('should handle invalid priority values by migrating to medium', () => {
    const todosWithInvalidPriority = [
      {
        id: '1',
        text: 'Todo with invalid priority',
        completed: false,
        createdAt: '2023-01-01T00:00:00.000Z',
        priority: 'urgent', // Invalid priority
      },
      {
        id: '2',
        text: 'Todo with another invalid priority',
        completed: false,
        createdAt: '2023-01-02T00:00:00.000Z',
        priority: 'critical', // Invalid priority
      },
    ]

    localStorage.setItem('todos', JSON.stringify(todosWithInvalidPriority))

    const loadedTodos = loadTodos()

    expect(loadedTodos).toHaveLength(2)
    expect(loadedTodos[0].priority).toBe('medium')
    expect(loadedTodos[1].priority).toBe('medium')
  })
})