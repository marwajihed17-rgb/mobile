-- ============================================
-- Migration: Add operator and activation status columns
-- Date: 2026-01-26
-- Description: Add operator_id, operator_name, and activation_status
--              columns to salam_customers and mobily_customers tables
-- ============================================

-- Create activation_status enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE activation_status AS ENUM ('activated', 'activating');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- Add columns to salam_customers table
-- ============================================

-- Add operator_id column
ALTER TABLE public.salam_customers
ADD COLUMN IF NOT EXISTS operator_id TEXT;

-- Add operator_name column
ALTER TABLE public.salam_customers
ADD COLUMN IF NOT EXISTS operator_name TEXT;

-- Add activation_status column
ALTER TABLE public.salam_customers
ADD COLUMN IF NOT EXISTS activation_status TEXT;

-- ============================================
-- Add columns to mobily_customers table
-- ============================================

-- Add operator_id column
ALTER TABLE public.mobily_customers
ADD COLUMN IF NOT EXISTS operator_id TEXT;

-- Add operator_name column
ALTER TABLE public.mobily_customers
ADD COLUMN IF NOT EXISTS operator_name TEXT;

-- Add activation_status column
ALTER TABLE public.mobily_customers
ADD COLUMN IF NOT EXISTS activation_status TEXT;

-- ============================================
-- Create indexes for better query performance
-- ============================================

-- Indexes for salam_customers
CREATE INDEX IF NOT EXISTS idx_salam_customers_operator_id
ON public.salam_customers(operator_id);

CREATE INDEX IF NOT EXISTS idx_salam_customers_activation_status
ON public.salam_customers(activation_status);

-- Indexes for mobily_customers
CREATE INDEX IF NOT EXISTS idx_mobily_customers_operator_id
ON public.mobily_customers(operator_id);

CREATE INDEX IF NOT EXISTS idx_mobily_customers_activation_status
ON public.mobily_customers(activation_status);

-- ============================================
-- Create operators table if it doesn't exist
-- ============================================

CREATE TABLE IF NOT EXISTS public.operators (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert default operators if table is empty
INSERT INTO public.operators (id, name, is_active)
VALUES
    ('salam', 'سلام', true),
    ('mobily', 'موبايلي', true),
    ('zain', 'زين', true),
    ('stc', 'stc', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on operators table
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;

-- Create policy for operators table
DROP POLICY IF EXISTS "Anyone can view operators" ON public.operators;
CREATE POLICY "Anyone can view operators"
    ON public.operators FOR SELECT
    USING (true);

-- Grant permissions
GRANT SELECT ON public.operators TO authenticated;
GRANT SELECT ON public.operators TO anon;

-- ============================================
-- Verification query (for testing)
-- ============================================
-- You can run this to verify the columns were added:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'salam_customers'
--   AND column_name IN ('operator_id', 'operator_name', 'activation_status');
