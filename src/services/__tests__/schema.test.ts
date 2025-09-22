import { describe, it, expect } from 'vitest'
import type { Database, TimerConfig } from '../../types/supabase'

describe('Database Schema Types', () => {
  it('should have correct todo table structure', () => {
    // Test that the types are properly defined
    const todoRow: Database['public']['Tables']['todos']['Row'] = {
      id: 'test-id',
      user_id: 'user-id',
      text: 'Test todo',
      completed: false,
      priority: 'medium',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    }

    expect(todoRow.id).toBe('test-id')
    expect(todoRow.priority).toBe('medium')
    expect(['low', 'medium', 'high']).toContain(todoRow.priority)
  })

  it('should have correct user_profiles table structure', () => {
    const timerConfig: TimerConfig = {
      defaultDuration: 5,
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsUntilLongBreak: 4
    }

    const userProfileRow: Database['public']['Tables']['user_profiles']['Row'] = {
      id: 'user-id',
      theme: 'system',
      timer_config: timerConfig,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    }

    expect(userProfileRow.id).toBe('user-id')
    expect(userProfileRow.theme).toBe('system')
    expect(['light', 'dark', 'system']).toContain(userProfileRow.theme)
    expect(userProfileRow.timer_config.defaultDuration).toBe(5)
  })

  it('should have correct insert types', () => {
    const todoInsert: Database['public']['Tables']['todos']['Insert'] = {
      user_id: 'user-id',
      text: 'New todo',
      // Optional fields can be omitted
    }

    expect(todoInsert.user_id).toBe('user-id')
    expect(todoInsert.text).toBe('New todo')
  })

  it('should have correct update types', () => {
    const todoUpdate: Database['public']['Tables']['todos']['Update'] = {
      text: 'Updated todo',
      completed: true,
      priority: 'high'
      // All fields are optional in updates
    }

    expect(todoUpdate.text).toBe('Updated todo')
    expect(todoUpdate.completed).toBe(true)
    expect(todoUpdate.priority).toBe('high')
  })

  it('should have timer config with all required fields', () => {
    const timerConfig: TimerConfig = {
      defaultDuration: 5,
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsUntilLongBreak: 4
    }

    // Verify all required fields exist
    expect(typeof timerConfig.defaultDuration).toBe('number')
    expect(typeof timerConfig.workDuration).toBe('number')
    expect(typeof timerConfig.shortBreakDuration).toBe('number')
    expect(typeof timerConfig.longBreakDuration).toBe('number')
    expect(typeof timerConfig.sessionsUntilLongBreak).toBe('number')
  })
})