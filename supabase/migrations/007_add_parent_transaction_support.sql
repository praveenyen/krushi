-- Add parent transaction support for linked transactions
-- This allows tracking relationships between transactions (e.g., borrowing and repaying)

-- Add parent_transaction_id column to transactions table
ALTER TABLE transactions 
ADD COLUMN parent_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL;

-- Create index for performance optimization
CREATE INDEX IF NOT EXISTS idx_transactions_parent ON transactions(parent_transaction_id);

-- Add constraint to prevent circular references (a transaction cannot reference itself)
ALTER TABLE transactions 
ADD CONSTRAINT chk_no_self_reference 
CHECK (id != parent_transaction_id);