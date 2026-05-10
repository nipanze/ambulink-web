-- ============================================================
-- AMBULINK — Auth Synchronization Migration
-- ============================================================

-- 0. Prepare public.users for Auth sync
-- If we use Supabase Auth, profile data comes from metadata, so we make these optional.
ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN last_name DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;

-- 1. Create Sync Trigger Function
-- This ensures that any new user signing up via Supabase Auth 
-- automatically gets a entry in the public.users table.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_db_id INT;
BEGIN
    INSERT INTO public.users (email, first_name, last_name, role)
    VALUES (
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'patient'::user_role)
    )
    ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email 
    RETURNING id INTO new_db_id;

    -- Sync back the public ID to auth metadata so getCurrentUser() works
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('db_user_id', new_db_id)
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. (Simplified) Auth seeding will happen in seed.sql to ensure public.users is already populated.

