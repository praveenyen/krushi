-- Create function to calculate balance summaries for money tracker
-- This function aggregates transaction data to provide balance information per person

CREATE OR REPLACE FUNCTION get_balance_summaries()
RETURNS TABLE (
    person_id UUID,
    person_name VARCHAR(255),
    total_credit DECIMAL(10,2),
    total_debit DECIMAL(10,2),
    net_balance DECIMAL(10,2),
    last_transaction_date TIMESTAMPTZ,
    transaction_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as person_id,
        p.name as person_name,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'credit' THEN t.amount ELSE 0 END), 0) as total_credit,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'debit' THEN t.amount ELSE 0 END), 0) as total_debit,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'credit' THEN t.amount ELSE -t.amount END), 0) as net_balance,
        MAX(t.transaction_date) as last_transaction_date,
        COUNT(t.id) as transaction_count
    FROM persons p
    LEFT JOIN transactions t ON p.id = t.person_id AND t.user_id = auth.uid()
    WHERE p.user_id = auth.uid()
    GROUP BY p.id, p.name
    HAVING COUNT(t.id) > 0  -- Only include persons with transactions
    ORDER BY ABS(COALESCE(SUM(CASE WHEN t.transaction_type = 'credit' THEN t.amount ELSE -t.amount END), 0)) DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_balance_summaries() TO authenticated;

-- Create a helper function to get balance for a specific person
CREATE OR REPLACE FUNCTION get_person_balance(person_uuid UUID)
RETURNS TABLE (
    person_id UUID,
    person_name VARCHAR(255),
    total_credit DECIMAL(10,2),
    total_debit DECIMAL(10,2),
    net_balance DECIMAL(10,2),
    last_transaction_date TIMESTAMPTZ,
    transaction_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as person_id,
        p.name as person_name,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'credit' THEN t.amount ELSE 0 END), 0) as total_credit,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'debit' THEN t.amount ELSE 0 END), 0) as total_debit,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'credit' THEN t.amount ELSE -t.amount END), 0) as net_balance,
        MAX(t.transaction_date) as last_transaction_date,
        COUNT(t.id) as transaction_count
    FROM persons p
    LEFT JOIN transactions t ON p.id = t.person_id AND t.user_id = auth.uid()
    WHERE p.user_id = auth.uid() AND p.id = person_uuid
    GROUP BY p.id, p.name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_person_balance(UUID) TO authenticated;