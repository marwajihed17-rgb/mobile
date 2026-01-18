-- ============================================
-- CREATE CUSTOMERS TABLE
-- ============================================
-- This migration creates a unified customers table
-- that stores all customer data from both Salam and Mobily projects

-- Create project_type enum
DO $$ BEGIN
    CREATE TYPE project_type AS ENUM ('salam', 'mobily');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_type project_type NOT NULL,

    -- Common fields (required for all projects)
    name TEXT NOT NULL,
    identity_number TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    sim_number TEXT NOT NULL,
    device_number TEXT NOT NULL,
    nationality TEXT NOT NULL,
    register_number TEXT NOT NULL,

    -- Mobily-specific fields (nullable for Salam project)
    birth_date TEXT,
    identity_expiry_date TEXT,
    package TEXT,
    email TEXT,
    city TEXT,
    district TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Unique constraint: identity_number must be unique per project_type
    UNIQUE(identity_number, project_type)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_project_type ON public.customers(project_type);
CREATE INDEX IF NOT EXISTS idx_customers_identity_number ON public.customers(identity_number);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_project_created ON public.customers(project_type, created_at DESC);

-- Create trigger to auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete own customers" ON public.customers;

-- Users can view all customers (they need to see entries from all users)
CREATE POLICY "Users can view all customers"
    ON public.customers FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Users can insert customers
CREATE POLICY "Users can insert customers"
    ON public.customers FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Users can update their own customers, admins can update all
CREATE POLICY "Users can update own customers"
    ON public.customers FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Users can delete their own customers, admins can delete all
CREATE POLICY "Users can delete own customers"
    ON public.customers FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if customer exists
CREATE OR REPLACE FUNCTION public.check_customer_exists(
    p_identity_number TEXT,
    p_project_type project_type
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.customers
        WHERE identity_number = p_identity_number
        AND project_type = p_project_type
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent customers by project
CREATE OR REPLACE FUNCTION public.get_recent_customers(
    p_project_type project_type,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    project_type project_type,
    name TEXT,
    identity_number TEXT,
    phone_number TEXT,
    sim_number TEXT,
    device_number TEXT,
    nationality TEXT,
    register_number TEXT,
    birth_date TEXT,
    identity_expiry_date TEXT,
    package TEXT,
    email TEXT,
    city TEXT,
    district TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.user_id,
        c.project_type,
        c.name,
        c.identity_number,
        c.phone_number,
        c.sim_number,
        c.device_number,
        c.nationality,
        c.register_number,
        c.birth_date,
        c.identity_expiry_date,
        c.package,
        c.email,
        c.city,
        c.district,
        c.created_at,
        c.updated_at
    FROM public.customers c
    WHERE c.project_type = p_project_type
    ORDER BY c.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON public.customers TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_customer_exists TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_customers TO authenticated;
