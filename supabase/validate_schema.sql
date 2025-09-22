-- Schema Validation Script
-- Run this script to validate that the database schema is set up correctly

-- Check if tables exist
SELECT 
    'todos' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'todos') 
         THEN '✓ EXISTS' 
         ELSE '✗ MISSING' 
    END as status
UNION ALL
SELECT 
    'user_profiles' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') 
         THEN '✓ EXISTS' 
         ELSE '✗ MISSING' 
    END as status;

-- Check if indexes exist
SELECT 
    indexname as index_name,
    tablename as table_name,
    '✓ EXISTS' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('todos', 'user_profiles')
ORDER BY tablename, indexname;

-- Check if RLS is enabled
SELECT 
    tablename as table_name,
    CASE WHEN rowsecurity THEN '✓ ENABLED' ELSE '✗ DISABLED' END as rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public' 
AND tablename IN ('todos', 'user_profiles');

-- Check if policies exist
SELECT 
    tablename as table_name,
    policyname as policy_name,
    '✓ EXISTS' as status
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('todos', 'user_profiles')
ORDER BY tablename, policyname;

-- Check if functions exist
SELECT 
    routine_name as function_name,
    '✓ EXISTS' as status
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('update_updated_at_column', 'create_user_profile');

-- Check if triggers exist
SELECT 
    trigger_name,
    event_object_table as table_name,
    '✓ EXISTS' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND event_object_table IN ('todos', 'user_profiles')
ORDER BY event_object_table, trigger_name;