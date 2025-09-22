# Supabase Database Schema

This directory contains the SQL files needed to set up the database schema for the todo application with Supabase integration.

## Files

- `setup.sql` - Complete database setup script (recommended for new projects)
- `migrations/001_initial_schema.sql` - Initial table creation and indexes
- `migrations/002_row_level_security.sql` - Row Level Security policies
- `migrations/003_user_profile_trigger.sql` - Automatic user profile creation

## Quick Setup

### Option 1: Using the Complete Setup Script

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `setup.sql`
4. Run the script

### Option 2: Using Individual Migration Files

Run the migration files in order:

1. `001_initial_schema.sql` - Creates tables, indexes, and update triggers
2. `002_row_level_security.sql` - Sets up Row Level Security policies
3. `003_user_profile_trigger.sql` - Creates automatic user profile creation

## Database Schema

### Tables

#### `todos`
- `id` (UUID, Primary Key) - Unique identifier for each todo
- `user_id` (UUID, Foreign Key) - References auth.users(id)
- `text` (TEXT) - Todo content
- `completed` (BOOLEAN) - Completion status
- `priority` (TEXT) - Priority level ('low', 'medium', 'high')
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

#### `user_profiles`
- `id` (UUID, Primary Key) - References auth.users(id)
- `theme` (TEXT) - Theme preference ('light', 'dark', 'system')
- `timer_config` (JSONB) - Timer configuration settings
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

### Security

Row Level Security (RLS) is enabled on both tables with policies that ensure:
- Users can only access their own todos
- Users can only access their own profile
- All CRUD operations are restricted to the authenticated user's data

### Automatic Features

- **Updated At Timestamps**: Automatically updated on record changes
- **User Profile Creation**: Automatically creates a user profile when a user signs up
- **Data Integrity**: Foreign key constraints ensure data consistency
- **Performance**: Indexes on frequently queried columns

## Environment Variables

Make sure your `.env.local` file contains:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing the Schema

After running the setup, you can test the schema by:

1. Creating a test user through Supabase Auth
2. Verifying that a user profile is automatically created
3. Testing CRUD operations on todos through the SQL editor
4. Confirming that RLS policies prevent access to other users' data