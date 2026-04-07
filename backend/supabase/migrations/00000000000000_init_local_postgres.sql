-- =====================================================
-- Initial Setup for Local PostgreSQL
-- This creates the necessary schemas and extensions
-- that Supabase provides by default.
-- Safe for execution on both local and Supabase instances.
-- =====================================================

-- 1. SCHEMAS
-- We ensure schemas exist. In Supabase, these are built-in.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        CREATE SCHEMA auth;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'storage') THEN
        CREATE SCHEMA storage;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'extensions') THEN
        CREATE SCHEMA extensions;
    END IF;
END $$;

-- 2. EXTENSIONS
-- Supabase extensions are usually in the 'extensions' schema.
-- We enable them safely.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;

-- 3. AUTH TABLES (Simplified for local dev)
-- References to extensions.uuid_generate_v4() assume extensions schema is in search_path or fully qualified.
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    encrypted_password VARCHAR(255) NOT NULL,
    email_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_sign_in_at TIMESTAMPTZ,
    raw_app_meta_data JSONB DEFAULT '{}'::jsonb,
    raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
    is_super_admin BOOLEAN DEFAULT FALSE,
    role VARCHAR(255) DEFAULT 'authenticated'
);

CREATE INDEX IF NOT EXISTS users_email_idx ON auth.users(email);

-- 4. STORAGE TABLES
CREATE TABLE IF NOT EXISTS storage.buckets (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    owner UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    public BOOLEAN DEFAULT FALSE,
    avif_autodetection BOOLEAN DEFAULT FALSE,
    file_size_limit BIGINT,
    allowed_mime_types TEXT[]
);

CREATE TABLE IF NOT EXISTS storage.objects (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    bucket_id TEXT REFERENCES storage.buckets(id),
    name TEXT NOT NULL,
    owner UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    -- GENERATED ALWAYS AS requires special handling if table already exists without it
    UNIQUE(bucket_id, name)
);

-- Safely add generated column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'storage' AND table_name = 'objects' AND column_name = 'path_tokens') THEN
        ALTER TABLE storage.objects ADD COLUMN path_tokens TEXT[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED;
    END IF;
END $$;

-- 5. PERMISSIONS
-- Grant necessary permissions safely
DO $$
BEGIN
    EXECUTE 'GRANT USAGE ON SCHEMA auth TO PUBLIC';
    EXECUTE 'GRANT USAGE ON SCHEMA storage TO PUBLIC';
    EXECUTE 'GRANT USAGE ON SCHEMA extensions TO PUBLIC';
    EXECUTE 'GRANT USAGE ON SCHEMA public TO PUBLIC';
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Skipped some grant usage commands: %', SQLERRM;
END $$;

-- Grant permissions on auth.users
DO $$
BEGIN
    EXECUTE 'GRANT SELECT ON auth.users TO PUBLIC';
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Skipped grant select on auth.users: %', SQLERRM;
END $$;

-- 6. UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auth.users updated_at safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_auth_users_updated_at') THEN
        CREATE TRIGGER handle_auth_users_updated_at
            BEFORE UPDATE ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

COMMENT ON SCHEMA auth IS 'Authentication schema - contains user accounts';
COMMENT ON SCHEMA storage IS 'Storage schema - contains file storage metadata';
COMMENT ON TABLE auth.users IS 'User accounts table';
COMMENT ON TABLE storage.buckets IS 'Storage buckets for file organization';
COMMENT ON TABLE storage.objects IS 'Stored files metadata';
