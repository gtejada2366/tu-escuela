-- Migration: Add online payment support (Culqi gateway)
-- Run in Supabase SQL Editor

-- 1. Add new columns to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('manual', 'online'));
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- 2. Set existing payments as manual
UPDATE payments SET payment_method = 'manual' WHERE paid_date IS NOT NULL AND payment_method IS NULL;

-- 3. Add RLS policy for parents to read their children's payments
CREATE POLICY "Payments: parent reads own" ON payments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = payments.student_id
    AND s.parent_email = (SELECT email FROM profiles WHERE id = auth.uid())
  )
);

-- 4. Add index for transaction lookups
CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id) WHERE transaction_id IS NOT NULL;
