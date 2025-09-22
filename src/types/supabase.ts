// Database types for Supabase integration
export interface Database {
  public: {
    Tables: {
      todos: {
        Row: {
          id: string
          user_id: string
          text: string
          completed: boolean
          priority: 'low' | 'medium' | 'high'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          text: string
          completed?: boolean
          priority?: 'low' | 'medium' | 'high'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          text?: string
          completed?: boolean
          priority?: 'low' | 'medium' | 'high'
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          theme: 'light' | 'dark' | 'system'
          timer_config: TimerConfig
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          theme?: 'light' | 'dark' | 'system'
          timer_config?: TimerConfig
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          theme?: 'light' | 'dark' | 'system'
          timer_config?: TimerConfig
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_updated_at_column: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Timer configuration interface to match the JSONB structure
export interface TimerConfig {
  defaultDuration: number
  workDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  sessionsUntilLongBreak: number
}