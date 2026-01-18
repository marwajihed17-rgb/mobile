-- Migration: Split unified customers table into separate project-specific tables
-- This migration creates separate tables for Salam and Mobily projects

-- ================================================
-- 1. Create salam_customers table
-- ================================================
CREATE TABLE IF NOT EXISTS salam_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Salam-specific fields (7 fields)
    name TEXT NOT NULL,
    identity_number TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    sim_number TEXT NOT NULL,
    device_number TEXT NOT NULL,
    nationality TEXT NOT NULL,
    register_number TEXT NOT NULL,

    -- System fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraint: identity_number must be unique within Salam project
    CONSTRAINT salam_identity_unique UNIQUE (identity_number)
);

-- ================================================
-- 2. Create mobily_customers table
-- ================================================
CREATE TABLE IF NOT EXISTS mobily_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Common fields
    name TEXT NOT NULL,
    identity_number TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    sim_number TEXT NOT NULL,
    device_number TEXT NOT NULL,
    nationality TEXT NOT NULL,
    register_number TEXT NOT NULL,

    -- Mobily-specific additional fields (6 more fields)
    birth_date TEXT NOT NULL,
    identity_expiry_date TEXT NOT NULL,
    package TEXT NOT NULL,
    email TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,

    -- System fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraint: identity_number must be unique within Mobily project
    CONSTRAINT mobily_identity_unique UNIQUE (identity_number)
);

-- ================================================
-- 3. Migrate data from unified customers table
-- ================================================

-- Migrate Salam customers
INSERT INTO salam_customers (
    id,
    user_id,
    name,
    identity_number,
    phone_number,
    sim_number,
    device_number,
    nationality,
    register_number,
    created_at,
    updated_at
)
SELECT
    id,
    user_id,
    name,
    identity_number,
    phone_number,
    sim_number,
    device_number,
    nationality,
    register_number,
    created_at,
    updated_at
FROM customers
WHERE project_type = 'salam';

-- Migrate Mobily customers
INSERT INTO mobily_customers (
    id,
    user_id,
    name,
    identity_number,
    phone_number,
    sim_number,
    device_number,
    nationality,
    register_number,
    birth_date,
    identity_expiry_date,
    package,
    email,
    city,
    district,
    created_at,
    updated_at
)
SELECT
    id,
    user_id,
    name,
    identity_number,
    phone_number,
    sim_number,
    device_number,
    nationality,
    register_number,
    birth_date,
    identity_expiry_date,
    package,
    email,
    city,
    district,
    created_at,
    updated_at
FROM customers
WHERE project_type = 'mobily';

-- ================================================
-- 4. Create indexes for performance
-- ================================================

-- Salam indexes
CREATE INDEX idx_salam_user_id ON salam_customers(user_id);
CREATE INDEX idx_salam_identity_number ON salam_customers(identity_number);
CREATE INDEX idx_salam_created_at ON salam_customers(created_at DESC);

-- Mobily indexes
CREATE INDEX idx_mobily_user_id ON mobily_customers(user_id);
CREATE INDEX idx_mobily_identity_number ON mobily_customers(identity_number);
CREATE INDEX idx_mobily_created_at ON mobily_customers(created_at DESC);

-- ================================================
-- 5. Create updated_at triggers
-- ================================================

-- Trigger for salam_customers
CREATE OR REPLACE FUNCTION update_salam_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_salam_customers_updated_at
    BEFORE UPDATE ON salam_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_salam_customers_updated_at();

-- Trigger for mobily_customers
CREATE OR REPLACE FUNCTION update_mobily_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mobily_customers_updated_at
    BEFORE UPDATE ON mobily_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_mobily_customers_updated_at();

-- ================================================
-- 6. Create Row Level Security (RLS) Policies
-- ================================================

-- Enable RLS on both tables
ALTER TABLE salam_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobily_customers ENABLE ROW LEVEL SECURITY;

-- Salam RLS Policies
CREATE POLICY "Users can view their own salam customers"
    ON salam_customers
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own salam customers"
    ON salam_customers
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own salam customers"
    ON salam_customers
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own salam customers"
    ON salam_customers
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Mobily RLS Policies
CREATE POLICY "Users can view their own mobily customers"
    ON mobily_customers
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mobily customers"
    ON mobily_customers
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mobily customers"
    ON mobily_customers
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mobily customers"
    ON mobily_customers
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ================================================
-- 7. Create helper functions for the new tables
-- ================================================

-- Check if Salam customer exists by identity number
CREATE OR REPLACE FUNCTION check_salam_customer_exists(p_identity_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM salam_customers
        WHERE identity_number = p_identity_number
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if Mobily customer exists by identity number
CREATE OR REPLACE FUNCTION check_mobily_customer_exists(p_identity_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM mobily_customers
        WHERE identity_number = p_identity_number
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get recent Salam customers
CREATE OR REPLACE FUNCTION get_recent_salam_customers(p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name TEXT,
    identity_number TEXT,
    phone_number TEXT,
    sim_number TEXT,
    device_number TEXT,
    nationality TEXT,
    register_number TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.user_id,
        s.name,
        s.identity_number,
        s.phone_number,
        s.sim_number,
        s.device_number,
        s.nationality,
        s.register_number,
        s.created_at,
        s.updated_at
    FROM salam_customers s
    WHERE s.user_id = auth.uid()
    ORDER BY s.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get recent Mobily customers
CREATE OR REPLACE FUNCTION get_recent_mobily_customers(p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
    id UUID,
    user_id UUID,
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
        m.id,
        m.user_id,
        m.name,
        m.identity_number,
        m.phone_number,
        m.sim_number,
        m.device_number,
        m.nationality,
        m.register_number,
        m.birth_date,
        m.identity_expiry_date,
        m.package,
        m.email,
        m.city,
        m.district,
        m.created_at,
        m.updated_at
    FROM mobily_customers m
    WHERE m.user_id = auth.uid()
    ORDER BY m.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 8. Drop old unified customers table
-- ================================================

-- First drop dependencies
DROP FUNCTION IF EXISTS check_customer_exists(TEXT, project_type);
DROP FUNCTION IF EXISTS get_recent_customers(project_type, INTEGER);

-- Drop indexes
DROP INDEX IF EXISTS idx_customers_user_id;
DROP INDEX IF EXISTS idx_customers_project_type;
DROP INDEX IF EXISTS idx_customers_identity_number;
DROP INDEX IF EXISTS idx_customers_created_at;
DROP INDEX IF EXISTS idx_customers_project_created;

-- Drop the unified customers table
DROP TABLE IF EXISTS customers CASCADE;

-- Drop the project_type enum as it's no longer needed
DROP TYPE IF EXISTS project_type CASCADE;

-- ================================================
-- Migration complete
-- ================================================
