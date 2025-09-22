import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the supabase client
vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    }))
  }
}))

import { testSupabaseConnection, logSupabaseHealth } from '../supabaseHealth'
import { supabase } from '../supabase'

const mockSupabase = supabase as {
  auth: {
    getSession: ReturnType<typeof vi.fn>
  }
  from: ReturnType<typeof vi.fn>
}

describe('Supabase Health Check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  describe('testSupabaseConnection', () => {
    it('should return success when auth and database are accessible', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: null, error: null })
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })

      const result = await testSupabaseConnection()

      expect(result.success).toBe(true)
      expect(result.message).toContain('successful')
    })

    it('should handle auth connection errors', async () => {
      const authError = { message: 'Auth connection failed' }
      mockSupabase.auth.getSession.mockResolvedValue({ data: null, error: authError })

      const result = await testSupabaseConnection()

      expect(result.success).toBe(false)
      expect(result.message).toContain('Failed to connect to Supabase Auth')
      expect(result.details).toBe(authError)
    })

    it('should handle table not existing as success', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: null, error: null })
      const dbError = { message: 'relation "public.todos" does not exist' }
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: null, error: dbError }))
        }))
      })

      const result = await testSupabaseConnection()

      expect(result.success).toBe(true)
      expect(result.message).toContain('schema not yet created')
    })

    it('should handle database connection errors', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: null, error: null })
      const dbError = { message: 'Database connection failed' }
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: null, error: dbError }))
        }))
      })

      const result = await testSupabaseConnection()

      expect(result.success).toBe(false)
      expect(result.message).toContain('Database connection failed')
      expect(result.details).toBe(dbError)
    })

    it('should handle unexpected errors', async () => {
      mockSupabase.auth.getSession.mockRejectedValue(new Error('Unexpected error'))

      const result = await testSupabaseConnection()

      expect(result.success).toBe(false)
      expect(result.message).toContain('Unexpected error')
    })
  })

  describe('logSupabaseHealth', () => {
    it('should log success message', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: null, error: null })
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })

      await logSupabaseHealth()

      expect(console.log).toHaveBeenCalledWith('🔍 Testing Supabase connection...')
      expect(console.log).toHaveBeenCalledWith('✅', expect.stringContaining('successful'))
    })

    it('should log error message with details', async () => {
      const authError = { message: 'Auth failed' }
      mockSupabase.auth.getSession.mockResolvedValue({ data: null, error: authError })

      await logSupabaseHealth()

      expect(console.log).toHaveBeenCalledWith('🔍 Testing Supabase connection...')
      expect(console.log).toHaveBeenCalledWith('❌', expect.stringContaining('Failed to connect'))
      expect(console.log).toHaveBeenCalledWith('Details:', authError)
    })
  })
})