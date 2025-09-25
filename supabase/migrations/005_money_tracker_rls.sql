-- Enable Row Level Security on money tracker tables
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for persons table
-- Users can only access their own persons
CREATE POLICY "Users can only access their own persons" ON persons
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own persons" ON persons
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own persons" ON persons
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own persons" ON persons
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can select their own persons" ON persons
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for transactions table
-- Users can only access their own transactions
CREATE POLICY "Users can only access their own transactions" ON transactions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" ON transactions
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can select their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);