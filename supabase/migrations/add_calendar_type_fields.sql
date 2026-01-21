-- ============================================
-- Add calendar type fields to mobily_customers and customers tables
-- ============================================

-- Add calendar type enum
DO $$ BEGIN
    CREATE TYPE calendar_type AS ENUM ('gregorian', 'hijri');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add calendar type columns to mobily_customers table (if table exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'mobily_customers'
    ) THEN
        ALTER TABLE public.mobily_customers
        ADD COLUMN IF NOT EXISTS birth_date_calendar_type calendar_type DEFAULT 'gregorian' NOT NULL,
        ADD COLUMN IF NOT EXISTS identity_expiry_date_calendar_type calendar_type DEFAULT 'gregorian' NOT NULL;

        -- Add indexes for better query performance
        CREATE INDEX IF NOT EXISTS idx_mobily_customers_birth_calendar ON public.mobily_customers(birth_date_calendar_type);
        CREATE INDEX IF NOT EXISTS idx_mobily_customers_identity_expiry_calendar ON public.mobily_customers(identity_expiry_date_calendar_type);

        -- Update existing records to have 'gregorian' as default
        UPDATE public.mobily_customers
        SET birth_date_calendar_type = 'gregorian',
            identity_expiry_date_calendar_type = 'gregorian'
        WHERE birth_date_calendar_type IS NULL
           OR identity_expiry_date_calendar_type IS NULL;

        RAISE NOTICE '✅ Added calendar type fields to mobily_customers table';
    ELSE
        RAISE NOTICE '⚠️  mobily_customers table does not exist, skipping...';
    END IF;
END $$;

-- Add calendar type columns to unified customers table (if table exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'customers'
    ) THEN
        ALTER TABLE public.customers
        ADD COLUMN IF NOT EXISTS birth_date_calendar_type calendar_type DEFAULT 'gregorian',
        ADD COLUMN IF NOT EXISTS identity_expiry_date_calendar_type calendar_type DEFAULT 'gregorian';

        -- Add indexes for better query performance
        CREATE INDEX IF NOT EXISTS idx_customers_birth_calendar ON public.customers(birth_date_calendar_type);
        CREATE INDEX IF NOT EXISTS idx_customers_identity_expiry_calendar ON public.customers(identity_expiry_date_calendar_type);

        -- Update existing records to have 'gregorian' as default
        UPDATE public.customers
        SET birth_date_calendar_type = 'gregorian',
            identity_expiry_date_calendar_type = 'gregorian'
        WHERE (birth_date IS NOT NULL AND birth_date_calendar_type IS NULL)
           OR (identity_expiry_date IS NOT NULL AND identity_expiry_date_calendar_type IS NULL);

        RAISE NOTICE '✅ Added calendar type fields to customers table';
    ELSE
        RAISE NOTICE '⚠️  customers table does not exist, skipping...';
    END IF;
END $$;
