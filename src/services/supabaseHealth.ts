import { supabase } from './supabase'

/**
 * Test basic connectivity to Supabase
 * This function attempts to perform a simple query to verify the connection
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean
  message: string
  details?: unknown
}> {
  try {
    // Test basic connection by trying to get the current session
    const { data: session, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return {
        success: false,
        message: 'Failed to connect to Supabase Auth',
        details: sessionError
      }
    }

    // Test database connection by attempting a simple query
    // This will fail if the database is not accessible, but that's expected without proper setup
    const { error: dbError } = await supabase
      .from('todos')
      .select('count')
      .limit(1)

    // If we get a specific error about the table not existing, that's actually good
    // It means we can connect to the database, just the schema isn't set up yet
    if (dbError && dbError.message.includes('relation "public.todos" does not exist')) {
      return {
        success: true,
        message: 'Supabase connection successful (database schema not yet created)',
        details: { session: session ? 'Session available' : 'No active session' }
      }
    }

    // If we get other database errors, report them
    if (dbError) {
      return {
        success: false,
        message: 'Database connection failed',
        details: dbError
      }
    }

    return {
      success: true,
      message: 'Supabase connection and database access successful',
      details: { session: session ? 'Session available' : 'No active session' }
    }
  } catch (error) {
    return {
      success: false,
      message: 'Unexpected error testing Supabase connection',
      details: error
    }
  }
}

/**
 * Simple health check that can be used in development
 */
export async function logSupabaseHealth(): Promise<void> {
  console.log('🔍 Testing Supabase connection...')
  const result = await testSupabaseConnection()
  
  if (result.success) {
    console.log('✅', result.message)
  } else {
    console.log('❌', result.message)
    if (result.details) {
      console.log('Details:', result.details)
    }
  }
}