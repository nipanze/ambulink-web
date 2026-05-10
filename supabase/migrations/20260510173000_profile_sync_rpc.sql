-- Cloud-safe profile sync for Supabase Auth users.
-- Run this in Supabase SQL Editor if login shows:
-- "Profile creation failed: permission denied for schema public".

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ensure_user_profile(
    p_email      TEXT,
    p_first_name TEXT DEFAULT NULL,
    p_last_name  TEXT DEFAULT NULL,
    p_phone      TEXT DEFAULT NULL,
    p_role       TEXT DEFAULT NULL
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
    v_user public.users;
    v_role public.user_role;
BEGIN
    IF p_email IS NULL OR LENGTH(TRIM(p_email)) = 0 THEN
        RAISE EXCEPTION 'email is required';
    END IF;

    v_role := CASE
        WHEN p_role IN ('patient', 'driver', 'institution_rep', 'admin')
            THEN p_role::public.user_role
        WHEN p_email ILIKE '%@ambulink.ug'
            THEN 'admin'::public.user_role
        ELSE 'patient'::public.user_role
    END;

    INSERT INTO public.users (
        email,
        password_hash,
        first_name,
        last_name,
        phone,
        role
    )
    VALUES (
        LOWER(TRIM(p_email)),
        'managed_by_supabase_auth',
        COALESCE(NULLIF(TRIM(p_first_name), ''), CASE WHEN v_role = 'admin' THEN 'Admin' ELSE 'User' END),
        COALESCE(NULLIF(TRIM(p_last_name), ''), ''),
        NULLIF(TRIM(p_phone), ''),
        v_role
    )
    ON CONFLICT (email) DO UPDATE SET
        first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), public.users.first_name),
        last_name  = COALESCE(NULLIF(EXCLUDED.last_name,  ''), public.users.last_name),
        phone      = COALESCE(EXCLUDED.phone, public.users.phone),
        updated_at = NOW()
    RETURNING * INTO v_user;

    IF v_user.role = 'patient' THEN
        INSERT INTO public.patients (user_id)
        VALUES (v_user.id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN v_user;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_user_profile(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
    synced_user public.users;
BEGIN
    SELECT *
    INTO synced_user
    FROM public.ensure_user_profile(
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'role'
    );

    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
        || jsonb_build_object('db_user_id', synced_user.id)
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
