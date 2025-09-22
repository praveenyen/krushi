-- Enable Row Level Security on todos table
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy for todos table - users can only access their own todos
CREATE POLICY "Users can only access their own todos" ON todos
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policy for user_profiles table - users can only access their own profile
CREATE POLICY "Users can only access their own profile" ON user_profiles
    FOR ALL USING (auth.uid() = id);

-- Additional policies for more granular control

-- Allow users to insert their own todos
CREATE POLICY "Users can insert their own todos" ON todos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own todos
CREATE POLICY "Users can update their own todos" ON todos
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own todos
CREATE POLICY "Users can delete their own todos" ON todos
    FOR DELETE USING (auth.uid() = user_id);

-- Allow users to select their own todos
CREATE POLICY "Users can select their own todos" ON todos
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow users to select their own profile
CREATE POLICY "Users can select their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow users to delete their own profile (for account deletion)
CREATE POLICY "Users can delete their own profile" ON user_profiles
    FOR DELETE USING (auth.uid() = id);