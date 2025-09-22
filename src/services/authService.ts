import { supabase } from './supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'

export interface AuthResponse {
  user: User | null
  session: Session | null
  error: AuthError | null
}

export interface AuthService {
  signInWithGoogle(): Promise<AuthResponse>
  signOut(): Promise<{ error: AuthError | null }>
  getCurrentUser(): Promise<User | null>
  getCurrentSession(): Promise<Session | null>
  onAuthStateChange(callback: (event: string, session: Session | null) => void): () => void
  refreshSession(): Promise<{ session: Session | null; error: AuthError | null }>
}

class SupabaseAuthService implements AuthService {
  /**
   * Sign in with Google OAuth provider
   * Redirects to Google OAuth flow via Supabase Auth
   */
  async signInWithGoogle(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('Google sign-in error:', error)
        return {
          user: null,
          session: null,
          error,
        }
      }

      // For OAuth, the actual user/session will be available after redirect
      // This method initiates the flow, actual auth state comes via onAuthStateChange
      return {
        user: null,
        session: null,
        error: null,
      }
    } catch (error) {
      console.error('Unexpected error during Google sign-in:', error)
      return {
        user: null,
        session: null,
        error: error as AuthError,
      }
    }
  }

  /**
   * Sign out the current user
   * Clears session and redirects to sign-in screen
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign-out error:', error)
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error('Unexpected error during sign-out:', error)
      return { error: error as AuthError }
    }
  }

  /**
   * Get the current authenticated user
   * Returns null if no user is authenticated
   */
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  /**
   * Get the current session
   * Returns null if no active session
   */
  async getCurrentSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }

  /**
   * Subscribe to authentication state changes
   * Returns unsubscribe function
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session)
    })

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe()
    }
  }

  /**
   * Refresh the current session
   * Handles expired sessions with automatic refresh
   */
  async refreshSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Session refresh error:', error)
        return {
          session: null,
          error,
        }
      }

      return {
        session: data.session,
        error: null,
      }
    } catch (error) {
      console.error('Unexpected error during session refresh:', error)
      return {
        session: null,
        error: error as AuthError,
      }
    }
  }

  /**
   * Check if the current session is valid and not expired
   */
  async isSessionValid(): Promise<boolean> {
    const session = await this.getCurrentSession()
    if (!session) return false

    const now = Math.floor(Date.now() / 1000)
    return session.expires_at ? session.expires_at > now : true
  }

  /**
   * Get user metadata from the current session
   */
  async getUserMetadata(): Promise<Record<string, unknown> | null> {
    const user = await this.getCurrentUser()
    return user?.user_metadata || null
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser()
    const isValid = await this.isSessionValid()
    return user !== null && isValid
  }
}

// Export singleton instance
export const authService = new SupabaseAuthService()

// Export types
export type { User, Session, AuthError } from '@supabase/supabase-js'