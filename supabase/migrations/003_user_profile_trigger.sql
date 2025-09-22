-- Function to create user profile automatically when a user signs up
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, theme, timer_config)
    VALUES (
        NEW.id,
        'system',
        '{"defaultDuration": 5, "workDuration": 25, "shortBreakDuration": 5, "longBreakDuration": 15, "sessionsUntilLongBreak": 4}'::jsonb
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to automatically create user profile on user signup
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();