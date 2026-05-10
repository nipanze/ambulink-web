-- Fix role fallback so driver/patient @ambulink.ug accounts do not become admins.
-- Run this if you already ran 20260510173000_profile_sync_rpc.sql.

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
        WHEN LOWER(TRIM(p_email)) = 'admin@ambulink.ug'
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
        role       = CASE
            WHEN public.users.email = 'admin@ambulink.ug' THEN 'admin'::public.user_role
            ELSE public.users.role
        END,
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

UPDATE public.users
SET role = 'driver'::public.user_role,
    updated_at = NOW()
WHERE email = 'driver.ssali@ambulink.ug'
  AND role <> 'driver'::public.user_role;

UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', 'driver')
WHERE email = 'driver.ssali@ambulink.ug';
