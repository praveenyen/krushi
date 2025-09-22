import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { authService } from '../authService'
import { supabase } from '../supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'

// Mock the supabase client
vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      refreshSession: vi.fn(),
    },
  },
}))

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
  },
  writable: true,
})

describe('AuthService', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: {
      name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2023-01-01T00:00:00Z',
  }

  const mockSession: Session = {
    access_token: 'access-token-123',
    refresh_token: 'refresh-token-123',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: mockUser,
  }

  const mockAuthError: AuthError = {
    name: 'AuthError',
    message: 'Authentication failed',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('signInWithGoogle', () => {
    it('should initiate Google OAuth flow successfully', async () => {
      const mockSupabaseAuth = vi.mocked(supabase.auth)
      mockSupabaseAuth.signInWithOAuth.mockResolvedValue({
        data: { provider: 'google', url: 'https://oauth-url' },
        error: null,
      })

      const result = await authService.signInWithGoogle()

      expect(mockSupabaseAuth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      expect(result).toEqual({
        user: null,
        session: null,
        error: null,
      })
    })

    it('should handle Google OAuth errors', async () => {
      const mockSupabaseAuth = vi.mocked(supabase.auth)
      mockSupabaseAuth.signInWithOAuth.mockResolvedValue({
        data: { provider: null, url: null },
        error: mockAuthError,
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await authService.signInWithGoogle()

      expect(result).toEqual({
        user: null,
        session: null,
        error: mockAuthError,
      })

      expect(consoleSpy).toHaveBeenCalledWith('Google sign-in error:', mockAuthError)
      consoleSpy.mockRestore()
    })

    it('should handle unexpected errors', async () => {
      const mockSupabaseAuth = vi.mocked(supabase.auth)
      const unexpectedError = new Error('Network error')
      mockSupabaseAuth.signInWithOAuth.mockRejectedValue(unexpectedError)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await authService.signInWithGoogle()

      expect(result).toEqual({
        user: null,
        session: null,
        error: unexpectedError,
      })

      expect(consoleSpy).toHaveBeenCalledWith('Unexpected error during Google sign-in:', unexpectedError)
      consoleSpy.mockRestore()
    })
  })

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      const mockSupabaseAuth = vi.mocked(supabase.auth)
      mockSupabaseAuth.signOut.mockResolvedValue({ error: null })

      const result = await authService.signOut()

      expect(mockSupabaseAuth.signOut).toHaveBeenCalled()
      expect(result).toEqual({ error: null })
    })

    it('should handle sign-out errors', async () => {
      const mockSupabaseAuth = vi.mocked(supabase.auth)
      mockSupabaseAuth.signOut.mockResolvedValue({ error: mockAuthError })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await authService.signOut()

      expect(result).toEqual({ error: mockAuthError })
      expect(consoleSpy).toHaveBeenCalledWith('Sign-out error:', mockAuthError)
      consoleSpy.mockRestore()
    })

    it('should handle unexpected errors during sign-out', async () => {
      const mockSupabaseAuth = vi.mocked(supabase.auth)
      const unexpectedError = new Error('Network error')
      mockSupabaseAuth.signOut.mockRejectedValue(unexpectedError)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await authService.signOut()

      expect(result).toEqual({ error: unexpectedError })
      expect(consoleSpy).toHaveBeenCalledWith('Unexpected error during sign-out:', unexpectedError)
      consoleSpy.mockRestore()
    })
  })

  describe('getCurrentUser', () => {
    it('should return current user when authenticated', () => {
      const mockSupabaseAuth = vi.mocked(supabase.auth)
      mockSupabaseAuth.getUser.mockReturnValue({
        data: { user: mockUser },
        error: null,
      })

      const result = authService.getCurrentUser()

      expect(mockSupabaseAuth.getUser).toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })

    it('should return null when not authenticated', () => {
      const mockSupabaseAuth = vi.mocked(supabase.auth)
      mockSupabaseAuth.getUser.mockReturnValue({
        data: { user: null },
        error: null,
      })

      const result = authService.getCurrentUser()

      expect(result).toBeNull()
    })
  })

  describe('getCurrentSession', () => {
    it('should return current session when active', () => {
      const mockSupabaseAuth = vi.mocked(supabase.auth)
      mockSupabaseAuth.getSession.mockReturnValue({
        data: { session: mockSession },
        error: null,
      })

      const result = authService.getCurrentSession()

      expect(mockSupabaseAuth.getSession).toHaveBeenCalled()
      expect(result).toEqual(mockSession)
    })

    it('should return null when no active session', () => {
      const mockSupabaseAuth = vi.mocked(supabase.auth)
      mockSupabaseAuth.getSession.mockReturnValue({
        data: { session: null },
        error: null,
      })

      const result = authService.getCurrentSession()

      expect(result).toBeNull()
    })
  })

  describe('onAuthStateChange', () => {
    it('should subscribe to auth state changes and return unsubscribe function', () => {
      const mockSupabaseAuth = vi.mocked(supabase.auth)
      const mockUnsubscribe = vi.fn()
      const mockSubscription = { unsubscribe: mockUnsubscribe }
      
      mockSupabaseAuth.onAuthStateChange.mockReturnValue({
        data: { subscription: mockSubscription },
        error: null,
      })

      const callback = vi.fn()
      const unsubscribe = authService.onAuthStateChange(callback)

      expect(mockSupabaseAuth.onAuthStateChange).toHaveBeenCalledWith(expect.any(Function))
      expect(typeof unsubscribe).toBe('function')

      // Test unsubscribe function
      unsubscribe()
      expect(mockUnsubscribe).toHaveBeenCalled()
    })

    it('should call callback when auth state changes', () => {
      const mockSupabaseAuth = vi.mocked(supabase.auth)
      let authCallback: (event: string, session: Session | null) => void

      mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
          error: null,
        }
      })

      const callback = vi.fn()
      authService.onAuthStateChange(callback)

      // Simulate auth state change
      authCallback!('SIGNED_IN', mockSession)

      expect(callback).toHaveBeenCalledWith('SIGNED_IN', mockSession)
    })
  })

  describe('refreshSession', () => {
    it('should refresh session successfully', async () => {
      const mockSupabaseAuth = vi.mocked(supabase.auth)
      mockSupabaseAuth.refreshSession.mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      })

      const result = await authService.refreshSession()

      expect(mockSupabaseAuth.refreshSession).toHaveBeenCalled()
      expect(result).toEqual({
        session: mockSession,
        error: null,
      })
    })

    it('should handle refresh session errors', async () => {
      const mockSupabaseAuth = vi.mocked(supabase.auth)
      mockSupabaseAuth.refreshSession.mockResolvedValue({
        data: { session: null, user: null },
        error: mockAuthError,
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await authService.refreshSession()

      expect(result).toEqual({
        session: null,
        error: mockAuthError,
      })

      expect(consoleSpy).toHaveBeenCalledWith('Session refresh error:', mockAuthError)
      consoleSpy.mockRestore()
    })

    it('should handle unexpected errors during session refresh', async () => {
      const mockSupabaseAuth = vi.mocked(supabase.auth)
      const unexpectedError = new Error('Network error')
      mockSupabaseAuth.refreshSession.mockRejectedValue(unexpectedError)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await authService.refreshSession()

      expect(result).toEqual({
        session: null,
        error: unexpectedError,
      })

      expect(consoleSpy).toHaveBeenCalledWith('Unexpected error during session refresh:', unexpectedError)
      consoleSpy.mockRestore()
    })
  })

  describe('isSessionValid', () => {
    it('should return true for valid session', () => {
      const mockSupabaseAuth = vi.mocked(supabase.auth)
      const validSession = {
        ...mockSession,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      }
      
      mockSupabaseAuth.getSession.mockReturnValue({
        data: { session: validSession },
        error: null,
      })

      const result = authService.isSessionValid()

      expect(result).toBe(true)
    })

    it('should return false for expired session', () => {
      const mockSupabaseAuth = vi.mocked(supabase.auth)
      const expiredSession = {
        ...mockSession,
        expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      }
      
      mockSupabaseAuth.getSession.mockReturnValue({
        data: { session: expiredSession },
        error: null,
      })

      const result = authService.isSessionValid()

      expect(result).toBe(false)
    })

    it('should return false when no session', () => {
      const mockSupabaseAuth = vi.mocked(supabase.auth)
      mockSupabaseAuth.getSession.mockReturnValue({
        data: { session: null },
        error: null,
      })

      const result = authService.isSessionValid()

      expect(result).toBe(false)
    })

    it('should return true for session without expires_at', () => {
      const mockSupabaseAuth = vi.mocked(supabase.auth)
      const sessionWithoutExpiry = {
        ...mockSession,
        expires_at: undefined,
      }
      
      mockSupabaseAuth.getSession.mockReturnValue({
        data: { session: sessionWithoutExpiry },
        error: null,
      })

      const result = authService.isSessionValid()

      expect(result).toBe(true)
    })
  })

  describe('getUserMetadata', () => {
    it('should return user metadata when user is authenticated', () => {
      const mockSupabaseAuth = vi.mocked(supabase.auth)
      mockSupabaseAuth.getUser.mockReturnValue({
        data: { user: mockUser },
        error: null,
      })

      const result = authService.getUserMetadata()

      expect(result).toEqual(mockUser.user_metadata)
    })

    it('should return null when no user', () => {
      const mockSupabaseAuth = vi.mocked(supabase.auth)
      mockSupabaseAuth.getUser.mockReturnValue({
        data: { user: null },
        error: null,
      })

      const result = authService.getUserMetadata()

      expect(result).toBeNull()
    })

    it('should return null when user has no metadata', () => {
      const mockSupabaseAuth = vi.mocked(supabase.auth)
      const userWithoutMetadata = { ...mockUser, user_metadata: undefined }
      mockSupabaseAuth.getUser.mockReturnValue({
        data: { user: userWithoutMetadata },
        error: null,
      })

      const result = authService.getUserMetadata()

      expect(result).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated with valid session', () => {
      const mockSupabaseAuth = vi.mocked(supabase.auth)
      const validSession = {
        ...mockSession,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }
      
      mockSupabaseAuth.getUser.mockReturnValue({
        data: { user: mockUser },
        error: null,
      })
      mockSupabaseAuth.getSession.mockReturnValue({
        data: { session: validSession },
        error: null,
      })

      const result = authService.isAuthenticated()

      expect(result).toBe(true)
    })

    it('should return false when user is not authenticated', () => {
      const mockSupabaseAuth = vi.mocked(supabase.auth)
      mockSupabaseAuth.getUser.mockReturnValue({
        data: { user: null },
        error: null,
      })
      mockSupabaseAuth.getSession.mockReturnValue({
        data: { session: null },
        error: null,
      })

      const result = authService.isAuthenticated()

      expect(result).toBe(false)
    })

    it('should return false when session is expired', () => {
      const mockSupabaseAuth = vi.mocked(supabase.auth)
      const expiredSession = {
        ...mockSession,
        expires_at: Math.floor(Date.now() / 1000) - 3600,
      }
      
      mockSupabaseAuth.getUser.mockReturnValue({
        data: { user: mockUser },
        error: null,
      })
      mockSupabaseAuth.getSession.mockReturnValue({
        data: { session: expiredSession },
        error: null,
      })

      const result = authService.isAuthenticated()

      expect(result).toBe(false)
    })
  })
})