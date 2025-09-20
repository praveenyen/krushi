import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveTodos, loadTodos, clearTodos, isLocalStorageAvailable } from '../localStorage'
import { Todo } from '../../types/todo'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

describe('localStorage service', () => {
  const mockTodos: Todo[] = [
    {
      id: '1',
      text: 'Test todo 1',
      completed: false,
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      priority: 'medium',
    },
    {
      id: '2',
      text: 'Test todo 2',
      completed: true,
      createdAt: new Date('2023-01-02T00:00:00.000Z'),
      priority: 'high',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset console methods to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  describe('saveTodos', () => {
    it('should save todos to localStorage successfully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {})
      
      const result = saveTodos(mockTodos)
      
      expect(result).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'todos',
        JSON.stringify(mockTodos)
      )
    })

    it('should return false and log error when localStorage.setItem throws', () => {
      const error = new Error('Storage quota exceeded')
      mockLocalStorage.setItem.mockImplementation(() => {
        throw error
      })
      
      const result = saveTodos(mockTodos)
      
      expect(result).toBe(false)
      expect(console.error).toHaveBeenCalledWith(
        'Failed to save todos to localStorage:',
        error
      )
    })

    it('should handle empty todos array', () => {
      mockLocalStorage.setItem.mockImplementation(() => {})
      
      const result = saveTodos([])
      
      expect(result).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('todos', '[]')
    })
  })

  describe('loadTodos', () => {
    it('should load todos from localStorage successfully', () => {
      const todosJson = JSON.stringify(mockTodos)
      mockLocalStorage.getItem.mockReturnValue(todosJson)
      
      const result = loadTodos()
      
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(mockTodos[0])
      expect(result[1]).toEqual(mockTodos[1])
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('todos')
    })

    it('should return empty array when no data in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const result = loadTodos()
      
      expect(result).toEqual([])
    })

    it('should return empty array when localStorage contains invalid JSON', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json')
      
      const result = loadTodos()
      
      expect(result).toEqual([])
      expect(console.error).toHaveBeenCalledWith(
        'Failed to load todos from localStorage:',
        expect.any(SyntaxError)
      )
    })

    it('should return empty array when localStorage contains non-array data', () => {
      mockLocalStorage.getItem.mockReturnValue('{"not": "an array"}')
      
      const result = loadTodos()
      
      expect(result).toEqual([])
      expect(console.warn).toHaveBeenCalledWith(
        'Invalid todos data in localStorage, returning empty array'
      )
    })

    it('should filter out invalid todo items', () => {
      const invalidTodos = [
        mockTodos[0], // valid
        { id: '2', text: 'Missing completed field' }, // invalid
        mockTodos[1], // valid
        { completed: true, text: 'Missing id field' }, // invalid
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(invalidTodos))
      
      const result = loadTodos()
      
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(mockTodos[0])
      expect(result[1]).toEqual(mockTodos[1])
      expect(console.warn).toHaveBeenCalledTimes(2)
    })

    it('should convert createdAt strings back to Date objects', () => {
      const todosWithStringDates = mockTodos.map(todo => ({
        ...todo,
        createdAt: todo.createdAt.toISOString(),
      }))
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(todosWithStringDates))
      
      const result = loadTodos()
      
      expect(result[0].createdAt).toBeInstanceOf(Date)
      expect(result[1].createdAt).toBeInstanceOf(Date)
      expect(result[0].createdAt.getTime()).toBe(mockTodos[0].createdAt.getTime())
    })

    it('should handle localStorage.getItem throwing an error', () => {
      const error = new Error('localStorage not available')
      mockLocalStorage.getItem.mockImplementation(() => {
        throw error
      })
      
      const result = loadTodos()
      
      expect(result).toEqual([])
      expect(console.error).toHaveBeenCalledWith(
        'Failed to load todos from localStorage:',
        error
      )
    })

    it('should migrate todos without priority field to default medium priority', () => {
      const todosWithoutPriority = [
        {
          id: '1',
          text: 'Test todo 1',
          completed: false,
          createdAt: new Date('2023-01-01T00:00:00.000Z'),
        },
        {
          id: '2',
          text: 'Test todo 2',
          completed: true,
          createdAt: new Date('2023-01-02T00:00:00.000Z'),
        },
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(todosWithoutPriority))
      mockLocalStorage.setItem.mockImplementation(() => {})
      
      const result = loadTodos()
      
      expect(result).toHaveLength(2)
      expect(result[0].priority).toBe('medium')
      expect(result[1].priority).toBe('medium')
      
      // Verify that migrated data is saved back to localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'todos',
        expect.stringContaining('"priority":"medium"')
      )
    })

    it('should migrate todos with invalid priority to medium priority', () => {
      const todosWithInvalidPriority = [
        {
          id: '1',
          text: 'Test todo 1',
          completed: false,
          createdAt: new Date('2023-01-01T00:00:00.000Z'),
          priority: 'invalid',
        },
        {
          id: '2',
          text: 'Test todo 2',
          completed: true,
          createdAt: new Date('2023-01-02T00:00:00.000Z'),
          priority: 'urgent', // Not a valid priority
        },
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(todosWithInvalidPriority))
      mockLocalStorage.setItem.mockImplementation(() => {})
      
      const result = loadTodos()
      
      expect(result).toHaveLength(2)
      expect(result[0].priority).toBe('medium')
      expect(result[1].priority).toBe('medium')
      expect(console.warn).toHaveBeenCalledWith(
        'Invalid priority "invalid" found, setting to medium'
      )
      expect(console.warn).toHaveBeenCalledWith(
        'Invalid priority "urgent" found, setting to medium'
      )
    })

    it('should not perform migration when all todos have valid priority', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockTodos))
      mockLocalStorage.setItem.mockImplementation(() => {})
      
      const result = loadTodos()
      
      expect(result).toHaveLength(2)
      expect(result[0].priority).toBe('medium')
      expect(result[1].priority).toBe('high')
      
      // Verify that no migration save was performed
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
    })

    it('should handle mixed migration scenarios', () => {
      const mixedTodos = [
        {
          id: '1',
          text: 'Todo with valid priority',
          completed: false,
          createdAt: new Date('2023-01-01T00:00:00.000Z'),
          priority: 'high',
        },
        {
          id: '2',
          text: 'Todo without priority',
          completed: false,
          createdAt: new Date('2023-01-02T00:00:00.000Z'),
        },
        {
          id: '3',
          text: 'Todo with invalid priority',
          completed: true,
          createdAt: new Date('2023-01-03T00:00:00.000Z'),
          priority: 'critical',
        },
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mixedTodos))
      mockLocalStorage.setItem.mockImplementation(() => {})
      
      const result = loadTodos()
      
      expect(result).toHaveLength(3)
      expect(result[0].priority).toBe('high') // unchanged
      expect(result[1].priority).toBe('medium') // migrated from missing
      expect(result[2].priority).toBe('medium') // migrated from invalid
      
      // Verify migration was performed and saved
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'todos',
        expect.stringContaining('"priority":"medium"')
      )
    })
  })

  describe('clearTodos', () => {
    it('should clear todos from localStorage successfully', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {})
      
      const result = clearTodos()
      
      expect(result).toBe(true)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('todos')
    })

    it('should return false and log error when localStorage.removeItem throws', () => {
      const error = new Error('localStorage not available')
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw error
      })
      
      const result = clearTodos()
      
      expect(result).toBe(false)
      expect(console.error).toHaveBeenCalledWith(
        'Failed to clear todos from localStorage:',
        error
      )
    })
  })

  describe('isLocalStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      mockLocalStorage.setItem.mockImplementation(() => {})
      mockLocalStorage.removeItem.mockImplementation(() => {})
      
      const result = isLocalStorageAvailable()
      
      expect(result).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        '__localStorage_test__',
        'test'
      )
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('__localStorage_test__')
    })

    it('should return false when localStorage is not available', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage not available')
      })
      
      const result = isLocalStorageAvailable()
      
      expect(result).toBe(false)
    })
  })
})