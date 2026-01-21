-- ============================================
-- Add calendar type fields to mobily_customers and customers tables
-- ============================================

-- Add calendar type enum
DO $$ BEGIN
    CREATE TYPE calendar_type AS ENUM ('gregorian', 'hijri');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add calendar type columns to mobily_customers table
ALTER TABLE public.mobily_customers
ADD COLUMN IF NOT EXISTS birth_date_calendar_type calendar_type DEFAULT 'gregorian' NOT NULL,
ADD COLUMN IF NOT EXISTS identity_expiry_date_calendar_type calendar_type DEFAULT 'gregorian' NOT NULL;

-- Add calendar type columns to unified customers table
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS birth_date_calendar_type calendar_type DEFAULT 'gregorian',
ADD COLUMN IF NOT EXISTS identity_expiry_date_calendar_type calendar_type DEFAULT 'gregorian';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mobily_customers_birth_calendar ON public.mobily_customers(birth_date_calendar_type);
CREATE INDEX IF NOT EXISTS idx_mobily_customers_identity_expiry_calendar ON public.mobily_customers(identity_expiry_date_calendar_type);
CREATE INDEX IF NOT EXISTS idx_customers_birth_calendar ON public.customers(birth_date_calendar_type);
CREATE INDEX IF NOT EXISTS idx_customers_identity_expiry_calendar ON public.customers(identity_expiry_date_calendar_type);

-- Update existing records to have 'gregorian' as default (already done by DEFAULT clause, but being explicit)
UPDATE public.mobily_customers
SET birth_date_calendar_type = 'gregorian',
    identity_expiry_date_calendar_type = 'gregorian'
WHERE birth_date_calendar_type IS NULL
   OR identity_expiry_date_calendar_type IS NULL;

UPDATE public.customers
SET birth_date_calendar_type = 'gregorian',
    identity_expiry_date_calendar_type = 'gregorian'
WHERE (birth_date IS NOT NULL AND birth_date_calendar_type IS NULL)
   OR (identity_expiry_date IS NOT NULL AND identity_expiry_date_calendar_type IS NULL);
