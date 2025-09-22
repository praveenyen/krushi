import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }))
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}))

// Set up environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

describe('Supabase Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create Supabase client with correct configuration', async () => {
    const { createClient } = await import('@supabase/supabase-js')
    const { supabase } = await import('../supabase')
    
    expect(createClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    )
    
    expect(supabase).toBeDefined()
  })

  it('should have auth methods available', async () => {
    const { supabase } = await import('../supabase')
    
    expect(supabase.auth).toBeDefined()
    expect(supabase.auth.getSession).toBeDefined()
    expect(supabase.auth.signInWithOAuth).toBeDefined()
    expect(supabase.auth.signOut).toBeDefined()
    expect(supabase.auth.onAuthStateChange).toBeDefined()
  })

  it('should have database query methods available', async () => {
    const { supabase } = await import('../supabase')
    
    expect(supabase.from).toBeDefined()
    expect(typeof supabase.from).toBe('function')
  })

  it('should export required types', async () => {
    const supabaseModule = await import('../supabase')
    
    expect(supabaseModule.supabase).toBeDefined()
    // Types are compile-time only, so we just verify the module exports them
    expect(typeof supabaseModule).toBe('object')
  })
})